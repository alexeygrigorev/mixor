# Stage 7: a forest you can explore

2026-09-29. Implements the user's request to remove generated search stages 1–6, focus on stage 7, support moving the view on phones, and replace awkward desktop arrows. This supersedes the stage-selection, fixed-letterbox and ground-arrow contracts in SCENE_07.md and earlier street-view reviews. It does not retire organism development stages.

## Implemented

- Only the real-frame forest walk is offered. Retired scene bookmarks fall back to it. Historical discovery IDs remain readable; journal blobs and learned development stages are untouched.
- A full-height, undistorted photograph fills phone, tablet and desktop. Drag to look around; pinch, wheel or buttons change digital zoom. Full-frame overview is optional and returns to the previous view. Camera movement is bounded to the image, with no perspective warping or inertial animation.
- Named paths stay at the bottom of the viewport. No arrows or magnifier buttons float over the forest. Six distinct captured views retain their reversible route graph and short stationary fades; reduced motion disables fades.
- Each stop has a discovery count and optional hint. Hints move the camera and mark a clue without awarding it. Finding a detail opens its illustration and an observation question; all 21 finds complete the walk. Illustrations remain explicitly separate from evidence in the video.
- Visited stops, discoveries and each view's camera position persist in a validated local game store. A denied write displays an unsaved-progress warning. Replay requires an explicit confirmation and resets only the game store.
- Keyboard focus brings clues into view, including those near the bottom behind the controls. Dragging from a clue does not award it. Dialog close restores focus synchronously, avoiding a queued native close event moving the camera back to an old target.
- Settings are reachable during the walk. Existing music, nature and uncover sound handling remains in AudioManager. No new sound assets or listening approval claimed.
- Retired generated search images are excluded from the offline precache. Source assets and historical tests remain archived; see RETIRED_SEARCH_TESTS.md.

## Implementation decisions

DOM photo layers and a small camera controller are sufficient; no new renderer or dependencies were introduced. Camera state uses normalized image centres and zoom 1–2.5. Scene transitions, controls and the image share a single route owner. Pointer capture begins after a movement threshold; capture loss from a child during transfer must not cancel the viewport's gesture. The photo viewport uses `touch-action: none`; other controls and dialogs retain normal browser interactions. Sources checked: [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action), [MDN pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture).

Local game progress is not cloud synchronization or a family observation. LocalStorage merging preserves prior finds from a stale writer on a best-effort basis; it is not a cross-tab transaction. Explicit replay starts a new local search. Original photographs and metadata are not written by this module.

## Validation

Test results and rendered evidence are recorded below after the final checks. Browser emulation is not a physical Android/iPhone/iPad test. Subjective naturalness and gameplay acceptance remain with the user.

Physical devices: not tested. Audio listening: not performed in this change. AWS/family sync: still not implemented. Public deployment: not performed by this change.

### Completed checks

- `npm test`: 25 unit/content/progress/camera tests and 94 Chromium browser tests passed; 30 instances explicitly retired with stages 1–6. This full run preceded the last visual polish; the affected walk suites were rerun afterward.
- Final polished walk: 12 Chromium tests passed; 10 WebKit tests passed, with 2 Chromium-only CDP touch tests skipped. Covers actual emulated swipe/pinch, camera bounds, overview restoration, all 21 discoveries across six stops, dialog focus, rotation/reload, and confirmed replay preserving an actual synthetic IndexedDB journal record.
- Final phone route → information → close-to-scene smoke passed.
- Final production build/typecheck, asset validation and production offline smoke passed. Offline smoke decodes all six frames and retains discovery progress through navigation/reload without a network.
- Installed stack checked with `npm ls --depth=0`; no dependency changes. Node 24.13.1 satisfies the registry-reported Vite (`^20.19.0 || >=22.12.0`) and Playwright (`>=20`) runtime constraints. Chromium screenshot engine: 151.0.7922.34; Playwright 1.62.1.

### Rendered review

Inspected the final production screenshots at 320×568, 390×844, 844×390, 1024×768 and 1440×900, plus the phone discovery dialog. The last polish groups camera tools, shows the phone route label, moves information into the route menu, shortens path labels, aligns the desktop footer, and removes repeated illustration caveats.

Local evidence is deliberately kept outside tracked public assets:

- `tmp/stage7-review/phone-final.png`
- `tmp/stage7-review/small-phone-final.png`
- `tmp/stage7-review/phone-landscape-final.png`
- `tmp/stage7-review/tablet-final.png`
- `tmp/stage7-review/desktop-final.png`
- `tmp/stage7-review/phone-discovery-final.png`
- `tmp/stage7-review/full-test.log`, `final-build.log`

This is a rendered browser review and automated playback verification, not physical-device testing, a listening review, or the user's subjective acceptance.
