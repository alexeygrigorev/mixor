import type { PhotoWalkView, PhotoWalkDetail, PhotoWalkObject, PhotoWalkLink } from "./photo-walk-data";

export type PhotoWalkOptions = {
  views: readonly PhotoWalkView[];
  entry: string;
  fadeMs?: number;
  resolveImage?: (path: string) => string;
  reducedMotion?: () => boolean;
  onNavigate: (id: string) => void;
  onBack: () => void;
  backLabel?: string;
  onPreviousPlace?: () => void;
  onNextPlace?: () => void;
  onObject?: (object: PhotoWalkObject, view: PhotoWalkView) => void;
  onObjectFound?: (object: PhotoWalkObject, view: PhotoWalkView) => void;
};
export type PhotoWalkController = {
  setView: (id: string) => Promise<void>;
  dispose: () => void;
};

export function fitPhoto(width: number, height: number, imageWidth = 1920, imageHeight = 1080) {
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const w = imageWidth * scale, h = imageHeight * scale;
  return { width: w, height: h, left: (width - w) / 2, top: (height - h) / 2 };
}
const svg = (name: string) => {
  const paths: Record<string, string> = {
    back: '<path d="m14 6-6 6 6 6M8 12h13"/>',
    route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h6a4 4 0 0 1 0 8H9a3 3 0 0 0-3 3v1h10"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.2"/>',
    lens: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M7.5 10.5h6M10.5 7.5v6"/>',
    chevron: '<path d="m4 15 8-8 8 8"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;
};
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(className: string, label: string, icon: string, action: () => void) {
  const node = element("button", className);
  node.type = "button";
  node.setAttribute("aria-label", label);
  // Icon markup is a local constant. Content/captions always use textContent.
  node.innerHTML = svg(icon);
  node.addEventListener("click", action);
  return node;
}

/** DOM renderer shared by the React scene and the dependency-free preview.
 * No panorama renderer, global hash listener, audio player or storage ownership.
 * The host application owns route/history, sounds, and discoveries.
 */
export function mountPhotoWalk(root: HTMLElement, options: PhotoWalkOptions): PhotoWalkController {
  const resolve = options.resolveImage ?? ((path: string) => path);
  const lookup = new Map(options.views.map((view) => [view.id, view]));
  const entry = lookup.get(options.entry);
  if (!entry) throw new Error("Photo walk entry is missing");
  let current: PhotoWalkView | null = null;
  let currentLayer: HTMLElement | null = null;
  let detail: PhotoWalkDetail | null = null;
  let detailReturn: HTMLElement | null = null;
  let objectReturn: HTMLButtonElement | null = null;
  let dead = false, busy = false, revision = 0;
  let transition: Animation | null = null;
  let retry: (() => void) | null = null;
  let lastId = "";
  const visited = new Set<string>();
  const images = new Map<string, Promise<HTMLImageElement>>();
  const pendingImages = new Set<() => void>();
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const foundObjects = new Set<string>();
  const objectTotal = options.views.reduce((total, view) => total + view.objects.length, 0);
  const reduced = () => media.matches || options.reducedMotion?.() === true;
  root.classList.add("photo-walk-scene");
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Сцена 7: лесная прогулка");
  root.tabIndex = -1;
  root.innerHTML = "";
  const viewport = element("div", "pw-viewport");
  const surface = element("div", "pw-surface");
  viewport.append(surface);
  const shade = element("div", "pw-edge-shade");
  const header = element("header", "pw-header");
  const back = button("pw-tool pw-back", options.backLabel ?? "Назад к выбору места", "back", () => {
    if (detail) closeDetail(); else options.onBack();
  });
  const sceneLabel = element("span", "pw-scene-label", "07 / ЛЕСНАЯ ПРОГУЛКА");
  const tools = element("div", "pw-tools");
  const routeButton = button("pw-tool pw-route-button", "Открыть маршрут", "route", openMap);
  routeButton.append(element("span", "", "Маршрут"));
  const infoButton = button("pw-tool pw-info-button", "О кадрах и управлении", "info", openInfo);
  if (options.onPreviousPlace && options.onNextPlace) {
    const places = element("nav", "pw-other-places");
    places.setAttribute("aria-label", "Другие сцены игры");
    const previous = button("pw-tool", "Предыдущее место", "back", options.onPreviousPlace);
    const next = button("pw-tool pw-next-place", "Следующее место", "back", options.onNextPlace);
    previous.title = "Предыдущее место"; next.title = "Следующее место";
    places.append(previous, next); tools.append(places);
  }
  tools.append(routeButton, infoButton);
  header.append(back, sceneLabel, tools);
  const footer = element("footer", "pw-footer");
  const caption = element("div", "pw-caption");
  const eyebrow = element("p", "pw-eyebrow", "ЛЕСНАЯ ПРОГУЛКА");
  const title = element("h2", "pw-title", "Открываем лес…");
  caption.append(eyebrow, title);
  const steps = element("div", "pw-progress");
  const counter = element("span", "pw-counter");
  const findCounter = element("span", "pw-find-counter");
  const dots = element("div", "pw-dots");
  dots.setAttribute("aria-hidden", "true");
  steps.append(dots, counter, findCounter);
  const instruction = element("p", "pw-instruction", "Стрелки — пройти · Лупа — рассмотреть · Ищи детали");
  footer.append(caption, steps, instruction);
  const status = element("div", "pw-status");
  status.setAttribute("role", "status");
  status.hidden = true;
  const announcement = element("p", "pw-sr");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  const dialog = element("dialog", "pw-dialog");
  const closeDialogButton = button("pw-tool pw-dialog-close", "Закрыть окно", "close", closeDialog);
  const dialogContent = element("div", "pw-dialog-content");
  dialog.append(closeDialogButton, dialogContent);
  const closeDetailButton = button("pw-tool pw-detail-close", "Вернуться к общему виду", "close", closeDetail);
  closeDetailButton.append(element("span", "", "Общий вид"));
  closeDetailButton.hidden = true;
  root.append(viewport, shade, header, footer, status, announcement, closeDetailButton, dialog);

  function setBusy(value: boolean) {
    busy = value;
    root.dataset.busy = String(value);
    root.setAttribute("aria-busy", String(value));
  }
  function message(text: string, action?: () => void) {
    retry = action ?? null;
    status.replaceChildren();
    status.hidden = !text;
    if (!text) return;
    status.append(element("span", "", text));
    if (action) {
      const control = button("pw-tool", "Повторить загрузку", "route", () => retry?.());
      control.append(element("span", "", "Повторить"));
      status.append(control);
    }
  }
  function loadImage(path: string): Promise<HTMLImageElement> {
    const url = resolve(path);
    const existing = images.get(url);
    if (existing) return existing;
    const promise = new Promise<HTMLImageElement>((done, fail) => {
      const image = new Image();
      image.decoding = "async";
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        image.onload = null; image.onerror = null;
        pendingImages.delete(cancel);
        if (error) { image.src = ""; fail(error); } else done(image);
      };
      const cancel = () => finish(new Error("Image request cancelled"));
      const timer = window.setTimeout(() => finish(new Error("Image request timed out")), 12000);
      pendingImages.add(cancel);
      image.onload = () => {
        void image.decode().then(() => finish(), () => finish(new Error("Image decode failed")));
      };
      image.onerror = () => finish(new Error("Image load failed"));
      image.src = url;
    });
    images.set(url, promise);
    void promise.catch(() => { if (images.get(url) === promise) images.delete(url); });
    return promise;
  }
  function position(node: HTMLElement, x: number, y: number) {
    node.style.left = `${x}%`; node.style.top = `${y}%`;
  }
  function createLayer(view: PhotoWalkView): HTMLElement {
    const layer = element("div", "pw-photo-layer");
    layer.dataset.view = view.id;
    const composite = element("div", "pw-composite");
    const image = element("img", "pw-image");
    image.src = resolve(view.image);
    image.alt = view.title;
    image.draggable = false;
    composite.append(image);
    const objects = element("div", "pw-objects");
    for (const object of view.objects) {
      const objectNode = element("button", "pw-object") as HTMLButtonElement;
      objectNode.type = "button";
      objectNode.setAttribute("aria-label", `Найти: ${object.label}`);
      objectNode.setAttribute("aria-pressed", String(foundObjects.has(object.id)));
      objectNode.setAttribute("aria-expanded", "false");
      objectNode.addEventListener("click", () => openObject(object, view, objectNode));
      objectNode.dataset.object = object.id;
      objectNode.classList.toggle("is-found", foundObjects.has(object.id));
      position(objectNode, object.x, object.y);
      objectNode.style.width = `${object.width}%`; objectNode.style.height = `${object.height}%`;
      const artwork = element("img", "");
      artwork.src = resolve(object.image); artwork.alt = ""; artwork.draggable = false;
      objectNode.append(artwork); objects.append(objectNode);
    }
    composite.append(objects);
    const links = element("nav", "pw-links");
    links.setAttribute("aria-label", "Переходы между местами");
    for (const link of view.links) {
      const arrow = button("pw-arrow", `Перейти: ${link.label}`, "chevron", () => void step(link));
      arrow.dataset.to = link.to;
      arrow.dataset.motion = link.motion;
      position(arrow, link.x, link.y);
      const icon = arrow.querySelector("svg")!;
      icon.style.transform = `rotate(${link.angle}deg) scaleY(.58)`;
      arrow.append(element("span", "pw-arrow-label", link.label));
      links.append(arrow);
    }
    const details = element("div", "pw-details");
    for (const spot of view.details) {
      const control = button("pw-lens", `Рассмотреть: ${spot.title}`, "lens", () => openDetail(spot, control));
      control.dataset.detail = spot.id;
      control.append(element("span", "pw-lens-label", spot.title));
      position(control, spot.anchorX, spot.anchorY);
      details.append(control);
    }
    layer.append(composite, links, details);
    return layer;
  }
  function updateCaption() {
    if (!current) return;
    const index = options.views.findIndex((view) => view.id === current!.id);
    title.textContent = detail?.title ?? current.title;
    eyebrow.textContent = detail ? `УВЕЛИЧЕНИЕ КАДРА · ${(100 / detail.width).toFixed(1).replace(".", ",")}×` : `ОСТАНОВКА ${String(index + 1).padStart(2, "0")}`;
    instruction.textContent = detail ? "Цифровое увеличение · Esc — общий вид" : "Стрелки — пройти · Лупа — рассмотреть · Ищи детали";
    counter.textContent = `${visited.size} / ${options.views.length} мест`;
    counter.setAttribute("aria-label", `Посещено ${visited.size} из ${options.views.length} мест`);
    findCounter.textContent = objectTotal ? `Находки ${foundObjects.size} / ${objectTotal}` : "";
    findCounter.setAttribute("aria-label", `Найдено скрытых деталей: ${foundObjects.size} из ${objectTotal}`);
    dots.replaceChildren(...options.views.map((view) => {
      const dot = element("span", "pw-dot");
      dot.classList.toggle("is-current", current!.id === view.id);
      dot.classList.toggle("is-visited", visited.has(view.id));
      return dot;
    }));
  }
  function applyCrop() {
    if (!currentLayer) return;
    const composite = currentLayer.querySelector<HTMLElement>(".pw-composite")!;
    if (!detail) { composite.style.transform = ""; return; }
    composite.style.transform = `scale(${100 / detail.width}) translate(${-detail.x}%, ${-detail.y}%)`;
  }
  function openDetail(spot: PhotoWalkDetail, trigger: HTMLElement) {
    if (busy || dead || !current) return;
    detail = spot; detailReturn = trigger;
    root.dataset.detail = spot.id;
    closeDetailButton.hidden = false;
    updateCaption(); applyCrop();
    announcement.textContent = `Увеличение кадра: ${spot.title}`;
    closeDetailButton.focus({ preventScroll: true });
  }
  function closeDetail() {
    if (!detail) return;
    detail = null; delete root.dataset.detail;
    closeDetailButton.hidden = true;
    updateCaption(); applyCrop();
    if (detailReturn?.isConnected) detailReturn.focus({ preventScroll: true });
    detailReturn = null;
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
    else restoreDialogFocus();
  }
  function restoreDialogFocus() {
    const trigger = objectReturn;
    objectReturn = null;
    if (!trigger?.isConnected) return;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus({ preventScroll: true });
  }
  function showDialog(heading: string, contents: HTMLElement[]) {
    closeDialog();
    const h = element("h3", "pw-dialog-heading", heading);
    h.id = "pw-dialog-heading";
    dialog.setAttribute("aria-labelledby", h.id);
    dialogContent.replaceChildren(h, ...contents);
    dialog.showModal();
  }
  function openObject(item: PhotoWalkObject, view: PhotoWalkView, trigger: HTMLButtonElement) {
    if (busy || dead || detail) return;
    const isNew = !foundObjects.has(item.id);
    if (isNew) {
      foundObjects.add(item.id);
      trigger.classList.add("is-found");
      trigger.setAttribute("aria-pressed", "true");
      options.onObjectFound?.(item, view);
      updateCaption();
    }
    options.onObject?.(item, view);
    const card = element("div", "pw-object-card");
    const visual = element("div", "pw-object-visual");
    const image = element("img", "pw-object-image");
    image.src = resolve(item.image);
    image.alt = item.title;
    image.draggable = false;
    visual.append(image);
    const copy = element("div", "pw-object-copy");
    copy.append(
      element("p", "pw-object-kind", "СКРЫТАЯ ДЕТАЛЬ"),
      element("h4", "pw-object-title", item.title),
      element("p", "pw-object-description", item.description),
      element("p", "pw-dialog-note", "Иллюстрация для игры. Кадр видео оставлен без изменений; размещение условное и не является семейным наблюдением."),
    );
    card.append(visual, copy);
    showDialog("Найдена деталь", [card]);
    objectReturn = trigger;
    trigger.setAttribute("aria-expanded", "true");
    closeDialogButton.focus({ preventScroll: true });
    announcement.textContent = `Найдена деталь: ${item.title}`;
  }
  function openMap() {
    if (!current) return;
    const note = element("p", "pw-dialog-note", "Это схема прогулки, не географическая карта. Перейти можно только в соседнее место.");
    const list = element("div", "pw-map-list");
    for (const [index, view] of options.views.entries()) {
      const link = current.links.find((candidate) => candidate.to === view.id);
      const row = element("button", "pw-map-row");
      row.type = "button";
      row.disabled = busy || !link || !!detail;
      if (view.id === current.id) row.setAttribute("aria-current", "location");
      const thumb = element("img", "pw-map-thumb");
      thumb.src = resolve(view.image); thumb.alt = "";
      const name = element("span", "pw-map-name", `${String(index + 1).padStart(2, "0")}  ${view.title}`);
      name.append(element("small", "", view.id === current.id ? "Вы здесь" : link ? "Рядом · можно пройти" : visited.has(view.id) ? "Уже посещено" : "Ещё не посещено"));
      row.append(thumb, name);
      row.addEventListener("click", () => { if (link) { closeDialog(); void step(link); } });
      list.append(row);
    }
    showDialog("Маршрут", [note, list]);
  }
  function openInfo() {
    const description = element("p", "", "Шесть реальных кадров из вашего видео. Перемещение меняет точку съёмки; лупа только увеличивает фрагмент того же кадра. Это не панорама 360°.");
    const controls = element("p", "", "Нажимайте на стрелки в лесу. На клавиатуре: Tab и Enter; ↑ — вперёд, ← и → — в стороны, ↓ — назад, Esc — закрыть увеличение или окно.");
    const source = element("p", "pw-dialog-note", "Исходник: 1000022837.mp4. Скрытые миксомицеты, лишайники, маленькие грибы и мокрицы — условные игровые иллюстрации; они не заявлены как найденные в исходном видео. Звук, люди и метаданные видео не перенесены. Публичная лицензия на видео не заявляется.");
    showDialog("О прогулке", [description, controls, source]);
  }
  async function step(link: PhotoWalkLink) {
    if (dead || busy || detail || !current?.links.some((candidate) => candidate.to === link.to)) return;
    const next = lookup.get(link.to);
    if (!next) return;
    const token = ++revision;
    lastId = current.id;
    setBusy(true); message("Открываем следующее место…");
    try {
      await loadImage(next.image);
      if (dead || token !== revision) return;
      options.onNavigate(next.id);
    } catch {
      if (dead || token !== revision) return;
      setBusy(false);
      message("Кадр не загрузился. Вы остались на прежнем месте.", () => void step(link));
    }
  }
  async function setView(id: string): Promise<void> {
    if (dead) return;
    if (current?.id === id && currentLayer && !busy) return;
    const next = lookup.get(id) ?? entry!;
    const token = ++revision;
    const restoreFocus = root.contains(document.activeElement) && document.activeElement !== root;
    transition?.cancel(); transition = null;
    // A browser Back during a fade must not leave an orphan layer on screen.
    for (const layer of Array.from(surface.children)) if (layer !== currentLayer) layer.remove();
    if (currentLayer) { currentLayer.style.opacity = "1"; currentLayer.removeAttribute("inert"); }
    closeDialog(); closeDetail();
    setBusy(true); message(current ? "Открываем следующее место…" : "Открываем лес…");
    try {
      await loadImage(next.image);
      if (dead || token !== revision) return;
      const old = currentLayer;
      const previousId = current?.id;
      const layer = createLayer(next);
      surface.prepend(layer);
      current = next; currentLayer = layer;
      root.dataset.view = next.id;
      visited.add(next.id); updateCaption(); message("");
      if (old && previousId !== next.id) {
        old.setAttribute("inert", "");
        const duration = reduced() || document.hidden ? 0 : (options.fadeMs ?? 240);
        if (duration > 0) {
          transition = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: "ease-out", fill: "forwards" });
          await transition.finished.catch(() => undefined);
        }
      }
      old?.remove();
      if (dead || token !== revision) return;
      transition = null; setBusy(false);
      announcement.textContent = next.title;
      if (restoreFocus) {
        const returnArrow = Array.from(layer.querySelectorAll<HTMLButtonElement>(".pw-arrow")).find((control) => control.dataset.to === (previousId ?? lastId));
        (returnArrow ?? layer.querySelector<HTMLButtonElement>(".pw-arrow") ?? root).focus({ preventScroll: true });
      }
      // Warm adjacent views, not the whole game. Failed prefetches remain retryable.
      next.links.forEach((link) => {
        const target = lookup.get(link.to);
        if (target) void loadImage(target.image).catch(() => undefined);
      });
    } catch {
      if (dead || token !== revision) return;
      setBusy(false);
      message("Не удалось открыть кадр. Проверьте соединение и попробуйте снова.", () => void setView(next.id));
    }
  }
  function resize() {
    const box = fitPhoto(viewport.clientWidth, viewport.clientHeight);
    surface.style.width = `${box.width}px`; surface.style.height = `${box.height}px`;
    surface.style.left = `${box.left}px`; surface.style.top = `${box.top}px`;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(viewport); resize();
  const keydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || dialog.open) return;
    if (event.key === "Escape" && detail) { event.preventDefault(); closeDetail(); return; }
    if (busy || detail || !current) return;
    const directions: Record<string, PhotoWalkLink["motion"]> = { ArrowUp: "forward", ArrowLeft: "left", ArrowRight: "right", ArrowDown: "back" };
    const motion = directions[event.key];
    const link = motion && current.links.find((candidate) => candidate.motion === motion);
    if (link) { event.preventDefault(); void step(link); }
  };
  const finishAnimation = () => { if (document.hidden || reduced()) transition?.finish(); };
  root.addEventListener("keydown", keydown);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", restoreDialogFocus);
  media.addEventListener("change", finishAnimation);
  document.addEventListener("visibilitychange", finishAnimation);
  return {
    setView,
    dispose() {
      if (dead) return;
      dead = true; ++revision;
      transition?.cancel(); observer.disconnect();
      root.removeEventListener("keydown", keydown);
      media.removeEventListener("change", finishAnimation);
      document.removeEventListener("visibilitychange", finishAnimation);
      closeDialog();
      for (const cancel of [...pendingImages]) cancel();
      images.clear(); root.replaceChildren();
      root.classList.remove("photo-walk-scene");
      root.removeAttribute("aria-busy");
      delete root.dataset.view; delete root.dataset.busy; delete root.dataset.detail;
    },
  };
}
