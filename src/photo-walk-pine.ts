import type { PhotoWalkView, PhotoWalkObject, PhotoWalkObjectKind, PhotoWalkLink } from "./photo-walk-data.ts";

/** Scene 09: full frames from the second user recording, in capture order.
 * People/belongings are intentionally retained with explicit user permission.
 * No face recognition, retouching, source audio, source metadata or inferred locations.
 * See content/scene-09.manifest.json and docs/PINE_WALK_REVIEW.md.
 */
export const PINE_WALK_ENTRY = "pine-01";
export const PINE_WALK_RETURN = "october-28";

// To omit a later stop, add its stable ID here. Next/back links reconnect
// automatically; never renumber surviving frames or their discovery IDs.
// This changes the playable route, not published files or Git history.
export const PINE_OMITTED_VIEWS: readonly string[] = [];
type Capture = readonly [number, string, number, number, number, number, PhotoWalkLink["motion"]];
const captures: readonly Capture[] = [
  [1, "Под сосновыми ветвями", 3.009544, 76, 72, 55, "right"],
  [2, "Поворот от кустарника", 7.528111, 72, 72, 50, "right"],
  [3, "Между тонкими соснами", 11.033244, 74, 74, 50, "right"],
  [4, "Солнечная дорожка", 15.060522, 28, 74, -40, "left"],
  [5, "У края светлой поляны", 16.568733, 73, 78, 50, "right"],
  [6, "Сосны на склоне", 22.093133, 30, 77, -55, "left"],
  [7, "За низким холмиком", 26.109167, 70, 77, 45, "right"],
  [8, "Ряд молодых сосен", 31.129533, 78, 76, 45, "right"],
  [9, "Под переплетением ветвей", 33.1406, 74, 74, 50, "right"],
  [10, "Светлая подстилка", 39.166056, 74, 76, 40, "right"],
  [11, "К открытой поляне", 42.678889, 69, 76, 30, "forward"],
  [12, "На другой стороне поляны", 46.699767, 78, 76, 55, "right"],
  [13, "Возле раздвоенного дерева", 50.717978, 71, 75, 45, "right"],
  [14, "Зелёный проход", 54.735356, 71, 78, 35, "right"],
  [15, "Обойти молодую сосну", 56.742578, 27, 76, -45, "left"],
  [16, "Тропинка у большого ствола", 62.767489, 28, 76, -45, "left"],
  [17, "Среди кустарников", 67.285589, 28, 78, -60, "left"],
  [18, "Обратно под хвою", 71.301822, 48, 76, 0, "forward"],
  [19, "Под старой сосной", 74.314767, 43, 80, 55, "right"],
  [20, "Рядом с зелёной веткой", 78.332011, 28, 76, -50, "left"],
  [21, "Поляна за кустарником", 82.851422, 30, 76, -55, "left"],
  [22, "У лесного холмика", 85.864356, 68, 83, 0, "forward"],
  [23, "Взгляд на подстилку", 88.375133, 66, 77, 0, "forward"],
  [24, "Вновь между соснами", 93.898856, 72, 76, 45, "right"],
  [25, "К тонкому стволу", 97.413944, 75, 77, 45, "right"],
  [26, "За молодой сосной", 100.929033, 62, 78, 0, "forward"],
  [27, "По мшистой дорожке", 105.448444, 73, 79, 45, "right"],
  [28, "У небольшого пня", 108.963533, 28, 80, -55, "left"],
  [29, "Взгляд в сосновый бор", 115.491567, 73, 76, 50, "right"],
  [30, "Мшистый проход", 117.500189, 75, 78, 45, "right"],
  [31, "Между большими стволами", 122.0257, 28, 77, -45, "left"],
  [32, "Возле низких ветвей", 125.032533, 28, 79, -55, "left"],
  [33, "Поваленная берёза", 127.533322, 76, 72, 45, "right"],
  [34, "У берёзового ствола", 132.564878, 83, 78, 50, "right"],
  [35, "Поворот у сосны", 136.572133, 27, 76, -55, "left"],
  [36, "Место привала", 143.100167, 0, 0, 0, "forward"],
];
const placements: readonly (readonly [number, PhotoWalkObjectKind, string, number, number, number, number, number, string])[] = [
  [1, "myxomycete", "Миксомицет на упавшей ветке", 61.8, 45.1, 0.85, 1.007, -23, "Верхняя сторона светлой почти горизонтальной ветки под более толстой наклонной веткой справа от ближайших сосен"],
  [9, "lichen", "Лишайник на сосновой коре", 29.5, 68.2, 1.4, 0.95, -80, "Кора широкого переднего ствола слева от середины кадра, над основанием"],
  [16, "creature", "Мокрица в подстилке", 52.8, 88.5, 1.0, 1.185, -15, "Хвойная подстилка среди редких травинок на переднем плане, слева от низкого кустарника"],
  [19, "fungus", "Небольшие грибы у сосны", 53.8, 64.3, 1.35, 2.2, 0, "Хвойная подстилка справа от основания ближайшей толстой сосны, не её кора"],
  [28, "myxomycete", "Миксомицет на небольшом пне", 57, 66, 1.1, 1.303, 0, "Открытая верхняя кромка низкого пня справа от центральной сосны"],
  [33, "myxomycete", "Миксомицет на поваленной берёзе", 51, 66.6, 1.1, 1.303, 14, "Верхняя поверхность белого поваленного ствола в нижней половине кадра, рядом с тёмной трещиной коры"],
];
const art = { myxomycete: "myxomycete", lichen: "lichen", fungus: "fungus", creature: "woodlouse" } as const;
const names = { myxomycete: "Миксомицет", lichen: "Лишайник", fungus: "Небольшой гриб", creature: "Мокрица" } as const;
const idAt = (number: number) => `pine-${String(number).padStart(2, "0")}`;

/** Pure authoring helper: safely skip nominated stops without broken return links. */
export function buildPineWalk(omitted: readonly string[] = PINE_OMITTED_VIEWS): PhotoWalkView[] {
  const known = new Set(captures.map(([number]) => idAt(number)));
  if (omitted.some(id => !known.has(id))) throw new Error("Pine walk: unknown omitted frame");
  if (omitted.includes(PINE_WALK_ENTRY)) throw new Error("Pine walk: replace the entry photograph instead of omitting its stable bookmark");
  if (placements.some(([number]) => omitted.includes(idAt(number)))) throw new Error("Pine walk: replace a frame with discoveries or explicitly relocate them before omission");
  const excluded = new Set(omitted);
  const active = captures.filter(([number]) => !excluded.has(idAt(number)));
  return active.map(([number, title, sourceTimeSeconds, x, y, angle, motion], index) => {
    const id = idAt(number), frame = `view-${String(number).padStart(2, "0")}.webp`;
    const previous = active[index - 1], next = active[index + 1];
    const links: PhotoWalkLink[] = [{
      to: previous ? idAt(previous[0]) : PINE_WALK_RETURN,
      label: previous ? `Назад: ${previous[1]}` : "В другую прогулку: Светлый лес",
      x: number === 36 ? 80 : next && x < 40 ? 80 : 20,
      y: number === 36 ? 64 : 87, angle: 180, motion: "back",
    }];
    if (next) links.push({ to: idAt(next[0]), label: next[1], x, y, angle, motion });
    const objects: PhotoWalkObject[] = placements.filter(([stop]) => stop === number).map(([, kind, label, ox, oy, width, height, rotation, support]) => ({
      id: `${id}-${kind}`, kind, label, title: names[kind],
      image: `/assets/scene-07/objects/${art[kind]}-natural.png`,
      description: "Учебный игровой рисунок; не определение организма в исходном видео.",
      x: ox, y: oy, width, height, rotation, support,
    }));
    return { id, woodlandId: PINE_WALK_ENTRY, title,
      image: `/assets/scene-09/${frame}`, thumbnail: `/assets/scene-09/thumbs/${frame}`,
      sourceVideo: "PXL_20261003_133858340.TS.mp4", width: 1920, height: 1080,
      sourceTimeSeconds, links, objects, details: [],
    };
  });
}
export const pineWalkViews = buildPineWalk();
