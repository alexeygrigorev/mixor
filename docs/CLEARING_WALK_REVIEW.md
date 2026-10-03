# Тихая поляна — second supplied video

## Implemented scope

On 2026-10-03 the user supplied `PXL_20261003_133858340.TS.mp4` for another route with many frames and explicitly allowed incidental people, including a child, and bags/items to remain for now. **No removal is claimed.** Earlier forest-only selection permission remains applicable to the first recording, not this one.

**Найти в лесу → Тихая поляна** contains 32 distinct full 1920×1080 images, 320×180 route thumbnails, 31 reversible internal connections and a labelled return to «Светлый лес». Source time order is maintained; turns are authored viewing choices, not measured footsteps or proof of geographic adjacency between recordings. Together with the untouched earlier scenes there are 66 views, 37 educational illustrated finds and 130 directed links.

Eight added illustrations reuse existing sprites: four slime moulds, two lichens, one small fungus and one woodlouse. They are not organism or species determinations from the video. No new scientific claims, audio assets, journal schema or storage migrations are introduced. All previous 29 discoveries and camera saves remain valid. Empty transit views do not offer impossible hints. The existing stationary 240 ms fade, reduced motion, pan/pinch/zoom and loading-error retry remain in use.

The 64 full/thumbnail files total **20,876,754 bytes**. Only decoded forest pixels were exported, with source display rotation normalized. No source video, sound, metadata, GPS/data tracks, font files, signed URLs or credentials are added. No public redistribution license is asserted. The source images are unretouched, so source motion softness remains in some transit views.

## Deferred cleanup

`content/scene-09.cleanup.json` records eight pending-review views, including uncertain distant silhouettes or unidentified light objects. Regions are approximate percentages, not pixel masks. They are invisible in gameplay and are not a claim that every incidental detail has been detected. Known person/item views remain playable as requested.

Later asset replacements should keep view/find IDs and route edges stable; update both image and thumbnail and their manifest hashes, then check placement, saves and offline caching again. Removing content from the game later does not delete prior public Git history. The present permission is for this game publication, not an assertion of any broader licence or consent by depicted people.

## Reproduce the exported frames

Exact decoded presentation timestamps, dimensions, byte counts and SHA-256 hashes are stored in `content/scene-09.manifest.json`. The input stays private and is not a repository dependency.

```sh
python3 scripts/extract-clearing-frames.py /private/path/PXL_20261003_133858340.TS.mp4
npm ci
npm run typecheck
npm run assets:validate
npm run test:photo-walk
npm run build
npx playwright test tests/browser/photo-walk-clearing*.spec.ts
```

The extraction command needs FFmpeg and Pillow. It writes ignored `tmp/clearing-reextract`, validates decoded timestamps, never rewrites the manifest, and records whether all full/thumbnail bytes match. Encoder-version differences can change compressed bytes and require review. The source display rotation is normalized rather than cropping the image.

## Verification record

At package preparation, local type checking, asset validation and all **33 domain/content/photo-walk unit tests** pass. Root and Pages production builds passed. The independent extraction CLI reproduced all 64 full-frame/thumbnail files byte-for-byte. Browser checks and final placement review are reported separately in PR #2 after completion, not inferred from this initial record.

All 32 exported full frames were visually inspected. Placement coordinates are provisional until real desktop/phone captures are inspected. Browser URL navigation in the local system Chromium is blocked by administrator policy; that restriction was not bypassed. Browser tests and screenshots are run in the repository's existing GitHub Actions environment.

The permanent read-only regression workflow captures each of the eight new placements at normal and 2.5× maximum zoom, before and after discovery, at desktop and phone sizes: 64 new PNGs. It also re-captures the previous eight October placements to revisit the prior incomplete screenshot review. Scoped reports do not claim a fresh visual review of all 21 original scene-07 objects.

New browser regressions cover all 32 frames forward/back, eight finds, load failure/retry, persisted saves, map thumbnails, stationary fade and actual separate arrow/find hit targets at a 320 px full-frame overview. Offline checks decode all 64 new full/thumbnail files and navigate/reload while disconnected.

Physical iOS/Android devices, listening, independent biological/art review and the user's subjective acceptance have not been performed. Nothing in this report claims a merge or production deployment.
