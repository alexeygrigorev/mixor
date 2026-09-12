import { useState, type CSSProperties } from "react";
import type { TaxonId } from "./data";
import type { LifeIllustration } from "./life-data";
import { publicUrl } from "./public-url.ts";

export function Art({
  taxon,
  stage,
  className = "",
  label,
}: {
  taxon: TaxonId;
  stage?: LifeIllustration;
  className?: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  const portraits: Record<string, number> = {
    physarum: 0,
    arcyria: 1,
    fuligo: 2,
    lycogala: 3,
    stemonitis: 4,
    trichia: 5,
    tubifera: 6,
    didymium: 7,
  };
  const stages: Record<LifeIllustration, number> = {
    spore: 0,
    cells: 1,
    fusion: 2,
    zygote: 3,
    division: 4,
    young: 5,
    spreading: 6,
    veins: 7,
    network: portraits[taxon],
    forming: portraits[taxon],
    fruit: portraits[taxon],
    rest: 3,
  };
  const index = stage ? stages[stage] : (portraits[taxon] ?? 0);
  const early =
    stage &&
    ["spore", "cells", "fusion", "zygote", "division", "young", "spreading", "veins"].includes(stage);
  const columns = 4;
  const single = false;
  const file = !stage
    ? "organisms-v2"
    : early
      ? `early-${taxon}-v3`
      : stage === "forming"
        ? "growth-forming"
        : stage === "fruit"
          ? "growth-mature"
          : "growth-networks";
  return (
    <div
      className={`art ${single ? "single" : ""} ${className}`}
      role="img"
      aria-label={label}
      style={
        {
          "--columns": columns,
          "--column": index % columns,
          "--row": Math.floor(index / columns),
          "--tile-aspect": stage && !early ? 0.75 : 1,
        } as CSSProperties
      }
    >
      {!failed ? (
        <img
          key={file}
          src={publicUrl(`/assets/art/${file}.webp`)}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="image-error">
          Иллюстрация недоступна. Можно открыть настоящее фото.
        </span>
      )}
    </div>
  );
}
