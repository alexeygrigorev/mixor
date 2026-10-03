import type { PhotoWalkView, PhotoWalkObject, PhotoWalkObjectKind, PhotoWalkLink } from "./photo-walk-data.ts";

/** Second user video: full unretouched frames, with incidental people/items retained
 * by explicit permission. Cleanup candidates: content/scene-09.cleanup.json.
 * Source PTS / hashes / orientation: content/scene-09.manifest.json.
 * The route is authored; turns and cross-walk links are not geographic measurements.
 */
export const CLEARING_WALK_ENTRY = "clearing-01";
const captures: readonly (readonly [string, number, number, number, number, PhotoWalkLink["motion"], number])[] = [
  ["Под низкими ветвями", 2.741722, 75, 76, 65, "right", 20],
  ["За ближней сосной", 11.234067, 40, 73, 60, "right", 80],
  ["Хвойная дорожка", 15.227822, 71, 74, 0, "forward", 20],
  ["Поворот к просвету", 16.736556, 28, 77, -65, "left", 80],
  ["Между тонкими стволами", 22.227122, 29, 78, -50, "left", 80],
  ["У светлого ковра", 24.2348, 56, 76, 0, "forward", 20],
  ["Край поляны", 29.725233, 75, 75, 50, "right", 20],
  ["Тихая сторона леса", 33.241044, 28, 78, -60, "left", 80],
  ["В глубине просвета", 37.726422, 74, 75, 60, "right", 20],
  ["За молодой сосной", 42.243656, 70, 76, 55, "right", 20],
  ["Под свисающей хвоей", 46.733256, 72, 78, 65, "right", 20],
  ["У зелёной опушки", 50.717978, 62, 75, 0, "forward", 20],
  ["Поворот у кустарника", 55.739033, 52, 74, 55, "right", 80],
  ["Возле большого ствола", 63.737844, 63, 76, 0, "forward", 20],
  ["Травяной проход", 67.218633, 27, 77, -65, "left", 80],
  ["К тенистым деревьям", 71.234867, 57, 77, 0, "forward", 20],
  ["Под наклонной сосной", 74.247811, 62, 77, 0, "forward", 20],
  ["Сухие веточки под ногами", 76.725111, 78, 73, 60, "right", 20],
  ["Между кустами", 83.219667, 26, 76, -70, "left", 80],
  ["У лесного бугорка", 85.730444, 59, 72, 0, "forward", 20],
  ["Снова у поляны", 95.237933, 72, 76, 60, "right", 20],
  ["В тени хвойных ветвей", 97.246556, 75, 73, 55, "right", 20],
  ["К берёзе в глубине", 100.226022, 52, 76, 50, "right", 80],
  ["Небольшой пень", 107.724889, 28, 76, -60, "left", 80],
  ["Ряд молодых сосен", 111.732144, 72, 76, 70, "right", 20],
  ["Поляна за берёзой", 118.236689, 72, 77, 60, "right", 20],
  ["Развилка старого дерева", 121.723411, 27, 78, -70, "left", 80],
  ["Сухие ветки у корней", 125.2334, 26, 76, -65, "left", 80],
  ["Поваленный ствол", 128.246333, 75, 76, 65, "right", 10],
  ["У белой берёзы", 132.230111, 71, 77, 40, "right", 20],
  ["Мох у края поляны", 139.226811, 71, 76, 60, "right", 20],
  ["Последний взгляд на опушку", 141.7376, 0, 0, 0, "forward", 20],
];
const placements: readonly (readonly [number, PhotoWalkObjectKind, string, number, number, number, number, number, string])[] = [
  [1, "myxomycete", "Миксомицет на упавшей веточке", 53.7, 70.2, 1.05, 1.24, 24, "Верхняя сторона тёмной сухой ветки на переднем плане, идущей от центра вниз вправо"],
  [2, "lichen", "Лишайник на коре сосны", 59.8, 50.0, 1.5, 1.0, -82, "Кора прямого ствола чуть правее центра, за тонкой передней сосной"],
  [7, "fungus", "Небольшие грибы в хвое", 47.0, 79.0, 1.3, 2.12, 0, "Затенённая хвойная подстилка на переднем плане правее лесного бугорка"],
  [13, "myxomycete", "Миксомицет на светлой ветке", 23.0, 88.1, 1.0, 1.18, -10, "Верхняя поверхность светлой сухой ветки перед зелёным кустом слева"],
  [18, "creature", "Мокрица между сухими иголками", 54.0, 87.0, 1.1, 1.3, -24, "Поверхность сухой лежащей ветки среди хвои в нижней средней части кадра"],
  [23, "lichen", "Лишайник на ближнем стволе", 16.3, 77.0, 1.5, 1.0, -82, "Кора тонкой передней сосны слева, ниже развилки сухих ветвей"],
  [24, "myxomycete", "Миксомицет у края пенька", 61.9, 48.5, 1.0, 1.18, 7, "Верхний левый край небольшого сломанного пенька справа от центральной сосны"],
  [29, "myxomycete", "Миксомицет на поваленном стволе", 32.7, 68.4, 1.05, 1.24, 20, "Шероховатая тёмная древесина слева на поваленном стволе, выше белой коры"],
];
const art = { myxomycete: "myxomycete", lichen: "lichen", fungus: "fungus", creature: "woodlouse" } as const;
const names = { myxomycete: "Миксомицет", lichen: "Лишайник", fungus: "Небольшой гриб", creature: "Мокрица" } as const;
const idAt = (i: number) => `clearing-${String(i + 1).padStart(2, "0")}`;
export const clearingWalkViews: PhotoWalkView[] = captures.map(([title, sourceTimeSeconds, x, y, angle, motion, backX], i) => {
  const id = idAt(i), frame = `view-${String(i + 1).padStart(2, "0")}.webp`;
  const links: PhotoWalkLink[] = [{
    to: i === 0 ? "october-28" : idAt(i - 1),
    label: i === 0 ? "В другую прогулку: Светлый лес" : `Назад: ${captures[i - 1][0]}`,
    x: backX, y: 86, angle: 180, motion: "back",
  }];
  if (i + 1 < captures.length) links.push({ to: idAt(i + 1), label: captures[i + 1][0], x, y, angle, motion });
  const objects: PhotoWalkObject[] = placements.filter(([stop]) => stop === i + 1).map(([, kind, label, ox, oy, width, height, rotation, support]) => ({
    id: `${id}-${kind}`, kind, label, title: names[kind],
    image: `/assets/scene-07/objects/${art[kind]}-natural.png`,
    description: "Учебный игровой рисунок; не определение организма в видеозаписи.",
    x: ox, y: oy, width, height, rotation, support,
  }));
  return {
    id, woodlandId: CLEARING_WALK_ENTRY, title,
    image: `/assets/scene-09/${frame}`, thumbnail: `/assets/scene-09/thumbs/${frame}`,
    sourceVideo: "PXL_20261003_133858340.TS.mp4",
    width: 1920, height: 1080, sourceTimeSeconds, links, details: [], objects,
  };
});
