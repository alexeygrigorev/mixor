import type { TaxonId } from "./data";

export type HidingPlace = {
  id: string;
  taxon: TaxonId;
  x: number;
  y: number;
  size: number;
  label: string;
  turn: number;
};
export type Woodland = {
  id: string;
  title: string;
  description: string;
  image: string;
  spots: HidingPlace[];
};
export const woodlands: Woodland[] = [
  {
    id: "forest",
    title: "Лесная поляна",
    description: "Мох и трещинки старого бревна",
    image: "/assets/art/search-forest.webp",
    spots: [
      {
        id: "forest-network",
        taxon: "physarum",
        x: 42,
        y: 44,
        size: 8,
        label: "Трещина на бревне слева",
        turn: -12,
      },
      {
        id: "forest-arcyria",
        taxon: "arcyria",
        x: 58,
        y: 54,
        size: 6,
        label: "Кора у края мха справа",
        turn: 8,
      },
      {
        id: "forest-lycogala",
        taxon: "lycogala",
        x: 48,
        y: 72,
        size: 7,
        label: "Кусочек древесины внизу",
        turn: -6,
      },
    ],
  },
  {
    id: "stump",
    title: "Старый пень",
    description: "Дупло, корни и отслоившаяся кора",
    image: "/assets/art/search-stump.webp",
    spots: [
      {
        id: "stump-fuligo",
        taxon: "fuligo",
        x: 42,
        y: 60,
        size: 8,
        label: "Мох на левом корне",
        turn: -16,
      },
      {
        id: "stump-stemonitis",
        taxon: "stemonitis",
        x: 56,
        y: 44,
        size: 6,
        label: "Край тёмного дупла",
        turn: 3,
      },
      {
        id: "stump-trichia",
        taxon: "trichia",
        x: 58,
        y: 76,
        size: 6,
        label: "Ложбинка на нижнем корне",
        turn: 9,
      },
    ],
  },
  {
    id: "leaves",
    title: "Под листвой",
    description: "Сухие листья и прелые веточки",
    image: "/assets/art/search-leaves.webp",
    spots: [
      {
        id: "leaves-didymium",
        taxon: "didymium",
        x: 60,
        y: 44,
        size: 6,
        label: "Коричневый лист справа",
        turn: -8,
      },
      {
        id: "leaves-trichia",
        taxon: "trichia",
        x: 41,
        y: 61,
        size: 6,
        label: "Прелая веточка слева",
        turn: 10,
      },
      {
        id: "leaves-fuligo",
        taxon: "fuligo",
        x: 55,
        y: 77,
        size: 8,
        label: "Щепа между нижними листьями",
        turn: -4,
      },
    ],
  },
  {
    id: "roots",
    title: "Мшистый берег",
    description: "Влажная древесина между корнями",
    image: "/assets/art/search-roots.webp",
    spots: [
      {
        id: "roots-tubifera",
        taxon: "tubifera",
        x: 43,
        y: 49,
        size: 7,
        label: "Тёмная древесина под корнем",
        turn: -9,
      },
      {
        id: "roots-physarum",
        taxon: "physarum",
        x: 57,
        y: 66,
        size: 8,
        label: "Ветка рядом с плоским камнем",
        turn: 14,
      },
      {
        id: "roots-didymium",
        taxon: "didymium",
        x: 42,
        y: 79,
        size: 6,
        label: "Лист у нижней кромки мха",
        turn: -5,
      },
    ],
  },
  {
    id: "bark",
    title: "В тени берёзы",
    description: "Береста и потайные щели ствола",
    image: "/assets/art/search-bark.webp",
    spots: [
      {
        id: "bark-stemonitis",
        taxon: "stemonitis",
        x: 43,
        y: 36,
        size: 7,
        label: "Внутренняя сторона ствола слева",
        turn: 2,
      },
      {
        id: "bark-arcyria",
        taxon: "arcyria",
        x: 57,
        y: 53,
        size: 6,
        label: "Край деревянного выступа",
        turn: -10,
      },
      {
        id: "bark-tubifera",
        taxon: "tubifera",
        x: 47,
        y: 73,
        size: 7,
        label: "Гниющая древесина под берестой",
        turn: 8,
      },
    ],
  },
];
export const findWoodland = (id: string) =>
  woodlands.find((w) => w.id === id) ?? woodlands[0];
const key = "mixor-search-v1";
const validIds = new Set(woodlands.flatMap((w) => w.spots.map((s) => s.id)));
export function readFinds(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === "string" && validIds.has(id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function writeFinds(finds: string[]): boolean {
  try {
    localStorage.setItem(
      key,
      JSON.stringify([...new Set(finds.filter((id) => validIds.has(id)))]),
    );
    return true;
  } catch {
    return false;
  }
}
