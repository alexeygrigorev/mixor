# Светлый лес — October video walk

## Scope and permission

On 2026-10-03 the user asked to add a scene from their uploaded video and clarified: «Надо много кадров с переходами». They explicitly approved public repository publication of selected forest-only stills, excluding people, source video, sound and metadata.

The new entry **Найти в лесу → Светлый лес** contains **28 distinct, full 1920×1080 video frames**, in source-time order, plus 320×180 map thumbnails. All 27 within-walk connections have a return connection. A separately labelled connection to the original walk is an authored game connection, not a claim that the two forests are geographically adjacent. The original six photographs and 21 existing object IDs are retained; totals are 34 views, 29 discoveries and 66 directed links.

Eight educational illustrations reuse the existing four organism sprites. They are **not identifications of organisms in the source video**. The source forest pixels have not been retouched or regenerated. Ambiguous frames showing a possible distant person were rejected rather than edited. No original video, sound, EXIF, GPS or data track is included. The user's publication permission does not assert a Creative Commons or other general redistribution license.

## Runtime and preservation

`src/photo-walk-october.ts` owns the route and placement coordinates. The original stationary 240 ms opacity fade, reduced-motion behavior, pan/pinch/zoom, error/retry behavior and scoped progress storage are reused. Transit frames without an illustration allow continued exploration and disable the hint rather than displaying an impossible task.

Only the current frame and its neighbours are retained in the decoded-image promise cache. The route dialog uses small lazy thumbnails. All 56 new frame/thumbnail files are explicitly added to the existing public offline cache; their combined payload is 19,024,564 bytes. Private observations remain excluded from that cache. No journal schema, photo blob storage, audio asset or global family data migration is changed.

## Reproduction and checks

The source is private input, not a repository dependency. Exact presentation timestamps, dimensions, byte counts and SHA-256 hashes are in `content/scene-08.manifest.json`. To independently re-extract the approved frames, install FFmpeg and Pillow and run:

```sh
python3 scripts/extract-october-frames.py /private/path/PXL_20261003_113020278.TS.mp4
npm ci
npm run typecheck
npm run test:photo-walk
npm run assets:validate
npm run build
npx playwright test tests/browser/photo-walk-october.spec.ts
```

Extraction writes to ignored `tmp/october-reextract`, never overwrites production, checks decoded timestamps and records byte differences from the published assets. Encoder version changes may alter compressed bytes and require a new visual review.

Placement evidence is captured for every new object at normal/full-frame and 2.5× zoom, before and after discovery, on desktop and phone:

```sh
npm run dev -- --host 127.0.0.1 --port 4173
# Run these in another terminal (Node 24; Node 22 needs --experimental-strip-types):
VIEW_PREFIX=october- OUTPUT_DIR=tmp/october-review/desktop node scripts/capture-photo-walk-placements.mjs
VIEW_PREFIX=october- VIEWPORT_WIDTH=390 VIEWPORT_HEIGHT=844 OUTPUT_DIR=tmp/october-review/phone node scripts/capture-photo-walk-placements.mjs
```

Omitting `VIEW_PREFIX` still captures every object in both walks. Capture reports explicitly record scope, source hashes, viewport and pending independent review; they are not subjective acceptance certificates.

## Review status

Local type checking, asset validation, all 29 domain/content/photo-walk unit checks, and root/Pages production builds pass. Local system Chromium prohibits all URL navigation by policy, so browser attempts there are environment-blocked, not successful. Actual browser evidence comes from GitHub Actions.

First browser run: `37124529072`, code `17581ab4bb723c6d4d552d2ddd2756dee314d3da`, on 2026-10-03. Chromium passed 44/48 checks and WebKit passed 10/14; the failures were two new test assumptions repeated on phone/tablet: the disabled hint is deliberately hidden, and the existing loading-error message differs from the test text. Both assertions were corrected without changing product behavior. Production offline traversal passed. All eight new placements were captured in four states at both desktop and phone sizes (64 PNGs). Paired zoom images were pixel-identical before/after discovery; this is geometric evidence, not subjective placement approval.

Source and first screenshot inspection prompted four placement corrections: the small fungus at 09 moves to exposed needle litter; slime moulds at 16, 22 and 28 move onto visible dry branches, with angles and support descriptions adjusted. The 320 px and 1440 px walk chooser screenshots were inspected for text and target visibility. The corrected placement matrix and full 28-frame forward/back traversal require a fresh run before acceptance.

A physical phone/tablet, field sound and independent biological/art review have not been performed. This addition does not close older subjective placement-feedback items for scene 07.
