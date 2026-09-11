import { useEffect, useRef } from "react";
import { getWalkView } from "./street-view-data";

// Artistic camera offsets: turn and advance, not real-world measurements.
// A smooth depth field keeps straight surfaces coherent during movement.
const cameras: Record<string, [number, number]> = {
  wetland: [0, 0],
  "wetland-path": [.045, 1],
  "wetland-branches": [.33, .1],
};

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D beforeImage;
uniform sampler2D afterImage;
uniform vec2 travel;
uniform float progress;
varying vec2 uv;

vec2 motionAt(vec2 point) {
  float depth = clamp((point.y - .28) / .72, 0., 1.);
  vec2 movement = vec2(travel.x * (.75 + .25 * depth), 0.);
  movement += (point - vec2(.28, .32)) * vec2(.55, .70) * travel.y * depth;
  return movement;
}
float inFrame(vec2 point) {
  vec2 edge = min(point, 1. - point);
  return smoothstep(-.015, .015, min(edge.x, edge.y));
}
vec4 movingSample(sampler2D source, vec2 point, vec2 smear) {
  return texture2D(source, point) * .5
    + texture2D(source, point - smear) * .25
    + texture2D(source, point + smear) * .25;
}
void main() {
  vec2 movement = motionAt(uv);
  vec2 oldPoint = uv - movement * progress;
  vec2 newPoint = uv + movement * (1. - progress);
  // Swap during the middle of the travel, while both views are moving.
  // A short blend avoids a long stationary double exposure.
  float blend = smoothstep(.43, .57, progress);
  float oldWeight = (1. - blend) * inFrame(oldPoint);
  float newWeight = blend * inFrame(newPoint);
  float amount = newWeight / max(.0001, oldWeight + newWeight);
  if (oldWeight + newWeight < .001) amount = blend;
  // Newly uncovered margins come from the full destination view. Never extend
  // an edge texel into the frame: that produces visible stretched stripes.
  oldPoint = mix(uv, oldPoint, inFrame(oldPoint));
  newPoint = mix(uv, newPoint, inFrame(newPoint));
  vec2 smear = movement * .008 * sin(progress * 3.14159265);
  gl_FragColor = mix(movingSample(beforeImage, oldPoint, smear),
                    movingSample(afterImage, newPoint, smear), amount);
}`;

export function StreetViewTransition({ from, to, complete }: {
  from: string;
  to: string;
  complete: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const onComplete = useRef(complete);
  onComplete.current = complete;
  useEffect(() => {
    const element = canvas.current!;
    const start = getWalkView(from);
    const end = getWalkView(to);
    let frame = 0;
    let cancelled = false;
    let release = () => {};
    const finish = () => { if (!cancelled) onComplete.current(); };
    const hidden = () => { if (document.hidden) finish(); };
    document.addEventListener("visibilitychange", hidden);
    const render = async () => {
      if (!start || !end || window.matchMedia("(prefers-reduced-motion: reduce)").matches || element.closest(".calm")) {
        finish();
        return;
      }
      const images = await Promise.all([start.image, end.image].map(async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        return image;
      }));
      if (cancelled) return;
      const gl = element.getContext("webgl", { alpha: false, antialias: false });
      if (!gl) { finish(); return; }
      const shaders: WebGLShader[] = [];
      const textures: WebGLTexture[] = [];
      const program = gl.createProgram()!;
      const buffer = gl.createBuffer();
      release = () => {
        textures.forEach(texture => gl.deleteTexture(texture));
        shaders.forEach(shader => gl.deleteShader(shader));
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
      for (const [kind, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
        const shader = gl.createShader(kind)!;
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Walk shader unavailable");
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Walk renderer unavailable");
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      images.forEach((image, index) => {
        const texture = gl.createTexture()!;
        textures.push(texture);
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(gl.getUniformLocation(program, index ? "afterImage" : "beforeImage"), index);
      });
      gl.uniform2f(gl.getUniformLocation(program, "travel"),
        cameras[to][0] - cameras[from][0], cameras[to][1] - cameras[from][1]);
      const progress = gl.getUniformLocation(program, "progress");
      gl.viewport(0, 0, element.width, element.height);
      const began = performance.now();
      const draw = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - began) / 950);
        gl.uniform1f(progress, t * t * (3 - 2 * t));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (t < 1) frame = requestAnimationFrame(draw);
        else finish();
      };
      draw(began);
    };
    void render().catch(finish);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", hidden);
      release();
    };
  }, [from, to]);
  return <canvas ref={canvas} width={1200} height={800}
    className="walk-transition" aria-hidden="true"
    style={{ backgroundImage: `url(${getWalkView(from)?.image})` }} />;
}
