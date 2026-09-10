# U53: bounded visual-rain correction

2026-09-10. Independent reviewer Leibniz issued **SCOPED VISUAL WEATHER: ACCEPT** in round 5, with no finite revision remaining. This applies only to the observed repeated visual pattern. Rain-sound naturalness, the user's intended visual/audio scope, circle presentation, broader artwork and listening remain open in [the feedback checklist](USER_FEEDBACK.md). No overall or physical-device acceptance is claimed.

## Change

The roots and birch scenes now have stable irregular streak positions and phases, depth-linked size/speed variation and a coherent near-vertical fall through the full view. Drops reset outside the scene rather than sliding a short repeated distance. Reduced motion keeps an irregular static indication of rain. Dry scenes contain no rain layer, and the overlay never receives pointer input. This is a bounded visual correction: no audio files, organism circles, background art or unrelated controls were changed.

## Review and retained evidence

The reviewer inspected twelve native normal/reduced-motion cases: both rainy scenes at phone 390×844, tablet 1024×768 and short landscape 844×390. It decoded all six submitted recordings, inspecting timestamped 24-frame sequences at 10fps, and sampled live animation for 3.4 seconds per normal case. This is frame-based inspection, not a claim of physical-device or real-time human viewing. All three discover → learn → return interactions passed in each scene, size and motion mode: 36 checks with focus/progress restored, no page errors and unobstructed Back/scene controls.

The finite criteria passed: recognizable light rain; less regularly repeated pattern with coherent full-view falling; static reduced motion and usable input; no rain in dry scenes or unrelated UI changes. Main separately passed 26 affected audio/focused browser tests and final typecheck/build/assets/offline checks. The separate [development review](DEVELOPMENT_REVIEW.md) remains valid.

Representative unmodified captures retained in Git:

| Scene / size | Normal rain | Reduced motion | Recorded rain and discovery |
| --- | --- | --- | --- |
| Roots / phone | [Still](screenshots/weather-natural/phone-roots-rain.png) | [Still](screenshots/weather-natural/phone-roots-rain-reduced.png) | [Video](screenshots/weather-natural/phone-roots-rain-and-discovery.webm) |
| Birch / phone | [Still](screenshots/weather-natural/phone-bark-rain.png) | [Still](screenshots/weather-natural/phone-bark-rain-reduced.png) | [Video](screenshots/weather-natural/phone-bark-rain-and-discovery.webm) |
| Roots / tablet | — | [Still](screenshots/weather-natural/tablet-roots-rain-reduced.png) | — |
| Birch / short landscape | — | [Still](screenshots/weather-natural/landscape-bark-rain-reduced.png) | — |

`node scripts/capture-weather-review.mjs` reproduces all six recorded contexts and twelve normal/reduced cases against the local dev server. Full submitted captures and reviewer-owned probes remain scratch artifacts in `tmp/focused-review/weather-natural/` and `tmp/focused-review/reviewer-r5/`; the detailed verdict is `tmp/focused-review/ROUND5_WEATHER_REVIEW.md`. These ignored scratch paths are not claimed to be published.

Reviewed implementation identity:

```text
52da3b1f30612a2cfa291bdcada4f905745a88f9beb3eacc303ad802f1db07f9 src/weather.tsx
1dbdec63191d3e16221ee17ce9bed9d44fb755c8c5de6e6b38ba482d16d4b001 src/weather.css
```
