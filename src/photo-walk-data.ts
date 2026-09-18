/** Scene 07: real, unretouched frames from the user-supplied video.
 * Coordinates are percentages of the ORIGINAL 1920 × 1080 image.
 * Links are an authored exploration graph, not measured geographic positions.
 * Movement always uses a different captured frame; details are explicitly digital crops.
 */
export type PhotoWalkLink = {
  to: string;
  label: string;
  x: number;
  y: number;
  angle: number;
  motion: "forward" | "left" | "right" | "back";
};
export type PhotoWalkDetail = {
  id: string;
  title: string;
  // Crop rectangle, not an inferred macro photograph.
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
};
export type PhotoWalkObjectKind = "myxomycete" | "lichen" | "fungus" | "creature";
export type PhotoWalkObject = {
  id: string;
  kind: PhotoWalkObjectKind;
  image: string;
  label: string;
  title: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type PhotoWalkView = {
  id: string;
  woodlandId: "video-forest";
  title: string;
  image: string;
  width: number;
  height: number;
  sourceTimeSeconds: number;
  links: PhotoWalkLink[];
  details: PhotoWalkDetail[];
  objects: PhotoWalkObject[];
};
export const PHOTO_WALK_ENTRY = "video-forest";
export const PHOTO_WALK_FADE_MS = 240;
const objectArt = {
  myxomycete: "/assets/scene-07/objects/myxomycete-clue.webp",
  lichen: "/assets/scene-07/objects/lichen-clue.webp",
  fungus: "/assets/scene-07/objects/fungus-clue.webp",
  creature: "/assets/scene-07/objects/woodlouse-clue.webp",
} as const;
const objectCopy = {
  myxomycete: {
    title: "Миксомицет",
    description: "Условная игровая иллюстрация скрытой формы на влажной древесине. Вид и стадия по ней не определяются.",
  },
  lichen: {
    title: "Лишайник",
    description: "Условная игровая иллюстрация лишайника на коре. Это подсказка для поиска, а не определение вида в видео.",
  },
  fungus: {
    title: "Небольшой гриб",
    description: "Условная игровая иллюстрация маленьких плодовых тел. Не пробуй грибы и не считай эту подсказку определением.",
  },
  creature: {
    title: "Мокрица",
    description: "Условная игровая иллюстрация маленького обитателя подстилки. Точный вид и присутствие в исходном видео не утверждаются.",
  },
} as const;
function object(
  id: string,
  kind: PhotoWalkObjectKind,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
): PhotoWalkObject {
  return { id, kind, image: objectArt[kind], label, ...objectCopy[kind], x, y, width, height };
}
export const photoWalkViews: PhotoWalkView[] = [
  {
    id: PHOTO_WALK_ENTRY,
    woodlandId: "video-forest",
    title: "Лесной склон",
    image: "/assets/scene-07/slope.webp",
    width: 1920, height: 1080, sourceTimeSeconds: 18.914556,
    links: [
      { to: "video-moss-stump", label: "К мшистому пню", x: 35, y: 62, angle: -18, motion: "forward" },
    ],
    details: [
      { id: "slope-wood", title: "Небольшой пень", x: 34, y: 45, width: 40, height: 40, anchorX: 55, anchorY: 66 },
    ],
    objects: [
      object("slope-myxomycete", "myxomycete", "Скрытый миксомицет у пня", 49, 59, 9, 10),
      object("slope-lichen", "lichen", "Лишайник на поваленной ветке", 62, 41, 8, 8),
      object("slope-fungus", "fungus", "Небольшие грибы в листовой подстилке", 72, 68, 8, 10),
      object("slope-woodlouse", "creature", "Мокрица под сухими листьями", 27, 72, 7, 7),
    ],
  },
  {
    id: "video-moss-stump",
    woodlandId: "video-forest",
    title: "Мшистый пень",
    image: "/assets/scene-07/moss-stump.webp",
    width: 1920, height: 1080, sourceTimeSeconds: 30.731967,
    links: [
      { to: "video-forest", label: "Назад на склон", x: 19, y: 83, angle: 180, motion: "back" },
      { to: "video-clearing", label: "Обойти пень справа", x: 77, y: 56, angle: 62, motion: "right" },
    ],
    details: [
      { id: "moss-surface", title: "Мох и древесина", x: 25, y: 43, width: 44, height: 44, anchorX: 45, anchorY: 64 },
    ],
    objects: [
      object("moss-myxomycete", "myxomycete", "Миксомицет у мшистого пня", 39, 64, 9, 10),
      object("moss-lichen", "lichen", "Лишайник на коре слева", 30, 52, 8, 8),
      object("moss-fungus", "fungus", "Маленькие грибы у ветки", 21, 76, 8, 10),
    ],
  },
  {
    id: "video-clearing",
    woodlandId: "video-forest",
    title: "Под низкими ветвями",
    image: "/assets/scene-07/clearing.webp",
    width: 1920, height: 1080, sourceTimeSeconds: 43.520211,
    links: [
      { to: "video-moss-stump", label: "Назад к пню", x: 37, y: 87, angle: 180, motion: "back" },
      { to: "video-deadwood", label: "К поваленным веткам", x: 22, y: 57, angle: -60, motion: "left" },
      { to: "video-trail", label: "К краю тропы", x: 80, y: 59, angle: 60, motion: "right" },
    ],
    details: [
      { id: "clearing-leaf-floor", title: "Мох среди листвы", x: 29, y: 45, width: 44, height: 44, anchorX: 49, anchorY: 71 },
    ],
    objects: [
      object("clearing-myxomycete", "myxomycete", "Миксомицет на мшистом островке", 44, 66, 9, 10),
      object("clearing-lichen", "lichen", "Лишайник на низкой ветке", 29, 56, 8, 8),
      object("clearing-fungus", "fungus", "Небольшие грибы у края поляны", 68, 67, 8, 10),
      object("clearing-woodlouse", "creature", "Мокрица в тени ветвей", 75, 56, 7, 7),
    ],
  },
  {
    id: "video-deadwood",
    woodlandId: "video-forest",
    title: "Поваленные ветки",
    image: "/assets/scene-07/deadwood.webp",
    width: 1920, height: 1080, sourceTimeSeconds: 56.331944,
    links: [
      { to: "video-clearing", label: "Вернуться под ветви", x: 76, y: 84, angle: 145, motion: "back" },
    ],
    details: [
      { id: "deadwood-moss", title: "Мшистая ветка", x: 36, y: 36, width: 48, height: 48, anchorX: 60, anchorY: 63 },
    ],
    objects: [
      object("deadwood-myxomycete", "myxomycete", "Миксомицет на мшистой древесине", 70, 72, 9, 10),
      object("deadwood-lichen", "lichen", "Лишайник на поваленном стволе", 22, 57, 8, 8),
      object("deadwood-fungus", "fungus", "Небольшие грибы у папоротника", 52, 64, 8, 10),
    ],
  },
  {
    id: "video-trail",
    woodlandId: "video-forest",
    title: "Край тропы",
    image: "/assets/scene-07/trail.webp",
    width: 1920, height: 1080, sourceTimeSeconds: 45.7297,
    links: [
      { to: "video-clearing", label: "Назад под ветви", x: 16, y: 80, angle: -125, motion: "back" },
      { to: "video-old-stump", label: "Подойти к большому пню", x: 69, y: 73, angle: 30, motion: "forward" },
    ],
    details: [
      { id: "trail-stump", title: "Низкий пень у тропы", x: 5, y: 41, width: 44, height: 44, anchorX: 25, anchorY: 66 },
    ],
    objects: [
      object("trail-myxomycete", "myxomycete", "Миксомицет на мшистом пне", 16, 65, 9, 10),
      object("trail-lichen", "lichen", "Лишайник на большом пне", 80, 54, 8, 8),
      object("trail-fungus", "fungus", "Небольшие грибы у передней ветки", 48, 79, 8, 10),
    ],
  },
  {
    id: "video-old-stump",
    woodlandId: "video-forest",
    title: "Большой пень",
    image: "/assets/scene-07/old-stump.webp",
    width: 1920, height: 1080, sourceTimeSeconds: 68.728456,
    links: [
      { to: "video-trail", label: "Отойти к краю тропы", x: 16, y: 82, angle: -145, motion: "back" },
    ],
    details: [
      { id: "stump-wood", title: "Древесина у основания", x: 36, y: 44, width: 44, height: 44, anchorX: 65, anchorY: 72 },
    ],
    objects: [
      object("stump-myxomycete", "myxomycete", "Миксомицет у основания пня", 41, 60, 9, 10),
      object("stump-lichen", "lichen", "Лишайник на правом стволе", 85, 56, 8, 8),
      object("stump-fungus", "fungus", "Небольшие грибы на поваленном бревне", 64, 73, 9, 10),
      object("stump-woodlouse", "creature", "Мокрица в траве у тропы", 26, 78, 7, 7),
    ],
  },
];
export function getPhotoWalkView(id: string): PhotoWalkView | undefined {
  return photoWalkViews.find((view) => view.id === id);
}

/** Validate authored content at the boundary, before any interaction. */
export function validatePhotoWalk(views: readonly PhotoWalkView[]): void {
  const ids = new Set(views.map((view) => view.id));
  const fail = (message: string): never => { throw new Error(`Photo walk: ${message}`); };
  const percent = (v: number) => Number.isFinite(v) && v >= 0 && v <= 100;
  if (!views.length || ids.size !== views.length || !ids.has(PHOTO_WALK_ENTRY)) fail("invalid view ids");
  const objectIds = new Set<string>();
  for (const view of views) {
    if (view.width !== 1920 || view.height !== 1080 || !view.image || !view.title) fail(`invalid image: ${view.id}`);
    const destinations = new Set<string>();
    for (const link of view.links) {
      if (!ids.has(link.to) || link.to === view.id || destinations.has(link.to)) fail(`invalid link: ${view.id}`);
      destinations.add(link.to);
      if (!percent(link.x) || !percent(link.y) || !Number.isFinite(link.angle)) fail(`invalid anchor: ${view.id}`);
      if (!views.find((target) => target.id === link.to)?.links.some((back) => back.to === view.id)) fail(`missing return: ${view.id}`);
    }
    const localIds = new Set<string>();
    for (const item of [...view.details, ...view.objects]) {
      if (!item.id || localIds.has(item.id)) fail(`duplicate hotspot: ${view.id}`);
      if (objectIds.has(item.id)) fail(`duplicate object: ${item.id}`);
      localIds.add(item.id);
      if (![item.x, item.y, item.width, item.height].every(percent) || item.width <= 0 || item.height <= 0 || item.x + item.width > 100 || item.y + item.height > 100) fail(`invalid rectangle: ${item.id}`);
    }
    for (const item of view.objects) {
      objectIds.add(item.id);
      if (!Object.hasOwn(objectCopy, item.kind) || !item.image || !item.title || !item.description) fail(`invalid object: ${item.id}`);
    }
    for (const detail of view.details) {
      if (![detail.anchorX, detail.anchorY].every(percent) || Math.abs(detail.width - detail.height) > .001) fail(`invalid detail: ${detail.id}`);
    }
  }
  const reached = new Set<string>();
  const pending = [PHOTO_WALK_ENTRY];
  while (pending.length) {
    const id = pending.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    pending.push(...views.find((view) => view.id === id)!.links.map((link) => link.to));
  }
  if (reached.size !== views.length) fail("disconnected views");
}
