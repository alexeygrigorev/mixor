import type { CSSProperties } from "react";
import type { Woodland } from "./search-data";
import "./weather.css";

// A stable irregular shower, not a grid of repeated offsets. Depth links the
// apparent streak size and falling speed; reopening a scene does not reshuffle it.
const rainDrops = (() => {
  let seed = 0x4d49584f;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  return Array.from({ length: 96 }, () => {
    const depth = 0.15 + random() * 0.85;
    const seconds = (1.85 - depth) * 0.95;
    return {
      left: `calc(${(random() * 100).toFixed(3)}% + 4vh)`,
      "--rain-rest-top": `${(random() * 97).toFixed(3)}%`,
      "--rain-speed": `${seconds.toFixed(3)}s`,
      "--rain-delay": `${(-random() * seconds).toFixed(3)}s`,
      "--rain-width": `${(0.75 + depth * 0.45).toFixed(2)}px`,
      "--rain-length": `${(8 + depth * 22).toFixed(2)}px`,
      "--rain-opacity": (0.34 + random() * 0.12 - depth * 0.06).toFixed(3),
      "--rain-softness": depth > 0.8 ? "0.3px" : "0px",
    } as CSSProperties;
  });
})();

/** Scene weather is decoration, never a hit target or a prerequisite for finding. */
export function SceneWeather({ weather }: { weather: Woodland["weather"] }) {
  return (
    <div className={`scene-weather weather-${weather}`} data-weather={weather}>
      <span className="sr-only">
        {weather === "rain"
          ? "Тихий дождь"
          : weather === "overcast"
            ? "Пасмурно, без дождя"
            : "Сухой день"}
      </span>
      {weather === "rain" && (
        <div className="rain-streaks" aria-hidden="true">
          {rainDrops.map((style, i) => <span key={i} style={style} />)}
        </div>
      )}
    </div>
  );
}
