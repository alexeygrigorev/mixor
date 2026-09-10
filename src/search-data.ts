import type { TaxonId } from "./data";

export type HidingPlace = {
  id: string;
  taxon: TaxonId;
  // Percent coordinates in the unchanged 1536×1024 source image, not viewport.
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
  weather: "clear" | "overcast" | "rain";
  spots: HidingPlace[];
};
export const woodlands: Woodland[] = [
  {
    id: "forest",
    title: "Лесная поляна",
    description: "Мох и трещинки старого бревна",
    image: "/assets/art/search-forest.webp",
    weather: "clear",
    spots: [
      {
        id: "forest-network",
        taxon: "physarum",
        x: 40,
        y: 43,
        size: 8,
        label: "Трещина на бревне слева",
        turn: -12,
      },
      {
        id: "forest-arcyria",
        taxon: "arcyria",
        x: 50,
        y: 52,
        size: 6,
        label: "Кора у края мха справа",
        turn: 8,
      },
      {
        id: "forest-lycogala",
        taxon: "lycogala",
        x: 60,
        y: 62,
        size: 7,
        label: "Нижняя трещина на бревне",
        turn: -6,
      },
    ],
  },
  {
    id: "stump",
    title: "Старый пень",
    description: "Дупло, корни и отслоившаяся кора",
    image: "/assets/art/search-stump.webp",
    weather: "overcast",
    spots: [
      {
        id: "stump-fuligo",
        taxon: "fuligo",
        x: 41,
        y: 65,
        size: 8,
        label: "Мох у отломленного корня",
        turn: -16,
      },
      {
        id: "stump-stemonitis",
        taxon: "stemonitis",
        x: 40,
        y: 48,
        size: 6,
        label: "Расщеплённый край пня",
        turn: 3,
      },
      {
        id: "stump-trichia",
        taxon: "trichia",
        x: 58,
        y: 70,
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
    weather: "overcast",
    spots: [
      {
        id: "leaves-didymium",
        taxon: "didymium",
        x: 49,
        y: 75,
        size: 6,
        label: "Коричневый лист между веточками",
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
        x: 60,
        y: 54,
        size: 8,
        label: "Открытая древесина на торце бревна",
        turn: -4,
      },
    ],
  },
  {
    id: "roots",
    title: "Мшистый берег",
    description: "Влажная древесина между корнями",
    image: "/assets/art/search-roots.webp",
    weather: "rain",
    spots: [
      {
        id: "roots-tubifera",
        taxon: "tubifera",
        x: 43,
        y: 70,
        size: 7,
        label: "Тёмная щель поваленного бревна",
        turn: -9,
      },
      {
        id: "roots-physarum",
        taxon: "physarum",
        x: 59,
        y: 77,
        size: 8,
        label: "Продольная трещина под камнем",
        turn: 14,
      },
      {
        id: "roots-didymium",
        taxon: "didymium",
        x: 41,
        y: 52,
        size: 6,
        label: "Лист у кромки мха над камнем",
        turn: -5,
      },
    ],
  },
  {
    id: "bark",
    title: "В тени берёзы",
    description: "Береста и потайные щели ствола",
    image: "/assets/art/search-bark.webp",
    weather: "rain",
    spots: [
      {
        id: "bark-stemonitis",
        taxon: "stemonitis",
        x: 50,
        y: 54,
        size: 7,
        label: "Тёмная щель на поваленной берёзе",
        turn: 2,
      },
      {
        id: "bark-arcyria",
        taxon: "arcyria",
        x: 60,
        y: 62,
        size: 6,
        label: "Край отслоившейся бересты",
        turn: -10,
      },
      {
        id: "bark-tubifera",
        taxon: "tubifera",
        x: 41,
        y: 64,
        size: 7,
        label: "Потемневшая ветка у папоротника",
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
