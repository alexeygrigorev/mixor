import { pineWalkViews, PINE_WALK_ENTRY, PINE_WALK_RETURN } from "./photo-walk-pine.ts";
import { octoberWalkViews } from "./photo-walk-october.ts";

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
  /** Visible support and art angle are required authoring evidence, not biological identification. */
  support: string;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type PhotoWalkView = {
  /** Lightweight route preview; never used as the main frame. */
  thumbnail?: string;
  sourceVideo?: string;
  id: string;
  woodlandId: "video-forest" | "october-01" | "pine-01";
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
  myxomycete: "/assets/scene-07/objects/myxomycete-natural.png",
  lichen: "/assets/scene-07/objects/lichen-natural.png",
  fungus: "/assets/scene-07/objects/fungus-natural.png",
  creature: "/assets/scene-07/objects/woodlouse-natural.png",
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
  rotation: number,
  support: string,
): PhotoWalkObject {
  return { id, kind, image: objectArt[kind], label, ...objectCopy[kind], x, y, width, height, rotation, support };
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
      object("slope-myxomycete", "myxomycete", "Скрытый миксомицет у пня", 53.180, 56.797, 1.440, 1.706, 5, "Top lip of foreground broken stump"),
      object("slope-lichen", "lichen", "Лишайник на поваленной ветке", 22.695, 58.188, 2.210, 0.924, 11, "Diagonal fallen branch left of middle stump"),
      object("slope-fungus", "fungus", "Небольшие грибы в листовой подстилке", 58.312, 70.344, 1.875, 3.053, 0, "Leaf floor at right foot of foreground stump"),
      object("slope-woodlouse", "creature", "Мокрица под сухими листьями", 26.741, 78.818, 1.317, 1.564, -8, "Dark leaf and wood crease below left stump"),
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
      object("moss-myxomycete", "myxomycete", "Миксомицет у мшистого пня", 42.591, 61.600, 1.520, 1.800, 6, "Exposed top lip of large foreground stump"),
      object("moss-lichen", "lichen", "Лишайник на коре слева", 23.970, 78.102, 2.460, 1.495, -26, "Diagonal fallen branch entering left of foreground stump"),
      object("moss-fungus", "fungus", "Маленькие грибы у ветки", 33.620, 71.869, 2.160, 3.521, 0, "Shaded leaf floor at left stump foot"),
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
      object("clearing-myxomycete", "myxomycete", "Миксомицет на сломанном пне", 44.4, 71.275, 1.4, 1.65, 0, "Pale exposed lip of nearer broken stump"),
      object("clearing-lichen", "lichen", "Лишайник на низкой ветке", 57, 91.15, 2.6, 2.2, -18, "Foreground diagonal fallen branch near bottom edge"),
      object("clearing-fungus", "fungus", "Небольшие грибы у края поляны", 52.75, 71.25, 1.9, 3.1, 0, "Shaded leaf floor right of rear moss stump"),
      object("clearing-woodlouse", "creature", "Мокрица в тени ветвей", 40.2, 80.57, 1.4, 1.66, -12, "Dark leaf crease lower left of broken stump"),
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
      object("deadwood-myxomycete", "myxomycete", "Миксомицет на мшистой древесине", 92.2, 71.42, 1.4, 1.66, 0, "Upper edge of near right section of fallen log"),
      object("deadwood-lichen", "lichen", "Лишайник на поваленном стволе", 78.7, 63.675, 2.2, 1.85, 15, "Bark on curved nearer fallen log section"),
      object("deadwood-fungus", "fungus", "Небольшие грибы у папоротника", 49.975, 58.45, 1.9, 3.1, 0, "Clear leaf litter lower left of fern, not on fronds"),
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
      object("trail-myxomycete", "myxomycete", "Миксомицет на мшистом пне", 13.852, 69.483, 1.296, 1.534, 0, "Broken foreground stump lip"),
      object("trail-lichen", "lichen", "Лишайник на поваленной ветке", 31.600, 89.053, 2.800, 1.494, -30, "Foreground diagonal decaying branch"),
      object("trail-fungus", "fungus", "Небольшие грибы у передней ветки", 40.462, 80.974, 1.875, 3.053, 0, "Floor alongside upper right end of foreground branch"),
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
      { to: "october-01", label: "В другую прогулку: Светлый лес", x: 84, y: 87, angle: 45, motion: "forward" },
    ],
    details: [
      { id: "stump-wood", title: "Древесина у основания", x: 36, y: 44, width: 44, height: 44, anchorX: 65, anchorY: 72 },
    ],
    objects: [
      object("stump-myxomycete", "myxomycete", "Миксомицет на поваленной древесине", 55.637, 64.476, 1.224, 1.447, 0, "Exposed top lip of large fallen log"),
      object("stump-lichen", "lichen", "Лишайник на поваленном стволе", 79.000, 64.293, 3.400, 1.814, -10, "Barked right section of horizontal log"),
      object("stump-fungus", "fungus", "Небольшие грибы у поваленного бревна", 73.562, 75.974, 1.875, 3.053, 0, "Shaded ground at log foot; existing bracket fungus unobscured"),
      object("stump-woodlouse", "creature", "Мокрица среди корней и листьев", 29.341, 89.218, 1.317, 1.564, 18, "Shaded root and leaf seam left of standing stump"),
    ],
  },
  ...octoberWalkViews.map(view => view.id === PINE_WALK_RETURN ? {
    ...view, links: [...view.links, { to: PINE_WALK_ENTRY,
      label: "В другую прогулку: Сосновый бор", x: 86, y: 87, angle: 45, motion: "forward" as const }],
  } : view),
  ...pineWalkViews,
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
    if (!Number.isFinite(view.sourceTimeSeconds) || view.sourceTimeSeconds < 0) fail(`invalid timestamp: ${view.id}`);
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
      if (!item.support?.trim() || !Number.isFinite(item.rotation) || Math.abs(item.rotation) > 180) fail(`invalid support: ${item.id}`);
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
