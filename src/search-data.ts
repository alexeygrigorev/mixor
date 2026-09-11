import type { TaxonId } from "./data";
import { getWalkView } from "./street-view-data";

export type HidingPlace = {
  id: string;
  taxon: TaxonId;
  // Percent coordinates in the unchanged 1536×1024 source image, not viewport.
  x: number;
  y: number;
  size: number;
  label: string;
  // Some scenes contain the tiny discovery in the background artwork itself;
  // keep the touch target, but do not paste a second macro over it.
  visibleClue?: boolean;
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
      },
      {
        id: "forest-arcyria",
        taxon: "arcyria",
        x: 50,
        y: 52,
        size: 6,
        label: "Кора у края мха справа",
      },
      {
        id: "forest-lycogala",
        taxon: "lycogala",
        x: 60,
        y: 62,
        size: 7,
        label: "Нижняя трещина на бревне",
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
        x: 43,
        y: 66,
        size: 8,
        label: "Волокна отломленного корня",
      },
      {
        id: "stump-stemonitis",
        taxon: "stemonitis",
        x: 39,
        y: 50,
        size: 6,
        label: "Расщеплённый край пня",
      },
      {
        id: "stump-trichia",
        taxon: "trichia",
        x: 56,
        y: 63,
        size: 6,
        label: "Тёмная ветка справа от пня",
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
      },
      {
        id: "leaves-trichia",
        taxon: "trichia",
        x: 43,
        y: 46,
        size: 6,
        label: "Прелая веточка слева",
      },
      {
        id: "leaves-fuligo",
        taxon: "fuligo",
        x: 61.5,
        y: 55.5,
        size: 8,
        label: "Открытая древесина на торце бревна",
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
        x: 49,
        y: 75,
        size: 7,
        label: "Тёмная щель поваленного бревна",
      },
      {
        id: "roots-physarum",
        taxon: "physarum",
        x: 60,
        y: 77.8,
        size: 8,
        label: "Продольная трещина поваленного бревна",
      },
      {
        id: "roots-didymium",
        taxon: "didymium",
        x: 41,
        y: 52,
        size: 6,
        label: "Лист у кромки мха над камнем",
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
        x: 52.5,
        y: 55,
        size: 7,
        label: "Тёмная щель на поваленной берёзе",
      },
      {
        id: "bark-arcyria",
        taxon: "arcyria",
        x: 61.5,
        y: 64,
        size: 6,
        label: "Край отслоившейся бересты",
      },
      {
        id: "bark-tubifera",
        taxon: "tubifera",
        x: 42.3,
        y: 50.5,
        size: 7,
        label: "Потемневший конец упавшей берёзы",
      },
    ],
  },
  {
    id: "wetland",
    title: "Камышовая тропа",
    description: "Мох, поваленная ветка и высокая трава у тропы",
    image: "/assets/art/search-wetland-v1.webp",
    weather: "overcast",
    spots: [
      {
        id: "wetland-tubifera",
        taxon: "tubifera",
        x: 6.5,
        y: 51,
        size: 4,
        label: "Кора поваленной ветки слева",
        visibleClue: false,
      },
      {
        id: "wetland-didymium",
        taxon: "didymium",
        x: 49,
        y: 86,
        size: 4,
        label: "Мёртвые листья в мшистом шве",
        visibleClue: false,
      },
    ],
  },
];
export const findWoodland = (id: string) =>
  woodlands.find((w) => w.id === (getWalkView(id)?.woodlandId ?? id)) ?? woodlands[0];
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
