# Светлый лес — October video walk

## Scope and permission

On 2026-10-03 the user asked to add a scene from their uploaded video and clarified: «Надо много кадров с переходами». They explicitly approved public repository publication of selected forest-only stills, excluding people, source video, sound and metadata.

The new entry **Найти в лесу → Светлый лес** contains **28 distinct, full 1920×1080 video frames**, in source-time order, plus 320×180 map thumbnails. All 27 within-walk connections have a return connection. A separately labelled connection to the original walk is an authored game connection, not a claim that the two forests are geographically adjacent. The original six photographs and 21 existing object IDs are retained; totals are 34 views, 29 discoveries and 66 directed links.

Eight educational illustrations reuse the existing four organism sprites. They are **not identifications of organisms in the source video**. The source forest pixels have not been retouched or regenerated. Ambiguous frames showing a possible distant person were rejected rather than edited. No original video, sound, EXIF, GPS or data track is included. The user's publication permission does not assert a Creative Commons or other general redistribution license.

## Runtime and preservation

`src/photo-walk-october.ts` owns the route and placement coordinates. The original stationary 240 ms opacity fade, reduced-motion behavior, pan/pinch/zoom, error/retry behavior and scoped progress storage are reused. Transit frames without an illustration allow continued exploration and disable the hint rather than displaying an impossible task.

Only the current frame and its neighbours are retained in the decoded-image promise cache. The route dialog uses small lazy thumbnails. All 56 new frame/thumbnail files are explicitly added to the existing public offline cache; their combined payload is 19,024,564 bytes. Private observations remain excluded from that cache. No journal schema, photo blob storage, audio asset or global family data migration is changed.

Forward and return touch targets occupy opposite sides when needed. Views 09 and 13 have additional forward-target adjustments to avoid discoveries. The 320 px full-frame test checks every arrow and discovery using the actual hit-tested element and checks that direction-button rectangles do not overlap.

## Reproduction and checks

The source is private input, not a repository dependency. Exact presentation timestamps, dimensions, byte counts and SHA-256 hashes are in `content/scene-08.manifest.json`. To independently re-extract the approved frames, install FFmpeg and Pillow and run:

```sh
python3 scripts/extract-october-frames.py /private/path/PXL_20261003_113020278.TS.mp4
npm ci
npm run typecheck
npm run test:photo-walk
npm run assets:validate
npm run build
npx playwright test tests/browser/photo-walk-october*.spec.ts
```

Extraction writes to ignored `tmp/october-reextract`, never overwrites production, checks decoded timestamps and records byte differences from the published assets. On 2026-10-03 the extraction CLI was rerun against the private source and reproduced **all 56 published full-frame/thumbnail files byte-for-byte**. Encoder version changes may alter compressed bytes and require a new visual review.

Placement evidence is captured for every new object at normal/full-frame and 2.5× zoom, before and after discovery, on desktop and phone:

```sh
npm run dev -- --host 127.0.0.1 --port 4173
# Run these in another terminal (Node 24; Node 22 needs --experimental-strip-types):
VIEW_PREFIX=october- OUTPUT_DIR=tmp/october-review/desktop node scripts/capture-photo-walk-placements.mjs
VIEW_PREFIX=october- VIEWPORT_WIDTH=390 VIEWPORT_HEIGHT=844 OUTPUT_DIR=tmp/october-review/phone node scripts/capture-photo-walk-placements.mjs
```

Omitting `VIEW_PREFIX` still captures every object in both walks. Capture reports explicitly record scope, source hashes, viewport and pending independent review; they are not subjective acceptance certificates. The permanent `Photo walk regression` workflow is read-only, runs on PRs/main, and retains PNG/JSON evidence without browser trace archives or font files.

## Automated evidence and corrections

Local type checking, asset validation, all 29 domain/content/photo-walk unit checks, and root/Pages production builds pass. Local system Chromium prohibits URL navigation by policy, so actual browser evidence comes from GitHub Actions, not the local browser.

First browser run `37124529072`, code `17581ab4bb723c6d4d552d2ddd2756dee314d3da`: Chromium passed 44/48 checks and WebKit passed 10/14. The failures were two new test assumptions repeated on phone/tablet: the disabled hint is deliberately hidden, and the existing loading-error text differs from the test expectation. Both assertions were corrected without changing product behavior. Production offline traversal passed.

Corrected-placement run `37125163774`, code `315e5bc926f93866903264e8cd5f12e0184dbdd0`: 128 Chromium checks passed, 30 existing retired-scene checks were skipped, and two new navigation checks failed on subpixel rounding (intersection ratios 0.99999946/0.99999952 instead of exactly 1). All 14 WebKit navigation/new-route checks and production offline traversal passed. The test now tolerates 0.999 intersection while retaining an actual tap, correct destination and idle-state assertions. Product navigation was not changed to address floating-point rounding.

Run `37125864982` tests code `ccadc15b31a919dbb8e925736b526e0050600016`, including the separate 320 px hit-target test. The complete domain/content/Chromium step and the fresh 64-image capture step have succeeded. WebKit/offline status must be checked on the run before treating this run as fully successful; it was still executing when this paragraph was written. Later documentation-only commits do not change this tested runtime.

## Visual evidence and remaining review

All 28 selected source frames and the initial desktop/phone placement captures were inspected. Source and first screenshot inspection prompted four placement corrections: the small fungus at 09 moves to exposed needle litter; slime moulds at 16, 22 and 28 move onto visible dry branches, with angles and support descriptions adjusted. The 320 px and 1440 px walk chooser screenshots were inspected for text and target visibility.

All eight corrected placements were recaptured in four states at both desktop and phone sizes (64 PNGs) in run `37125163774`. All sixteen maximum-zoom before/after pairs are pixel-identical; full-screen normal states differ and are not claimed to be pixel-identical. A separately retained [visual-evidence branch](https://github.com/alexeygrigorev/mixor/tree/review/october-visual-evidence/docs/october-evidence) contains contact sheets and paired zoom images made from those actual captures, plus comparison results. It contains no source video, audio, metadata or font files. Later navigation-target adjustments do not change organism coordinates in these captures.

**Final post-correction visual inspection remains open.** The local file/image-viewing tools failed with `ClientError` after the corrected archive download; the web image viewer was also unavailable. Thus producing the corrected screenshots and comparing pixels is not recorded as having visually inspected those final screenshots. Inspect every corrected normal and maximum-zoom before/after state before visual acceptance or production publication.

A physical phone/tablet, field sound and independent biological/art review have not been performed. This addition does not close older subjective placement-feedback items for scene 07. The implementation is in PR #2; no merge or production deployment is claimed by this report.
