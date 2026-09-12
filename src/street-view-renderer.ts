export type ViewDirection = { yaw: number; pitch: number; fov: number };
export const radians = (degrees: number) => degrees * Math.PI / 180;
export const wrapAngle = (degrees: number) => ((degrees + 180) % 360 + 360) % 360 - 180;

// The DOM markers and the panorama use the same rectilinear camera projection.
export function projectDirection(yaw: number, pitch: number, camera: ViewDirection,
  width: number, height: number) {
  const bearing = radians(yaw - camera.yaw);
  const elevation = radians(pitch);
  const tilt = radians(camera.pitch);
  const x = Math.sin(bearing) * Math.cos(elevation);
  const y = Math.sin(elevation);
  const z = Math.cos(bearing) * Math.cos(elevation);
  const depth = y * Math.sin(tilt) + z * Math.cos(tilt);
  const vertical = y * Math.cos(tilt) - z * Math.sin(tilt);
  const focal = width / (2 * Math.tan(radians(camera.fov / 2)));
  const left = width / 2 + x * focal / depth;
  const top = height / 2 - vertical * focal / depth;
  return { left, top, visible: depth > 0.05 && left > -60 && left < width + 60 && top > 0 && top < height };
}

const vertexSource = `
  attribute vec2 position;
  varying vec2 screen;
  void main() {
    screen = position;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;
const fragmentSource = `
  precision highp float;
  varying vec2 screen;
  uniform sampler2D previous;
  uniform sampler2D next;
  uniform vec3 camera;
  uniform float aspect;
  uniform float blend;
  const float PI = 3.141592653589793;
  vec4 panoramaSample(sampler2D image, vec2 uv) {
    // Feather the small capture overlap at the back of the panorama.
    // Both sides of longitude ±180 sample the same edge blend.
    float overlap = 0.5 * (1.0 - smoothstep(0.0, 0.012, min(uv.x, 1.0 - uv.x)));
    return mix(texture2D(image, uv), texture2D(image, vec2(1.0 - uv.x, uv.y)), overlap);
  }
  void main() {
    vec3 ray = normalize(vec3(screen.x * camera.z, screen.y * camera.z / aspect, 1.0));
    float cp = cos(camera.y), sp = sin(camera.y);
    ray = vec3(ray.x, ray.y * cp + ray.z * sp, ray.z * cp - ray.y * sp);
    float cy = cos(camera.x), sy = sin(camera.x);
    ray = vec3(ray.x * cy + ray.z * sy, ray.y, ray.z * cy - ray.x * sy);
    vec2 uv = vec2(fract(0.5 + atan(ray.x, ray.z) / (2.0 * PI)), 0.5 - asin(clamp(ray.y, -1.0, 1.0)) / PI);
    gl_FragColor = mix(panoramaSample(previous, uv), panoramaSample(next, uv), blend);
  }
`;

export function createPanoramaRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  if (!gl) throw new Error("PANORAMA_WEBGL_UNAVAILABLE");
  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  let frame = 0;
  let disposed = false;
  let finishTransition: (() => void) | null = null;
  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    finishTransition?.();
    finishTransition = null;
    textures.forEach((texture) => gl.deleteTexture(texture));
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  try {
    if (!program || !buffer) throw new Error("PANORAMA_RESOURCES_UNAVAILABLE");
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("PANORAMA_SHADER_UNAVAILABLE");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("PANORAMA_SHADER_FAILED");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("PANORAMA_PROGRAM_FAILED");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    for (let index = 0; index < 2; index++) {
      const texture = gl.createTexture();
      if (!texture) throw new Error("PANORAMA_TEXTURE_UNAVAILABLE");
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([31, 42, 31]));
    }
  } catch (error) {
    dispose();
    throw error;
  }
  const cameraLocation = gl.getUniformLocation(program!, "camera");
  const aspectLocation = gl.getUniformLocation(program!, "aspect");
  const blendLocation = gl.getUniformLocation(program!, "blend");
  const previousLocation = gl.getUniformLocation(program!, "previous");
  const nextLocation = gl.getUniformLocation(program!, "next");
  let direction: ViewDirection = { yaw: -26, pitch: -12, fov: 95 };
  let current = 0;
  let incoming = 0;
  let blend = 1;
  let hasImage = false;
  function draw(camera = direction) {
    direction = camera;
    if (disposed || gl!.isContextLost() || document.hidden) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl!.viewport(0, 0, width, height);
    gl!.uniform3f(cameraLocation, radians(camera.yaw), radians(camera.pitch), Math.tan(radians(camera.fov / 2)));
    gl!.uniform1f(aspectLocation, width / height);
    gl!.uniform1f(blendLocation, blend);
    gl!.uniform1i(previousLocation, current);
    gl!.uniform1i(nextLocation, incoming);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }
  async function show(image: HTMLImageElement, duration: number) {
    if (disposed) return;
    cancelAnimationFrame(frame);
    finishTransition?.();
    current = incoming;
    incoming = 1 - current;
    gl!.activeTexture(gl!.TEXTURE0 + incoming);
    gl!.bindTexture(gl!.TEXTURE_2D, textures[incoming]);
    if (image.naturalWidth > gl!.getParameter(gl!.MAX_TEXTURE_SIZE)) throw new Error("PANORAMA_TEXTURE_TOO_LARGE");
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, image);
    if (!hasImage || duration === 0 || document.hidden) {
      hasImage = true;
      blend = 1;
      draw();
      return;
    }
    blend = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      finishTransition = resolve;
      const animate = (now: number) => {
        const progress = document.hidden ? 1 : Math.min(1, (now - start) / duration);
        blend = progress * progress * (3 - 2 * progress);
        draw();
        if (progress < 1 && !disposed) frame = requestAnimationFrame(animate);
        else { finishTransition = null; resolve(); }
      };
      frame = requestAnimationFrame(animate);
    });
  }
  return { draw, show, dispose };
}

export type PanoramaRenderer = ReturnType<typeof createPanoramaRenderer>;
