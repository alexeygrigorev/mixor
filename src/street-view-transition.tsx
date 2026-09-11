import { useEffect, useRef } from "react";
import { getWalkView } from "./street-view-data";

export function StreetViewTransition({ from, to, complete }: {
  from: string;
  to: string;
  complete: () => void;
}) {
  const previousImage = useRef<HTMLImageElement>(null);
  const onComplete = useRef(complete);
  onComplete.current = complete;

  useEffect(() => {
    const image = previousImage.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || image.closest(".calm")) {
      onComplete.current();
      return;
    }
    // The decoded destination is already underneath. Fade only the old image;
    // keep both viewpoints' geometry and framing completely still.
    const fade = image.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 240,
      easing: "ease-in-out",
      fill: "forwards",
    });
    fade.onfinish = () => onComplete.current();
    return () => { fade.onfinish = null; fade.cancel(); };
  }, [from, to]);

  return <img ref={previousImage} className="walk-transition"
    src={getWalkView(from)?.image} alt="" aria-hidden="true" draggable={false} />;
}
