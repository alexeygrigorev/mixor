# Organism encounter — U66

2026-09-10. Independent R2 verdict: **SCOPED U66 PORTRAIT UI: ACCEPT**, with no remaining finite findings. This is not overall/user acceptance, physical-device certification or approval of broader organism realism/audio quality.

The eight organism pages now use one scientific identity, a large existing organism picture, a species-specific caption and compact development/observation actions. Real photos and sources remain optional. The observation activity retains photo inspection, answer choices including “Не различаю”, explanations and explicit journal save. Finding, classification, development and browser-history returns retain their context. No organism art, source records, taxonomy, stored observations or backgrounds were replaced for this layout.

Phone stacks the image and controls; tablet/wide and short landscape place them side by side. Photo inspection keeps a useful viewing area, actual captions/credits and full-frame controls. Larger text reflows in a local scroller instead of clipping actions or forcing horizontal page scrolling.

The independent review caught one accessibility regression: visible “Наблюдать” had the old accessible name “Сделать открытие”. The stale override was removed and seven test selectors updated. All-eight portrait tests now assert that action names match their visible labels. R2 independently rechecked eighteen route/viewport combinations and seven grouped flows, with zero naming mismatches or page errors. The visual design did not change for this fix.

## Evidence

- [All eight phone portraits](screenshots/portrait-u66/phone-contact-sheet.png).
- [All eight tablet portraits](screenshots/portrait-u66/tablet-contact-sheet.png).
- Native Arcyria [phone](screenshots/portrait-u66/phone-arcyria-rest.png) and [short landscape](screenshots/portrait-u66/phone-landscape-arcyria.png).
- [Phone observation workspace](screenshots/portrait-u66/phone-arcyria-observation.png).
- [Phone actions at 200% text](screenshots/portrait-u66/phone-physarum-text200-actions.png).

Reviewer checked all eight taxa, four viewport sizes, long-name/synonym examples, keyboard/touch, photo full-frame/credit access, sources Escape/focus return, complete observation→answer→save→journal reload and finding/history/classification/deep-link return. All ten search-background hashes remained unchanged. Main inspected both all-species sheets and representative native/enlarged frames.

The implementer passed eight portrait cases per browser before the name fix, then 44 affected Chromium checks and sixteen all-species name/activation checks after it. The full pre-name-fix Chromium checkpoint passed 91 browser checks plus eight domain/content tests. Final cross-browser/integration results belong in [implementation status](IMPLEMENTATION_STATUS.md); unrelated history-rate stress findings are not hidden by this visual verdict.

Detailed working reports: `tmp/portrait-u66/HANDOFF.md`, `tmp/embedded-review/U66_REVIEW_R1.md` and `U66_REVIEW_R2.md`. The six retained screenshots/contact sheets preserve the accepted presentation in Git.
