import type { PhotoWalkCamera } from "./photo-walk-progress";

// Keep the pure camera geometry importable by the native Node unit tests.
if (typeof document !== "undefined") void import("./photo-walk-interaction.css");

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export function cameraBox(width: number, height: number, camera: PhotoWalkCamera, overview = false) {
  const scale = (overview ? Math.min(width / 1920, height / 1080) : Math.max(width / 1920, height / 1080)) * (overview ? 1 : camera.zoom);
  const w = 1920 * scale, h = 1080 * scale;
  return {
    width: w, height: h,
    left: w <= width ? (width - w) / 2 : clamp(width / 2 - camera.x * w, width - w, 0),
    top: h <= height ? (height - h) / 2 : clamp(height / 2 - camera.y * h, height - h, 0),
  };
}

/** Direct manipulation only: no inertia, synthetic perspective or global listeners. */
export function mountPhotoCamera(viewport: HTMLElement, surface: HTMLElement, onChange: (camera: PhotoWalkCamera) => void) {
  let camera: PhotoWalkCamera = { x: .5, y: .5, zoom: 1 };
  let overview = false;
  let suppressClick = false;
  let dragged = false;
  let start = { x: 0, y: 0 };
  const pointers = new Map<number, { x: number; y: number }>();
  const signal = new AbortController();
  const bounds = () => cameraBox(viewport.clientWidth, viewport.clientHeight, camera, overview);
  function render() {
    const box = bounds();
    surface.style.width = `${box.width}px`; surface.style.height = `${box.height}px`;
    surface.style.left = "0"; surface.style.top = "0";
    surface.style.transform = `translate3d(${box.left}px, ${box.top}px, 0)`;
    // Store the actual visible centre, so resizing and edge drags don't jump.
    if (!overview) {
      camera.x = (viewport.clientWidth / 2 - box.left) / box.width;
      camera.y = (viewport.clientHeight / 2 - box.top) / box.height;
    }
    viewport.dataset.overview = String(overview);
    viewport.dataset.zoom = camera.zoom.toFixed(2);
  }
  function pan(dx: number, dy: number) {
    if (overview) return;
    const box = bounds();
    camera.x -= dx / box.width; camera.y -= dy / box.height;
    render();
  }
  function zoomTo(value: number, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    const before = bounds();
    const point = { x: (x - before.left) / before.width, y: (y - before.top) / before.height };
    overview = false; camera.zoom = clamp(value, 1, 2.5);
    const after = bounds();
    camera.x = point.x + (viewport.clientWidth / 2 - x) / after.width;
    camera.y = point.y + (viewport.clientHeight / 2 - y) / after.height;
    render();
  }
  function focusAt(x: number, y: number) {
    // Low clues must come out from behind the fixed travel controls.
    camera.zoom = Math.max(camera.zoom, y > .72 ? 2.2 : 1);
    camera.x = x; camera.y = y; overview = false; render();
    onChange({ ...camera });
  }
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || viewport.closest('[data-busy="true"], [data-detail]')) return;
    // A press may become a pan: don't focus/reveal the hotspot or start native
    // selection before we know whether the user intended a tap. Click remains
    // the activation event, including on touch; keyboard focus is unaffected.
    // Cancelling a touch pointerdown also suppresses its eventual tap in some
    // engines. Touch selection is blocked by touch-action/CSS/selectstart.
    if (event.pointerType === "mouse") event.preventDefault();
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && viewport.contains(focused) && focused !== viewport) focused.blur();
    if (!pointers.size) { dragged = false; suppressClick = false; start = { x: event.clientX, y: event.clientY }; }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    // Capture on the original hit target so a tiny movement out of the frame
    // still finishes the gesture, while an ordinary tap keeps its button target.
    if (event.target instanceof Element) event.target.setPointerCapture(event.pointerId);
  }, { signal: signal.signal });
  const preventNativeSelection = (event: Event) => event.preventDefault();
  viewport.addEventListener("dragstart", preventNativeSelection, { capture: true, signal: signal.signal });
  viewport.addEventListener("selectstart", preventNativeSelection, { capture: true, signal: signal.signal });
  viewport.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    if (!dragged && pointers.size === 1 && Math.hypot(next.x - start.x, next.y - start.y) < 7) return;
    dragged = true; suppressClick = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-dragging");
    if (pointers.size === 2) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)![1];
      const oldDistance = Math.hypot(previous.x - other.x, previous.y - other.y);
      const newDistance = Math.hypot(next.x - other.x, next.y - other.y);
      const rect = viewport.getBoundingClientRect();
      if (oldDistance > 0) zoomTo(camera.zoom * newDistance / oldDistance, (next.x + other.x) / 2 - rect.left, (next.y + other.y) / 2 - rect.top);
    } else pan(next.x - previous.x, next.y - previous.y);
    pointers.set(event.pointerId, next);
  }, { signal: signal.signal });
  const end = (event: PointerEvent) => {
    if (!pointers.delete(event.pointerId)) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (!pointers.size) { viewport.classList.remove("is-dragging"); if (dragged) onChange({ ...camera }); }
  };
  viewport.addEventListener("pointerup", end, { signal: signal.signal });
  viewport.addEventListener("pointercancel", end, { signal: signal.signal });
  viewport.addEventListener("lostpointercapture", (event) => { if (event.target === viewport) end(event); }, { signal: signal.signal });
  viewport.addEventListener("click", (event) => {
    // Keyboard/assistive activation must still work after a cancelled drag.
    if (suppressClick && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, { capture: true, signal: signal.signal });
  viewport.addEventListener("wheel", (event) => {
    if (viewport.closest('[data-busy="true"], [data-detail]')) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoomTo(camera.zoom * Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top);
    onChange({ ...camera });
  }, { passive: false, signal: signal.signal });
  viewport.addEventListener("keydown", (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey || viewport.closest('[data-busy="true"]')) return;
    const moves: Record<string, [number, number]> = { ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100] };
    if (!moves[event.key]) return;
    event.preventDefault(); event.stopPropagation(); pan(...moves[event.key]); onChange({ ...camera });
  }, { signal: signal.signal });
  // Keyboard focus reveals off-screen targets without scrolling the app shell.
  viewport.addEventListener("focusin", (event) => {
    const node = event.target;
    if (!(node instanceof HTMLElement) || !node.matches(".pw-object, .pw-lens, .pw-ground-link")) return;
    viewport.scrollLeft = 0; viewport.scrollTop = 0;
    const rect = node.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
    if (rect.left < frame.left + 10 || rect.right > frame.right - 10 || rect.top < frame.top + 80 || rect.bottom > frame.bottom - 150) {
      const centered = node.dataset.anchorCentered === "true" || node.matches(".pw-ground-link");
      const x = (parseFloat(node.style.left) + (centered ? 0 : parseFloat(node.style.width || "0") / 2)) / 100;
      const y = (parseFloat(node.style.top) + (centered ? 0 : parseFloat(node.style.height || "0") / 2)) / 100;
      focusAt(x, y);
    }
  }, { signal: signal.signal });
  const observer = new ResizeObserver(render);
  observer.observe(viewport); render();
  return {
    set(value: PhotoWalkCamera) { camera = { ...value }; overview = false; render(); },
    get: () => ({ ...camera }),
    focus: focusAt,
    zoom(delta: number) { zoomTo(camera.zoom + delta); onChange({ ...camera }); },
    toggleOverview() { overview = !overview; render(); return overview; },
    dispose() { signal.abort(); observer.disconnect(); pointers.clear(); },
  };
}
