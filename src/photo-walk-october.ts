import type { PhotoWalkView, PhotoWalkObject, PhotoWalkObjectKind, PhotoWalkLink } from "./photo-walk-data.ts";

/** Authored order of actual full video frames. Turns are not measured footsteps.
 * 2026-10-03: user permitted publication of selected forest-only stills.
 * Exact PTS and asset hashes: content/scene-08.manifest.json.
 */
export const OCTOBER_WALK_ENTRY = "october-01";
const captures: readonly (readonly [string, number, number, number, number, PhotoWalkLink["motion"]])[] = [
  ["У края дорожки", 3.752578, 42, 77, -55, "left"],
  ["Под сухими ветвями", 7.265478, 44, 64, 65, "right"],
  ["Мох на склоне", 15.234156, 70, 77, 55, "right"],
  ["У зелёного кустарника", 19.252256, 77, 69, 30, "forward"],
  ["Солнечный проход", 22.264944, 57, 70, 0, "forward"],
  ["Между молодыми деревьями", 26.249033, 60, 74, 0, "forward"],
  ["Свет сквозь хвою", 30.2655, 28, 77, -60, "left"],
  ["Взгляд на дорожку", 37.261744, 68, 71, 70, "right"],
  ["Под наклонной веткой", 45.262067, 53, 78, 50, "right"],
  ["Возле раздвоенного ствола", 50.250033, 29, 80, -50, "left"],
  ["Светлая поляна", 55.7415, 56, 71, 0, "forward"],
  ["За молодой сосной", 58.253022, 67, 76, 65, "right"],
  ["Поворот от кустарника", 63.743067, 41, 73, -35, "left"],
  ["Хвойная подстилка", 65.7517, 44, 75, 0, "forward"],
  ["К низкой развилке", 69.7358, 58, 74, 0, "forward"],
  ["Под длинной веткой", 73.250289, 26, 80, -65, "left"],
  ["Тенистый мох", 79.241189, 55, 76, 0, "forward"],
  ["Между тонкими стволами", 82.254, 63, 73, 40, "right"],
  ["Сосны впереди", 87.244489, 69, 76, 65, "right"],
  ["На светлом склоне", 89.754178, 58, 76, 35, "right"],
  ["Рядом с молодым дубком", 94.240244, 71, 80, 60, "right"],
  ["Тропинка в тени", 98.255189, 24, 76, -65, "left"],
  ["Среди сухих ветвей", 107.764356, 72, 72, 60, "right"],
  ["Зелёный поворот", 110.242011, 31, 80, -60, "left"],
  ["У высокого ствола", 115.265144, 64, 80, 60, "right"],
  ["Проход за кустарником", 118.243056, 59, 69, 0, "forward"],
  ["Красные листья", 123.734089, 54, 77, 15, "forward"],
  ["Последний взгляд на лес", 126.7469, 0, 0, 0, "forward"],
];
const placements: readonly (readonly [number, PhotoWalkObjectKind, string, number, number, number, number, number, string])[] = [
  [2, "myxomycete", "Миксомицет на упавшей ветке", 27.2, 66.65, 1.05, 1.24, 3, "Верхняя сторона светлой горизонтальной упавшей ветки в нижней левой части кадра"],
  [3, "lichen", "Лишайник у основания ствола", 27.2, 58.9, 1.6, 1.15, -72, "Кора тёмного тонкого ствола слева от центрального кустарника, чуть выше мха"],
  [9, "fungus", "Небольшие грибы под сосной", 50.7, 73.5, 1.4, 2.28, 0, "Хвойная подстилка справа от основания ближайшей сосны, не её ствол"],
  [13, "creature", "Мокрица в хвойной подстилке", 46.2, 85.3, 1.05, 1.25, -20, "Затенённый шов между сухими листьями и хвоей на переднем плане"],
  [16, "myxomycete", "Миксомицет на сухой древесине", 83.4, 61.2, 0.9, 1.065, 20, "Верхняя сторона толстой сухой ветки, спускающейся слева к правому большому стволу"],
  [22, "myxomycete", "Миксомицет на сухой ветке", 46.0, 63.0, 0.9, 1.065, -5, "Верхняя сторона тёмной сухой ветки, пересекающей середину кадра между тонкими стволами"],
  [25, "lichen", "Лишайник на коре у развилки", 25.4, 62.3, 1.7, 1.2, -75, "Кора ближнего левого разветвлённого ствола над основанием"],
  [28, "myxomycete", "Миксомицет на лесной ветке", 64.0, 71.3, 0.95, 1.12, 8, "Светлая горизонтальная сухая ветка перед тёмной правой сосной"],
];
const art = { myxomycete: "myxomycete", lichen: "lichen", fungus: "fungus", creature: "woodlouse" } as const;
const names = { myxomycete: "Миксомицет", lichen: "Лишайник", fungus: "Небольшой гриб", creature: "Мокрица" } as const;
const idAt = (i: number) => `october-${String(i + 1).padStart(2, "0")}`;
export const octoberWalkViews: PhotoWalkView[] = captures.map(([title, sourceTimeSeconds, x, y, angle, motion], i) => {
  const id = idAt(i), frame = `view-${String(i + 1).padStart(2, "0")}.webp`;
  const links: PhotoWalkLink[] = [{
    to: i === 0 ? "video-old-stump" : idAt(i - 1),
    label: i === 0 ? "К прежней прогулке" : `Назад: ${captures[i - 1][0]}`,
    x: i === 2 ? 76 : i === 8 ? 69 : 22, y: 86, angle: 180, motion: "back",
  }];
  if (i + 1 < captures.length) links.push({ to: idAt(i + 1), label: captures[i + 1][0], x, y, angle, motion });
  const objects: PhotoWalkObject[] = placements.filter(([stop]) => stop === i + 1).map(([, kind, label, ox, oy, width, height, rotation, support]) => ({
    id: `${id}-${kind}`, kind, label, title: names[kind],
    image: `/assets/scene-07/objects/${art[kind]}-natural.png`,
    description: "Учебный игровой рисунок. Вид и присутствие организма в исходном видео не устанавливаются.",
    x: ox, y: oy, width, height, rotation, support,
  }));
  return {
    id, woodlandId: OCTOBER_WALK_ENTRY, title,
    image: `/assets/scene-08/${frame}`, thumbnail: `/assets/scene-08/thumbs/${frame}`,
    sourceVideo: "PXL_20261003_113020278.TS.mp4",
    width: 1920, height: 1080, sourceTimeSeconds, links, details: [], objects,
  };
});
