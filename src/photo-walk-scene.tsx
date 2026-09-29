import type { TaxonId } from "./data";
import { useEffect, useRef } from "react";
import { publicUrl } from "./public-url";
import { mountPhotoWalk, type PhotoWalkController } from "./photo-walk-core";
import { photoWalkViews, PHOTO_WALK_ENTRY, PHOTO_WALK_FADE_MS, validatePhotoWalk, type PhotoWalkView } from "./photo-walk-data";
import { audioManager } from "./audio";
import "./photo-walk.css";
import "./photo-walk-navigation.css";

validatePhotoWalk(photoWalkViews);

export function PhotoWalkScene({ view, change, back, settings, inspect }: {
  view: PhotoWalkView;
  change: (id: string) => void;
  back: () => void;
  settings?: () => void;
  inspect?: (taxonId: TaxonId, objectId: string) => void;
}) {
  const host = useRef<HTMLElement>(null);
  const controller = useRef<PhotoWalkController | null>(null);
  const actions = useRef({ change, back, settings, inspect });
  actions.current = { change, back, settings, inspect };
  useEffect(() => {
    const root = host.current!;
    const scene = mountPhotoWalk(root, {
      views: photoWalkViews,
      entry: PHOTO_WALK_ENTRY,
      fadeMs: PHOTO_WALK_FADE_MS,
      resolveImage: publicUrl,
      reducedMotion: () => !!root.closest(".calm"),
      onNavigate: (id) => actions.current.change(id),
      onBack: () => actions.current.back(),
      onSettings: settings ? () => actions.current.settings?.() : undefined,
      onLearn: (taxonId, objectId) => actions.current.inspect?.(taxonId, objectId),
      onObjectFound: () => audioManager.playSfx("uncover"),
    });
    controller.current = scene;
    return () => { scene.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { void controller.current?.setView(view.id); }, [view.id]);
  return <section ref={host} className="search-scene photo-walk-host" />;
}
