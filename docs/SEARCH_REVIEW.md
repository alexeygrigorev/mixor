# Embedded search and replay — U59/U63–65/U70

**Reopened by U73–U75:** the user rejected clue/lens matching and two substrate placements after this checkpoint. The verdict and captures below document the earlier submission, not acceptance of those newer requests. [Current checklist](USER_FEEDBACK.md) tracks actual magnification and all-fifteen placement review; the existing backgrounds remain unchanged.

2026-09-10. Independent verdict: **SCOPED U59/U63–65 SEARCH: ACCEPT**, with no finite findings. This accepts the bounded interaction/layout correction, not overall user approval, broader organism realism, audio quality or physical-device behavior.

Small organism details now follow real foreground features in the existing pictures. They use the background's exact source-to-screen transform instead of independent screen placement. Their transparent touch areas remain 56×56 CSS px. Tap opens one circular magnifier with the scientific identity and “Узнать больше”; Close/Escape restores the quiet search view and origin focus. Dismissed finds can be inspected again.

Back out of a woodland resets only that place for replay. Returning from organism information preserves the originating find. Scene switching and reload alone do not reset finds; journal photos, discoveries, development and other places remain intact.

All five source PNGs and runtime WebPs retain their original hashes. The fifteen stable IDs/taxa and source anchors are in [search-data.ts](../src/search-data.ts); [browser checks](../tests/browser/embedded-search.spec.ts) pin the ten unchanged hashes and verify projection, small-phone bounds and replay storage boundaries.

## Rendered evidence

- [Phone: all five places, resting and selected](screenshots/embedded-search/phone-contact.png).
- [Tablet: all five places](screenshots/embedded-search/tablet-contact.png).
- [Short landscape: all five places](screenshots/embedded-search/landscape-contact.png).
- Native phone [resting forest](screenshots/embedded-search/phone-forest-resting.png) and [selected magnification](screenshots/embedded-search/phone-forest-selected.png).
- [Phone selected view at 200% text](screenshots/embedded-search/phone-roots-selected-text200.png).

The reviewer inspected all 30 native five-place/three-size frames, two wide-forest frames and collapsed/keyboard/rotation/200% states. Independent execution covered 15 scene/viewport cases, 45 complete select→dismiss→reselect→learn→return paths, 15 weather cases, replay and byte-identical synthetic-original/journey preservation. All ten background hashes matched; maximum measured anchor discrepancy was 0.015 CSS px; no page errors occurred.

Main also inspected all five phone resting scenes and representative selected/enlarged/landscape views. The full Chromium checkpoint passed 91 browser cases plus eight domain/content tests, with three redundant matrix skips. Small-phone checks cover all fifteen targets at 360×640 and 320×568. Cross-browser final results are recorded separately in [implementation status](IMPLEMENTATION_STATUS.md).

Full working evidence and independent probe remain under `tmp/embedded-search/` and `tmp/embedded-review/SEARCH_REVIEW_R1.md`. The six screenshots/contact sheets above preserve the reviewed presentation in Git; the tests do not depend on scratch artifacts.
