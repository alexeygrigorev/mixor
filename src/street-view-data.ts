import { publicUrl } from "./public-url.ts";

export type WalkLink = {
  to: string;
  label: string;
  x: number;
  y: number;
  angle: number;
  motion: "forward" | "left" | "right" | "back";
};

export type WalkView = {
  id: string;
  woodlandId: string;
  title: string;
  image: string;
  links: WalkLink[];
};

// Nearby views of one generated environment, not recorded geographic positions.
export const walkViews: WalkView[] = [
  {
    id: "6-3d",
    woodlandId: "wetland",
    title: "У камышовой тропы",
    image: "/assets/art/search-wetland-v1.webp",
    links: [
      { to: "6-3d-path", label: "Вперёд по тропинке", x: 29, y: 57, angle: -12, motion: "forward" },
      { to: "6-3d-branches", label: "К веткам слева", x: 11, y: 64, angle: -65, motion: "left" },
    ],
  },
  {
    id: "6-3d-path",
    woodlandId: "wetland",
    title: "На тропинке",
    image: "/assets/art/walk-wetland-path-v2.webp",
    links: [
      { to: "6-3d", label: "Шаг назад", x: 53, y: 86, angle: 180, motion: "back" },
      { to: "6-3d-branches", label: "К веткам слева", x: 16, y: 77, angle: -100, motion: "left" },
    ],
  },
  {
    id: "6-3d-branches",
    woodlandId: "wetland",
    title: "Рядом с упавшими ветками",
    image: "/assets/art/walk-wetland-branches-v1.webp",
    links: [
      { to: "6-3d", label: "Вернуться к камням", x: 71, y: 84, angle: 125, motion: "right" },
      { to: "6-3d-path", label: "Выйти на тропинку", x: 64, y: 57, angle: 30, motion: "right" },
    ],
  },
];
for (const view of walkViews) view.image = publicUrl(view.image);

export const getWalkView = (id: string) => walkViews.find((view) => view.id === id);
