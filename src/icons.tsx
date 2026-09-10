export type IconName =
  | "leaf"
  | "tree"
  | "cycle"
  | "lens"
  | "book"
  | "plus"
  | "close"
  | "back"
  | "next"
  | "sound"
  | "mute"
  | "settings"
  | "expand"
  | "check"
  | "camera"
  | "info"
  | "minus";

const paths: Record<IconName, string> = {
  leaf: "M20 4C10 2 3 7 5 15c2 7 15 6 15-11ZM4 21 15 10M8 17l-1-6m5 2h5",
  tree: "M12 21v-7M5 11l7-8 7 8h-4l6 6H3l6-6H5Z",
  cycle: "M20 10a8 8 0 0 0-14-4L3 9m0-5v5h5m-4 5a8 8 0 0 0 14 4l3-3m0 5v-5h-5",
  lens: "M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  book: "M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-2-10 1Z",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  back: "m14 5-7 7 7 7",
  next: "m10 5 7 7-7 7",
  sound: "m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6",
  settings: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5",
  check: "m5 12 4 4L20 5",
  camera: "M3 7h4l2-3h6l2 3h4v14H3V7Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  minus: "M5 12h14",
};
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
