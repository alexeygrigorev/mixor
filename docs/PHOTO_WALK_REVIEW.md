# Scene 7 playtest correction, 2026-09-29

This change responds to the reopened placement, navigation, dragging, excessive HUD and learning feedback. It does not inherit artistic acceptance from the earlier mobile work.

## Implemented

Ground-anchored directions replace footer travel cards. The route dialog remains available for offscreen destinations. Hints toggle off. The title, counters, mission copy and instructions remain accessible without covering the forest; edge controls keep 48px hit areas.

Mouse interaction prevents native selection and image dragging, captures and releases pointers consistently, and avoids focusing hidden objects on pointerdown. Fresh framing has room to pan on both axes on desktop. Touch tap/swipe and keyboard discovery remain available.

All 21 clues use explicit support descriptions, source-image coordinates and angles. Artwork dimensions are independent of 56px hit targets. Four new transparent assets remove their detached bark pedestals; the woodlouse has a low walking pose. First-pass closeups were rejected and revised: clusters moved onto stump lips, lichens flattened along branches, mushroom bases moved into litter seams, and optical softness and stem-base occlusion matched the video. Found state changes neither art size nor brightness, and the floating check badge is gone.

Discovery cards now explain four groups, give three facts and an observation task, and link to institutional references. A comparative myxomycete atlas link preserves the return route. The requested long disclaimer is removed; `ИГРОВОЙ РИСУНОК` distinguishes the illustration without interrupting the explanation.

## Image fidelity

All six original frame files remain byte-identical to `content/scene-07.manifest.json`. A mild renderer convolution increases local edge contrast using only original pixels; it is **not** super-resolution or recovered detail.

The imagegen trial was rejected. Its 1672×941 result was smaller than the 1920×1080 original and changed leaf/twig/bark texture. It is not installed or used on zoom. A faithful higher-resolution zoom source is still outstanding; generated sharpness is not labelled as authentic recovery.

## Review evidence

Use `node scripts/capture-photo-walk-placements.mjs` and the [authoring guide](PHOTO_WALK_AUTHORING.md). Each review record must identify the exact source/art hashes, coordinates, normal/max zoom, before/after discovery evidence, remaining defects and reviewer conclusion. The capture index starts as `pending_review` deliberately.

First passes: `tmp/stage7-correction/*-zoom.png`. Independent proposed corrections for the seven middle placements: `tmp/progress-art-review/`. These intermediate captures are not evidence of final approval.

## Verification status

Build, asset validation, camera/progress/domain and browser verification are run separately from visual review. Final run counts and capture review outcomes are recorded below before publication. Physical phones/tablets and real listening have not been tested during this correction; audio is unchanged.

## Bounded placement review

All 21 maximum-zoom placements were inspected individually and iterated. The independent reviewers accepted surface contact, scale and compositing after the final corrections; this is not user approval or a physical-device playtest. The woodlice remain camouflaged and difficult, with optional hints available. Distinguishing an illustrated group is not evidence of a real species in the source video.

| View | Reviewed objects | Final contact corrections |
| --- | --- | --- |
| Лесной склон | myxomycete, lichen, fungus, woodlouse | Cluster seated on stump rim; flattened lichen on branch; mushroom bases in litter seam; woodlouse in leaf crease. |
| Мшистый пень | myxomycete, lichen, fungus | Cluster moved from vertical face onto lip; lichen flattened on bark; smaller stems seated at shaded foot. |
| Под низкими ветвями | myxomycete, lichen, fungus, woodlouse | Near stump lip and foreground branch; mushrooms lowered into stump-foot shadow; woodlouse on leaf litter. |
| Поваленные ветки | myxomycete, lichen, fungus | Cluster moved clear of crossing twig; lichen within log face; mushrooms moved off green leaf onto litter. |
| Край тропы | myxomycete, lichen, fungus | Cluster lifted onto rim; compressed lichen follows branch; mushroom stems brought down to supporting seam. |
| Большой пень | myxomycete, lichen, fungus, woodlouse | Cluster on upper log lip; lichen on horizontal bark; mushrooms at ground contact; low woodlouse in root/leaf seam. |

Readability required a further iteration: `.065cqw` blur erased small structures. Final `.03cqw` blur and restored myxomycete/woodlouse scale retain visible bodies without reintroducing crisp floating cutouts. Woodlouse-only contrast was adjusted to remain visible in dark litter. No found badge or hover glow reveals an unfound target.

## Executed checks

- `npm test`: 25 unit checks and 112 Chromium browser cases passed; 30 cases are intentionally retired with generated search scenes 1–6. The added authoring validation was subsequently run in the 17-case `npm run test:photo-walk` suite, all passing.
- Final scoped WebKit run (`photo-walk-{drag,navigation,mobile,objects,learning}.spec.ts`): 36 passed, 4 Chromium-CDP-only cases skipped. Includes all 21 discoveries, six stops, replay, persistence, drag/hint behavior and educational content.
- New learning cases independently passed 8 Chromium + 8 WebKit instances; atlas/return coverage added another 2 per engine.
- `npm run build`, `npm run assets:validate`, and `npm run test:offline`: passed after the final runtime changes.
- Five viewport layouts inspected in Chromium (320px and 390px phone, short landscape, tablet and desktop). Discovery reading layout inspected on phone and desktop.

Physical-device behavior, unassisted child discoverability and listening remain unverified. No family data was reset or migrated; the 21 stable game object IDs remain unchanged.

Final evidence: `tmp/photo-walk-placements-final/review-index.json` records 21/21 objects and all 84 captures with stable source/art hashes. The index remains `pending_review` because the script never grants artistic approval; the manual bounded conclusions are recorded above. `found-state-comparison.json` confirms 20/21 zoom pairs are pixel-identical; the last pair differs in only two pixels by one RGB level, with no camera or artwork change. Captures clear pointer hover so tool highlighting does not masquerade as a found-state change.
