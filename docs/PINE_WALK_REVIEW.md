# Сосновый бор — second October recording

## Request, permission and implementation

On 2026-10-03 the user supplied `PXL_20261003_133858340.TS.mp4` and explicitly allowed objects such as backpacks and people, including a child, in scene frames for now. No person is identified and no geographic location is inferred. This updates the new-video selection constraint, not the scope of the earlier people-free scene-08 extraction.

The new **Найти в лесу → Сосновый бор** entry contains 36 distinct, full 1920×1080 decoded frames in source-time order, with 35 reversible within-walk connections. The first frame links back to «Светлый лес». That cross-recording connection is authored game navigation, not a claim of measured distance or physical adjacency.

Six educational illustrations reuse the existing sprites: three slime moulds, one lichen, one small fungus and one woodlouse. They are not identifications or records of actual organisms in the source video. The forest photographs are neither regenerated nor retouched. Original 34 views, 29 discovery IDs, progress storage and private family journal are retained; combined totals are **70 views, 35 finds, 138 directed links**. Empty transit frames have no impossible hint task. Stationary 240 ms fade, reduced-motion behavior, pan/zoom, retry and keyboard/touch navigation remain.

The 36 full frames plus 36 small route thumbnails total **22,050,064 bytes**. All 72 enter the existing public offline cache; private journal/photo data remains outside that cache. No original video, sound, GPS, EXIF, private data stream, temporary transport URL or font file is added. Publication permission is not represented as a general redistribution license.

## Parallel branch preservation

At final publication, PR #2 had advanced independently from the shared October baseline to `544688a1f0ce0a08d86870f61ebfca6180a10abd`, adding a different 32-frame «Тихая поляна» implementation of the same source. That concurrent branch was not overwritten. This 36-frame implementation is retained separately on `feature/pine-forest-walk` as an alternative for review. Both versions currently use scene-09 paths; do not merge both without an explicit content reconciliation. See this branch's PR for the final test status, rather than inferring it from PR #2.

## Later cleanup without breaking the walk

Manifest tags identify retained frames for possible later work: `pine-26`/`pine-27` need a distant-belongings review; `pine-30`, `pine-32`, `pine-35`, `pine-36` contain belongings; `pine-34` contains a person and belongings. Tags are manual review notes, not exhaustive object detection. All currently remain playable and unretouched.

`PINE_OMITTED_VIEWS` in `src/photo-walk-pine.ts` is empty by default. Adding an unwanted transit ID makes `buildPineWalk` reconnect previous/next stops without renumbering other views or discoveries. It rejects unknown IDs, removing the stable entry and silently deleting discovery-bearing frames. To remove one of those, replace its image or explicitly relocate the discovery and review the result. Direct links to an omitted pine frame fall back to the pine entry.

**Route omission does not erase media or history.** A real removal request also requires removing/replacing the photograph and thumbnail, updating manifests/offline caches and deciding separately what to do about public Git history. The original private video is never modified.

## Reproduction

`content/scene-09.manifest.json` records each source frame index, integer presentation timestamp, time base, dimensions, byte counts and SHA-256. With the private source supplied locally:

```sh
python3 scripts/extract-pine-frames.py /private/path/PXL_20261003_133858340.TS.mp4
npm ci
npm run typecheck
npm run assets:validate
npm run test:photo-walk
npm run build
npx playwright test tests/browser/photo-walk-pine*.spec.ts
```

The extraction script writes only to an ignored review directory and refuses production-asset output. A fresh full re-extraction on 2026-10-03 reproduced **all 72 published images byte-for-byte**, with every source timestamp checked. Encoder-version changes may change compressed bytes and require a new image review.

## Verification and review evidence

Local typecheck, SHA-256/dimension asset validation, root and Pages builds, and all **34 domain/content/photo-walk unit tests** passed (zero failures/skips), including after the arrow correction. Tests cover graph reachability, all reversible links, source provenance, every original ID, old progress preservation and reconnecting the seven optionally flagged transit frames. Existing counter assertions intentionally use the expanded totals. The local system browser prohibits URL navigation; actual browser evidence therefore comes from GitHub Actions.

The initial implementation is commit `55ecf2226e750bd26c2235b3902d0fefbd91f8c0`, checked in run `37128772920`. The first arrow correction is in `18818ff03439036e919453a39972b49439ed5d89`, checked in run `37129209321`. Permanent PR/main regression CI is read-only. See this branch's PR for completed browser-run results; do not infer success merely from a captured screenshot.

### Browser findings and fixes

Run `37128772920`: all 34 unit checks, typecheck, asset validation, production offline traversal and root/Pages builds passed. Full Chromium: 140 passed, 30 existing retired-scene checks skipped, two failures in the 320 px October overview. WebKit: 23 passed, three failed. Both overview failures per engine correctly exposed a newly added cross-recording arrow at October 28 overlapping the right camera-tools area. The authored cross-recording arrow was moved from 86%,87% to visible foreground litter at 44%,88%, away from both tools and the existing discovery. The original image, find and return direction are unchanged.

Run `37129209321`: the corrected pine-19 route passed all ten targeted Chromium checks. Nine of ten targeted WebKit checks passed; the phone's complete 36-frame traversal exhausted its three-minute overall test budget during the final reload verification. The full-run phone test had also reached the return leg before exhausting that budget. Only this long test's overall budget is now five minutes; all real taps, destination/idle checks, individual assertion timeouts, complete return traversal, six discoveries and reload checks are retained. No runtime logic was altered to mask a test timeout. Rechecks are reported in this branch's PR; neither failed run is described as green.

### Placement inspection actually performed

The implementing assistant visually inspected all **48 actual browser captures** from initial artifact `11276026750` (`pine-placements`): six placements × two viewports (1440×900 and 390×844) × normal/full-frame and 2.5× maximum-zoom, each before and after discovery. The full-frame mode is the optional overview, not the default phone layout.

| Placement | Inspected contact and result |
| --- | --- |
| `pine-01-myxomycete` | Orange illustration contacts the pale nearly horizontal twig underneath the thicker diagonal branch. The support note was corrected to name this actual twig; the art coordinates did not change. |
| `pine-09-lichen` | Small flat illustration remains on the dark foreground pine bark, aligned along the trunk. |
| `pine-16-creature` | Woodlouse remains in foreground needle litter among sparse grass. The support wording was made more literal; coordinates did not change. |
| `pine-19-fungus` | Small fungi remain in needle litter to the right of the pine base, not on the trunk. The next-direction marker, initially on a bush, was moved to visible ground at 43%, 80%. |
| `pine-28-myxomycete` | Illustration contacts the exposed upper surface of the small stump. |
| `pine-33-myxomycete` | Illustration stays on the upper birch-log surface near a dark bark crack and follows its angle. |

Eleven of twelve maximum-zoom before/after crops are pixel-identical. The phone woodlouse pair differs only in the lower-right hint region (difference bounds 351,415–373,441 in the 390×450 crop), because the hint disappears after the stop's only find. No movement or new pedestal was observed in the organism/support area. This pixel comparison supplements, and does not replace, visual inspection.

After the navigation correction, artifact `11276446589` (`pine-arrow-correction`, run `37129209321`) was downloaded and inspected: all eight normal/max-zoom before/after desktop/phone states for stop 19, plus **16 default full-height views** covering all six discovery stops and retained-person/belongings stops 34 and 36 at both viewports. The corrected arrow sits on foreground ground rather than the shrub. Default phone views fill the viewport; optional full-frame overview retains its expected letterboxing. No photograph, illustration geometry or old placement was changed by this correction.

The scoped authoring review is complete for these six new placements. It is **not independent art/biology acceptance or the user's subjective approval**. Source frames remain visibly softer during parts of camera movement; no artificial sharpening or background regeneration was applied. Physical phones/tablets and listening were not tested. Older scene-07 placement feedback and the previous October report's separately scoped open review items are not closed by this addition.

GitHub screenshot artifacts have seven-day retention. Recreate the exact matrices with:

```sh
npm run dev -- --host 127.0.0.1 --port 4173
# In another terminal, with Node 24 and Playwright Chromium installed:
VIEW_PREFIX=pine- OUTPUT_DIR=tmp/pine-review/desktop node scripts/capture-photo-walk-placements.mjs
VIEW_PREFIX=pine- VIEWPORT_WIDTH=390 VIEWPORT_HEIGHT=844 OUTPUT_DIR=tmp/pine-review/phone node scripts/capture-photo-walk-placements.mjs
```

The imported public package was checksum-pinned and restricted to an exact destination allowlist. Its temporary transport link and temporary Drive file were removed after import. The one-time import workflow is excluded from this feature branch. No merge or production deployment is claimed by this report.
