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
    id: "wetland",
    woodlandId: "wetland",
    title: "У камышовой тропы",
    image: "/assets/art/search-wetland-v1.webp",
    links: [
      { to: "wetland-path", label: "Вперёд по тропинке", x: 29, y: 57, angle: -12, motion: "forward" },
      { to: "wetland-branches", label: "К веткам слева", x: 11, y: 64, angle: -65, motion: "left" },
    ],
  },
  {
    id: "wetland-path",
    woodlandId: "wetland",
    title: "На тропинке",
    image: "/assets/art/walk-wetland-path-v2.webp",
    links: [
      { to: "wetland", label: "Шаг назад", x: 53, y: 86, angle: 180, motion: "back" },
      { to: "wetland-branches", label: "К веткам слева", x: 16, y: 77, angle: -100, motion: "left" },
    ],
  },
  {
    id: "wetland-branches",
    woodlandId: "wetland",
    title: "Рядом с упавшими ветками",
    image: "/assets/art/walk-wetland-branches-v1.webp",
    links: [
      { to: "wetland", label: "Вернуться к камням", x: 71, y: 84, angle: 125, motion: "right" },
      { to: "wetland-path", label: "Выйти на тропинку", x: 64, y: 57, angle: 30, motion: "right" },
    ],
  },
];

export const getWalkView = (id: string) => walkViews.find((view) => view.id === id);
