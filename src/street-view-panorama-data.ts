import { publicUrl } from "./public-url.ts";
import { getWalkView, type WalkView } from "./street-view-data";
import { wrapAngle } from "./street-view-renderer";

// Local, illustrative scene coordinates; never geographic observations.
export const panoramaPoints: Record<string, { image: string; x: number; z: number; yaw: number }> = {
  "6-3d": { image: "/assets/art/wetland-cube-stones-v2.webp", x: 0, z: 0, yaw: 0 },
  "6-3d-path": { image: "/assets/art/wetland-cube-path-v2.webp", x: -2, z: 4, yaw: 0 },
  "6-3d-branches": { image: "/assets/art/wetland-cube-branches-v2.webp", x: -3, z: 1, yaw: 0 },
};
for (const point of Object.values(panoramaPoints)) point.image = publicUrl(point.image);

export function panoramaLinks(view: WalkView) {
  const origin = panoramaPoints[view.id];
  return view.links.flatMap((link) => {
    const destination = panoramaPoints[link.to];
    const target = getWalkView(link.to);
    if (!origin || !destination || !target) return [];
    const x = destination.x - origin.x;
    const z = destination.z - origin.z;
    return [{ ...link, label: target.title, yaw: wrapAngle(Math.atan2(x, z) * 180 / Math.PI),
      pitch: -Math.atan2(1.6, Math.hypot(x, z)) * 180 / Math.PI }];
  });
}
