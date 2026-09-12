import { getWalkView, type WalkView } from "./street-view-data";
import { wrapAngle } from "./street-view-renderer";

// Local, illustrative scene coordinates; never geographic observations.
export const panoramaPoints: Record<string, { image: string; x: number; z: number; yaw: number }> = {
  "6-3d": { image: "/assets/art/wetland-360-stones-v1.webp", x: 0, z: 0, yaw: -28 },
  "6-3d-path": { image: "/assets/art/wetland-360-path-v1.webp", x: -2, z: 4, yaw: -28 },
  "6-3d-branches": { image: "/assets/art/wetland-360-branches-v1.webp", x: -3, z: 1, yaw: 18 },
};

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
