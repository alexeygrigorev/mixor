import { useState, type CSSProperties } from "react";
import type { TaxonId } from "./data";
import type { LifeIllustration } from "./life-data";

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
    network: 3,
    fruit: taxon === "arcyria" ? 5 : 4,
    rest: 3,
  };
  const index = stage ? stages[stage] : (portraits[taxon] ?? 0);
  const columns = stage ? 3 : 4;
  const single = taxon === "arcyria" && stage === "network";
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
        } as CSSProperties
      }
    >
      {!failed ? (
        <img
          src={`/assets/art/${single ? "arcyria-network" : stage ? "life-stages-v2" : "organisms-v2"}.webp`}
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
