import type { CSSProperties } from "react";
import type { Woodland } from "./search-data";
import "./weather.css";

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
          {Array.from({ length: 72 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  left: `${(i * 37.7) % 100}%`,
                  top: `${(i * 23.3) % 100}%`,
                  "--rain-speed": `${0.8 + (i % 7) * 0.17}s`,
                  "--rain-delay": `${-i * 0.21}s`,
                  "--rain-length": `${15 + (i % 5) * 4}px`,
                  "--rain-opacity": 0.3 + (i % 4) * 0.08,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
