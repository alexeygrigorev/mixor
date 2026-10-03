# Сосновый бор — second October recording

## Request, permission and implementation

On 2026-10-03 the user supplied `PXL_20261003_133858340.TS.mp4` and explicitly allowed objects such as backpacks and people, including a child, in scene frames for now. No person is identified and no geographic location is inferred. This updates the new-video selection constraint, not the scope of the earlier people-free scene-08 extraction.

The new **Найти в лесу → Сосновый бор** entry contains 36 distinct, full 1920×1080 decoded frames in source-time order, with 35 reversible within-walk connections. The first frame links back to «Светлый лес». That cross-recording connection is authored game navigation, not a claim of measured distance or physical adjacency.

Six educational illustrations reuse the existing sprites: three slime moulds, one lichen, one small fungus and one woodlouse. They are not identifications or records of actual organisms in the source video. The forest photographs are neither regenerated nor retouched. Original 34 views, 29 discovery IDs, progress storage and private family journal are retained; combined totals are **70 views, 35 finds, 138 directed links**. Empty transit frames have no impossible hint task. Stationary 240 ms fade, reduced-motion behavior, pan/zoom, retry and keyboard/touch navigation remain.

The 36 full frames plus 36 small route thumbnails total **22,050,064 bytes**. All 72 enter the existing public offline cache; private journal/photo data remains outside that cache. No original video, sound, GPS, EXIF, private data stream, temporary transport URL or font file is added. Publication permission is not represented as a general redistribution license.

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

## Verification at import

Local typecheck, SHA-256/dimension asset validation, root production build and all **34 domain/content/photo-walk unit tests** passed (zero failures/skips). Tests cover reachability, all new reversible links, source provenance, all original IDs, old progress preservation and reconnecting the seven optionally flagged transit frames. Existing counter assertions intentionally use the expanded totals.

Browser tests are authored for the three-choice menu, all 36 views forward/back, all six discoveries and reload, loading failure/retry, map thumbnails, 320 px actual hit targets and production offline traversal. They are not yet recorded as passed in this import-stage report. The local system browser prohibits URL navigation, so actual browser runs and screenshots use the isolated GitHub Actions workbench.

Selected source frames were visually inspected. Actual six-placement normal/maximum-zoom before/after desktop/phone review is pending capture. Merely generating screenshots or passing element-position assertions is not subjective visual acceptance. Physical phones/tablets, listening and independent art/biology acceptance are not claimed. This addition does not close older placement-feedback items in scene 07 or the previous report's open review items.

This is a review-branch implementation, not a claim of merge or production deployment.
