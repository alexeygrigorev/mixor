import { mountPhotoCamera } from "./photo-walk-camera.ts";
import { readPhotoWalkProgress, writePhotoWalkProgress, resetPhotoWalkProgress } from "./photo-walk-progress.ts";
import type { PhotoWalkView, PhotoWalkObject, PhotoWalkLink } from "./photo-walk-data";

export type PhotoWalkOptions = {
  views: readonly PhotoWalkView[];
  entry: string;
  fadeMs?: number;
  resolveImage?: (path: string) => string;
  reducedMotion?: () => boolean;
  onNavigate: (id: string) => void;
  onBack: () => void;
  backLabel?: string;
  onSettings?: () => void;
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
const objectQuestions: Record<PhotoWalkObject["kind"], string> = {
  myxomycete: "Рассмотри рисунок: форма похожа на сеть или на отдельные шарики?",
  lichen: "Рассмотри рисунок: край гладкий или разветвлённый?",
  fungus: "Рассмотри рисунок: сколько шляпок ты различаешь?",
  creature: "Рассмотри рисунок: видишь повторяющиеся сегменты?",
};
const svg = (name: string) => {
  const paths: Record<string, string> = {
    back: '<path d="m14 6-6 6 6 6M8 12h13"/>',
    route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h6a4 4 0 0 1 0 8H9a3 3 0 0 0-3 3v1h10"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.2"/>',
    lens: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M7.5 10.5h6M10.5 7.5v6"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    minus: '<path d="M5 12h14"/>',
    frame: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
    hint: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
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
 * The host application owns route/history and audio. Local game progress uses
 * a separate validated store; family observations never enter this renderer.
 */
export function mountPhotoWalk(root: HTMLElement, options: PhotoWalkOptions): PhotoWalkController {
  const resolve = options.resolveImage ?? ((path: string) => path);
  const lookup = new Map(options.views.map((view) => [view.id, view]));
  const entry = lookup.get(options.entry);
  if (!entry) throw new Error("Photo walk entry is missing");
  let current: PhotoWalkView | null = null;
  let currentLayer: HTMLElement | null = null;
  let objectReturn: HTMLButtonElement | null = null;
  let dead = false, busy = false, revision = 0;
  let transition: Animation | null = null;
  let retry: (() => void) | null = null;

  const progress = readPhotoWalkProgress(options.views);
  const visited = new Set(progress.visited);
  const images = new Map<string, Promise<HTMLImageElement>>();
  const pendingImages = new Set<() => void>();
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const foundObjects = new Set(progress.found);
  const objectTotal = options.views.reduce((total, view) => total + view.objects.length, 0);
  const reduced = () => media.matches || options.reducedMotion?.() === true;
  root.classList.add("photo-walk-scene");
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Лесная прогулка");
  root.tabIndex = -1;
  root.innerHTML = "";
  const viewport = element("div", "pw-viewport");
  viewport.tabIndex = 0;
  viewport.setAttribute("role", "group");
  viewport.setAttribute("aria-label", "Осмотреть лес: перетаскивайте изображение или используйте клавиши стрелок");
  const surface = element("div", "pw-surface");
  viewport.append(surface);
  const shade = element("div", "pw-edge-shade");
  const header = element("header", "pw-header");
  const back = button("pw-tool pw-back", options.backLabel ?? "Назад к выбору места", "back", () => {
    options.onBack();
  });
  const sceneLabel = element("span", "pw-scene-label", "ЛЕСНАЯ ПРОГУЛКА");
  const tools = element("div", "pw-tools");
  const routeButton = button("pw-tool pw-route-button", "Открыть маршрут", "route", openMap);
  routeButton.append(element("span", "", "Маршрут"));
  const infoButton = button("pw-tool pw-info-button", "О кадрах и управлении", "info", openInfo);
  tools.append(routeButton);
  if (options.onSettings) tools.append(button("pw-tool", "Настройки", "settings", options.onSettings));
  infoButton.className = "pw-about";
  infoButton.append(element("span", "", "О прогулке"));
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
  const travel = element("nav", "pw-travel");
  travel.setAttribute("aria-label", "Куда пойти дальше");
  const mission = element("div", "pw-mission");
  const missionText = element("span", "pw-mission-text");
  const hintButton = button("pw-hint", "Подсказка", "hint", showHint);
  hintButton.append(element("span", "", "Подсказка"));
  mission.append(missionText, hintButton);
  footer.append(caption, steps, mission, travel, instruction);
  const cameraTools = element("div", "pw-camera-tools");
  const zoomIn = button("pw-tool", "Приблизить", "lens", () => { camera.zoom(.3); overviewButton.setAttribute("aria-pressed", "false"); });
  const zoomOut = button("pw-tool", "Отдалить", "minus", () => { camera.zoom(-.3); overviewButton.setAttribute("aria-pressed", "false"); });
  const overviewButton = button("pw-tool", "Весь кадр", "frame", () => overviewButton.setAttribute("aria-pressed", String(camera.toggleOverview())));
  overviewButton.setAttribute("aria-pressed", "false");
  cameraTools.append(zoomOut, overviewButton, zoomIn);
  const storageNote = element("p", "pw-storage-note");
  storageNote.hidden = true;
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
  root.append(viewport, shade, header, footer, cameraTools, storageNote, status, announcement, dialog);
  const camera = mountPhotoCamera(viewport, surface, (value) => {
    if (current) { progress.cameras[current.id] = value; saveProgress(); }
    overviewButton.setAttribute("aria-pressed", "false");
  });
  function saveProgress() {
    progress.visited = [...visited]; progress.found = [...foundObjects];
    const saved = writePhotoWalkProgress(progress, options.views);
    storageNote.hidden = saved;
    storageNote.textContent = saved ? "" : "Прогресс не сохранён: хранилище недоступно.";
  }
  function showHint() {
    if (!current || busy) return;
    const item = current.objects.find((candidate) => !foundObjects.has(candidate.id));
    if (!item) return;
    camera.focus((item.x + item.width / 2) / 100, (item.y + item.height / 2) / 100);
    currentLayer?.querySelectorAll(".is-hinted").forEach((node) => node.classList.remove("is-hinted"));
    const node = Array.from(currentLayer?.querySelectorAll<HTMLElement>(".pw-object") ?? []).find((node) => node.dataset.object === item.id);
    node?.classList.add("is-hinted");
    missionText.textContent = item.label;
    announcement.textContent = `Подсказка: ${item.label}`;
  }
  function updateTravel() {
    travel.replaceChildren();
    for (const link of current?.links ?? []) {
      const control = button("pw-path", `Перейти: ${link.label}`, "back", () => void step(link));
      control.dataset.motion = link.motion;
      const shortLabels: Record<string, string> = {
        "video-forest": "На склон", "video-moss-stump": "К мшистому пню",
        "video-clearing": "Под ветви", "video-deadwood": "К веткам",
        "video-trail": "К тропе", "video-old-stump": "К большому пню",
      };
      const label = (current?.links.length ?? 0) > 2 && link.to === "video-moss-stump" ? "К пню" : shortLabels[link.to] ?? link.label;
      control.append(element("span", "", label));
      travel.append(control);
    }
  }

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
    layer.append(composite);
    return layer;
  }
  function updateCaption() {
    if (!current) return;
    const index = options.views.findIndex((view) => view.id === current!.id);
    title.textContent = current.title;
    eyebrow.textContent = `ОСТАНОВКА ${String(index + 1).padStart(2, "0")}`;
    instruction.textContent = "Тяни, чтобы осмотреться · Два пальца или + — приблизить";
    counter.textContent = `${visited.size} / ${options.views.length} мест`;
    counter.setAttribute("aria-label", `Посещено ${visited.size} из ${options.views.length} мест`);
    findCounter.textContent = objectTotal ? `Находки ${foundObjects.size} / ${objectTotal}` : "";
    findCounter.setAttribute("aria-label", `Найдено скрытых деталей: ${foundObjects.size} из ${objectTotal}`);
    const localFound = current.objects.filter((item) => foundObjects.has(item.id)).length;
    missionText.textContent = localFound === current.objects.length
      ? foundObjects.size === objectTotal ? "Все детали найдены. Лес можно исследовать снова." : "Здесь всё найдено. Продолжим прогулку?"
      : `Ищи лесные детали · ${localFound} / ${current.objects.length}`;
    hintButton.disabled = localFound === current.objects.length;
    dots.replaceChildren(...options.views.map((view) => {
      const dot = element("span", "pw-dot");
      dot.classList.toggle("is-current", current!.id === view.id);
      dot.classList.toggle("is-visited", visited.has(view.id));
      return dot;
    }));
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
    // Clear the return target now; the native close event is queued and may
    // otherwise steal focus from the next discovery after the camera moves.
    restoreDialogFocus();
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
    if (busy || dead) return;
    const isNew = !foundObjects.has(item.id);
    if (isNew) {
      foundObjects.add(item.id);
      trigger.classList.add("is-found");
      trigger.setAttribute("aria-pressed", "true");
      options.onObjectFound?.(item, view);
      trigger.classList.remove("is-hinted");
      updateCaption(); saveProgress();
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
      element("p", "pw-object-kind", "ТВОЯ НАХОДКА"),
      element("h4", "pw-object-title", item.title),
      element("p", "pw-object-question", objectQuestions[item.kind]),
      element("p", "pw-dialog-note", "Иллюстрация для игры. Вид и присутствие в исходном видео не подтверждены."),
    );
    if (item.kind === "fungus") copy.append(element("p", "pw-dialog-note", "Грибы не пробуем и не собираем."));
    card.append(visual, copy);
    const continueButton = button("pw-continue", "Продолжить поиск", "lens", closeDialog);
    continueButton.append(element("span", "", "Продолжить поиск"));
    showDialog("Найдена деталь", [card, continueButton]);
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
      row.disabled = busy || !link;
      if (view.id === current.id) row.setAttribute("aria-current", "location");
      const thumb = element("img", "pw-map-thumb");
      thumb.src = resolve(view.image); thumb.alt = "";
      const name = element("span", "pw-map-name", `${String(index + 1).padStart(2, "0")}  ${view.title}`);
      name.append(element("small", "", view.id === current.id ? "Вы здесь" : link ? "Рядом · можно пройти" : visited.has(view.id) ? "Уже посещено" : "Ещё не посещено"));
      name.append(element("small", "", `Детали ${view.objects.filter((item) => foundObjects.has(item.id)).length} / ${view.objects.length}`));
      row.append(thumb, name);
      row.addEventListener("click", () => { if (link) { closeDialog(); void step(link); } });
      list.append(row);
    }
    const replay = button("pw-continue", "Новая прогулка", "route", () => {
      const explanation = element("p", "", "Начать поиск заново? Обнулятся только игровые находки этой прогулки. Фотографии и полевой журнал сохранятся.");
      const confirm = button("pw-continue", "Начать поиск заново", "route", () => {
        if (!resetPhotoWalkProgress(options.views)) {
          explanation.textContent = "Не удалось сохранить новую прогулку. Прежний прогресс сохранён. Попробуйте ещё раз.";
          return;
        }
        foundObjects.clear(); visited.clear(); progress.cameras = {};
        progress.found = []; progress.visited = [];
        currentLayer?.remove(); currentLayer = null; current = null;
        closeDialog();
        options.onNavigate(options.entry);
        void setView(options.entry);
      });
      confirm.append(element("span", "", "Начать поиск заново"));
      showDialog("Новая прогулка", [explanation, confirm]);
    });
    replay.append(element("span", "", "Новая прогулка"));
    const mapActions = element("div", "pw-map-actions");
    mapActions.append(infoButton, replay);
    showDialog("Маршрут", [note, list, mapActions]);
  }
  function openInfo() {
    const description = element("p", "", "Шесть реальных кадров из вашего видео. Переход по тропе меняет точку съёмки; приближение увеличивает тот же кадр. Это не панорама 360°.");
    const controls = element("p", "", "Перетаскивайте лес пальцем или мышью. Сведите или разведите два пальца для масштаба; доступны также кнопки − и +. «Весь кадр» показывает границы снимка. Выбирайте тропы внизу. Tab и Enter — действия; стрелки на изображении — осмотреться; Esc — закрыть окно.");
    const source = element("p", "pw-dialog-note", "Исходник: 1000022837.mp4. Скрытые миксомицеты, лишайники, маленькие грибы и мокрицы — условные игровые иллюстрации; они не заявлены как найденные в исходном видео. Звук, люди и метаданные видео не перенесены. Публичная лицензия на видео не заявляется.");
    showDialog("О прогулке", [description, controls, source]);
  }
  async function step(link: PhotoWalkLink) {
    if (dead || busy || !current?.links.some((candidate) => candidate.to === link.to)) return;
    const next = lookup.get(link.to);
    if (!next) return;
    const token = ++revision;

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
    closeDialog();
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
      visited.add(next.id); updateCaption(); updateTravel(); message("");
      camera.set(progress.cameras[next.id] ?? { x: .5, y: .56, zoom: 1 });
      overviewButton.setAttribute("aria-pressed", "false");
      saveProgress();
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
        const returnArrow = Array.from(travel.querySelectorAll<HTMLButtonElement>("button")).find((control) => control.dataset.motion === "back");
        (returnArrow ?? travel.querySelector<HTMLButtonElement>("button") ?? root).focus({ preventScroll: true });
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
  const keydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || dialog.open) return;
    if (busy || !current) return;
    const directions: Record<string, PhotoWalkLink["motion"]> = { ArrowUp: "forward", ArrowLeft: "left", ArrowRight: "right", ArrowDown: "back" };
    const motion = directions[event.key];
    const link = motion && current.links.find((candidate) => candidate.motion === motion);
    if (link) { event.preventDefault(); void step(link); }
  };
  const finishAnimation = () => { if (document.hidden || reduced()) transition?.finish(); };
  root.addEventListener("keydown", keydown);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", () => { if (!dialog.open) restoreDialogFocus(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(); });
  media.addEventListener("change", finishAnimation);
  document.addEventListener("visibilitychange", finishAnimation);
  return {
    setView,
    dispose() {
      if (dead) return;
      dead = true; ++revision;
      transition?.cancel(); camera.dispose();
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
