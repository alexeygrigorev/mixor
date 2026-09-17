import { useEffect, useRef } from "react";
import { publicUrl } from "./public-url";
import { woodlands } from "./search-data";
import { mountPhotoWalk, type PhotoWalkController } from "./photo-walk-core";
import { photoWalkViews, PHOTO_WALK_ENTRY, PHOTO_WALK_FADE_MS, validatePhotoWalk, type PhotoWalkView } from "./photo-walk-data";
import "./photo-walk.css";

validatePhotoWalk(photoWalkViews);

export function PhotoWalkScene({ view, change, back }: {
  view: PhotoWalkView;
  change: (id: string) => void;
  back: () => void;
}) {
  const host = useRef<HTMLElement>(null);
  const controller = useRef<PhotoWalkController | null>(null);
  const actions = useRef({ change, back });
  actions.current = { change, back };
  useEffect(() => {
    const root = host.current!;
    const index = woodlands.findIndex((place) => place.id === "video-forest");
    const scene = mountPhotoWalk(root, {
      views: photoWalkViews,
      entry: PHOTO_WALK_ENTRY,
      fadeMs: PHOTO_WALK_FADE_MS,
      resolveImage: publicUrl,
      reducedMotion: () => !!root.closest(".calm"),
      onNavigate: (id) => actions.current.change(id),
      onBack: () => actions.current.back(),
      onPreviousPlace: () => actions.current.change(woodlands[(index + woodlands.length - 1) % woodlands.length].id),
      onNextPlace: () => actions.current.change(woodlands[(index + 1) % woodlands.length].id),
    });
    controller.current = scene;
    return () => { scene.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { void controller.current?.setView(view.id); }, [view.id]);
  return <section ref={host} className="search-scene photo-walk-host" />;
}
