# Adding and reviewing forest scenes

Updated: 2026-10-03. Follow the latest [user feedback](USER_FEEDBACK.md) before changing a frame, route, control or organism. The runtime now contains three walks (66 full frames, 37 illustrated discoveries); older six-frame descriptions below refer to the original scene 07. Review every placement in its actual scene, including repeated uses of the same artwork. A good cutout can still look wrong on a different branch.

This guide sets the authoring and review requirements. It does not declare the current artwork accepted. Record actual results and unresolved defects in the change's review report.

## Files and source records

| File | What to update |
| --- | --- |
| `content/scene-07.manifest.json` | Source provenance, processing, selected frame timestamp, dimensions, bytes and SHA-256 for each photographic background. |
| `content/assets.manifest.json` | Each runtime illustration's path, generated status, provenance, dimensions, bytes and checksum. Keep rights statements specific to the asset. |
| `content/generated-art.manifest.json` | Generation history where applicable; preserve prompts and original references instead of inventing a photographic source. |
| `src/photo-walk-data.ts` | Stable view/object IDs, image references, reversible links, object rectangles, required `support` and `rotation`. |
| `src/photo-walk-core.ts` | DOM renderer and, currently, the ground-marker position overrides inside `updateTravel()`. |
| `src/photo-walk.css` | Photograph/object composition and separate visual-art dimensions. |
| `src/photo-walk-navigation.css` | Ground markers and the unobtrusive edge controls requested by the user. |
| `src/photo-walk-progress.ts` | Validation and preservation of local game progress; do not use this store for family observations. |
| `scripts/capture-photo-walk-placements.mjs` | Repeatable rendered placement evidence. See the capture requirements below. |

Keep the original video outside public Git. Record the actual selected frame time, not just the requested seek time. The existing backgrounds are 1920 × 1080 decoded frames without retouching, source audio, EXIF or GPS. Their manifest does not assert a public redistribution license. Preserve that distinction when recording new sources.

Register runtime files and verify their decoded dimensions and checksum. Do not change a manifest checksum merely to silence a test: first establish which image was intentionally changed and preserve the previous source record. `scripts/build-offline.mjs` consumes the manifests; a file that loads in Vite also needs to enter the built offline package.

## Add a stop and its directions

1. Select a genuinely different source frame. Compare the previous and next views for recognizable trunks, stumps and branches. Enlarging a crop is zooming, not taking a step.
2. Add a unique, stable view ID to `photoWalkViews`, its real `sourceTimeSeconds`, title and registered image path. The current validator requires 1920 × 1080 backgrounds. Supporting another aspect ratio or resolution requires an explicit renderer/validator change and fresh geometry checks.
3. Add links to neighboring stops and a return link for each. The whole graph must be reachable from `PHOTO_WALK_ENTRY`. It represents an authored game route, not a measured geographic map.
4. Choose each marker on visible ground where a person could move. Avoid placing arrows on trunks, organisms, floating branches or unexplained empty space. Rotate the marker toward the chosen direction while retaining a usable touch target.
5. Update both the link coordinates in `photo-walk-data.ts` and any matching override in `photo-walk-core.ts` → `updateTravel()`. Existing overrides currently take precedence. Inspect the rendered result; editing only the data may leave an existing marker unchanged. If overrides are moved into link data later, remove the duplicate source and update this guide.
6. Check ground-marker positions at normal and maximum zoom. The markers must move with the photograph. On a phone, pan to each marker and use the persistent route button as an alternative for markers outside the visible crop.

Preserve existing view and object IDs when moving or restyling them. Those IDs refer to saved visits, discoveries and camera positions. Adding content must not clear the journal, original photo Blobs, development history or earlier game discoveries. Update explicit content-count assertions when intentionally extending the walk; do not hide a missing stop by reducing a test's expected count.

## Place each illustrated organism

Choose a visible support before choosing coordinates. Write `support` as a concrete description of the photographed surface: for example, the exposed lip of a broken stump or the shaded leaf crease beneath a branch. A declaration such as “on wood” is insufficient when the rendered organism actually overlaps a fern.

Object `x`, `y`, `width` and `height` are percentages of the original photograph. `x` and `y` identify the unrotated art rectangle's upper-left corner; the renderer derives its center for the hit target. For a 1920 × 1080 background:

```text
x = left_px / 1920 × 100
y = top_px / 1080 × 100
width = art_width_px / 1920 × 100
height = art_height_px / 1080 × 100
```

Specify `rotation` for every placement, including an intentional zero. Follow the surface's perspective, not merely the nearest branch's approximate direction. Do not describe this angle as a biological property or measured camera orientation.

Keep the visible art independent of its touch target. The button has a minimum 56 CSS-pixel hit area; the image uses `cqw` and `cqh` relative to the photograph container. Increasing the button for touch must not enlarge the organism or shift its contact point. Verify that rotation, zoom and viewport changes preserve the same support contact.

Prepare transparent artwork without a decorative pedestal. A pasted bark slab, cut-out leaf platform or unexplained shadow island can make an organism float even when the button is correctly positioned. Preserve the pictured support beneath it. If the asset itself contains a pedestal, regenerate or revise that asset; shrinking the entire tile does not establish contact. Compare the alpha edges against both light and dark areas of the target scene.

Generated artwork remains an educational illustration. Do not infer a species, stage, actual presence in the source video or real-world scale from its appearance. Keep the disclosure and any scientific explanation accurate when replacing an asset.

## Inspect all 21 placements and iterate

The current inventory is explicit so that a representative sample cannot replace a complete review:

| Stop | Placement IDs to inspect |
| --- | --- |
| `video-forest` | `slope-myxomycete`, `slope-lichen`, `slope-fungus`, `slope-woodlouse` |
| `video-moss-stump` | `moss-myxomycete`, `moss-lichen`, `moss-fungus` |
| `video-clearing` | `clearing-myxomycete`, `clearing-lichen`, `clearing-fungus`, `clearing-woodlouse` |
| `video-deadwood` | `deadwood-myxomycete`, `deadwood-lichen`, `deadwood-fungus` |
| `video-trail` | `trail-myxomycete`, `trail-lichen`, `trail-fungus` |
| `video-old-stump` | `stump-myxomycete`, `stump-lichen`, `stump-fungus`, `stump-woodlouse` |

For **each of the 21**, capture and open four states: normal camera before finding, maximum supported camera zoom before finding, normal camera after finding, and maximum zoom after finding. The current maximum camera zoom is 2.5; it is digital image enlargement, not microscope magnification. Preserve the surrounding photograph in every detail capture so contact and scale can be judged. Include the full scene as context and inspect the discovery dialog separately.

Use an isolated browser profile with synthetic game progress. Do not clear the developer's or family's normal browser storage to prepare screenshots. An enlarged screenshot of the isolated PNG is not evidence of its placement in the game.

Review each placement against these checks:

- **Contact:** the organism meets the stated support, with no gap, floating rim, unexplained platform or contact shadow detached from its feet/base.
- **Scale and perspective:** size fits the immediate branch, leaf or stump and the camera's viewing angle. The same artwork may require a different size and rotation at each stop.
- **Light and color:** highlights and shadows fit the surrounding scene. Avoid an overly saturated, glossy or luminous cutout against muted video texture.
- **Sharpness:** edges and internal detail fit the photographed surface at both normal and maximum zoom. Do not sharpen the organism into a sticker or blur it into an unreadable smudge.
- **Alpha and texture:** no black/white halo, rectangular patch, disconnected bark fragment, plinth or generation artifact survives around the silhouette.
- **Found state:** selecting/finding does not make the art jump, grow with its hit area, acquire a large check badge or cover the support. Hint feedback can be hidden again.
- **Interaction:** taps open the intended discovery; dragging across it pans without finding it. Touch targets remain usable without dictating the artwork's size.

Write down the defect using its object ID and screenshot filename. Revise the coordinates, angle, scale, compositing or asset; recapture all four states for that placement. When a shared asset or CSS rule changes, recapture every placement affected by it. Ask an independent reviewer to inspect the revised screenshots, including the maximum-zoom crop, and repeat until that reviewer finds no remaining material placement defect. Keep earlier rejected evidence and the reason for revision.

Maintain one review row per object with: source/render revision, four screenshot paths, `support`, defects, revision made, reviewer and final status. “Captured,” “automated checks passed,” “visually reviewed” and “accepted by the user” are separate statuses. Mark missing evidence or unresolved defects explicitly. Green browser tests never constitute artistic acceptance.

## Capture matrix and commands

Start the local game before capturing:

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

In another terminal, capture the placement matrix:

```bash
node scripts/capture-photo-walk-placements.mjs
```

The capture command uses Chromium at 1440 × 900 with a fresh browser context per object. Set `TEST_BASE_URL` to target another running build, or `OUTPUT_DIR` to preserve a separate review run. It renders every object ID from `photoWalkViews`, writes `review-index.json` linking IDs to evidence, and fails if a placement is missing or an input changes during capture. Phone and other viewport checks in the matrix below remain additional captures. For 21 objects, the four required states total **84 placement captures per viewport**, plus scene overviews and discovery dialogs. Record the actual output directory, viewport, browser engine, image hashes and code revision in the review report. The earlier `tmp/stage7-correction/placements.mjs` only captured maximum-zoom crops; that scratch script alone does not meet this matrix.

| Viewport | Required inspection |
| --- | --- |
| Desktop 1440 × 900 | All placements in four states; all ground directions and source landmarks. |
| Phone 390 × 844 | All placements in four states; pan to edges, pinch, hint hide/show, discovery return. |
| Small phone 320 × 568 | All six scenes, low/edge placements, dialogs and 48-pixel HUD controls. |
| Tablet 1024 × 768 | All six scenes, readable dialogs, anchored art and ground directions. |
| Short landscape 844 × 390 | All six scenes; no control collisions, clipped actions or hidden discoveries. |

Run the relevant validation and browser checks:

```bash
npm run typecheck
npm run assets:validate
npm run test:photo-walk
npx playwright test tests/browser/photo-walk-objects.spec.ts tests/browser/photo-walk-mobile.spec.ts tests/browser/photo-walk-navigation.spec.ts tests/browser/photo-walk-drag.spec.ts tests/browser/photo-walk-learning.spec.ts
npx playwright test --config playwright.webkit.config.ts tests/browser/photo-walk-objects.spec.ts tests/browser/photo-walk-mobile.spec.ts tests/browser/photo-walk-navigation.spec.ts tests/browser/photo-walk-drag.spec.ts tests/browser/photo-walk-learning.spec.ts
npm run build
```

Check the built game and offline assets after a content change. Start `npm run preview -- --host 0.0.0.0 --port 4174`, then run `npm run test:offline` separately. Record executed commands and their results. Chromium touch emulation and WebKit layout tests do not establish behavior on a physical phone; a rendered review does not establish audio quality.

## Local scene edits and strict super-resolution

An expressly requested local composition edit may change the specified area of a scene. Preserve the original, save the edited derivative separately, record what changed, and update its processing/disclosure fields. Permission for a local edit does not justify changing other regions or describing the result as an untouched video frame.

A strict super-resolution request has a narrower contract: increase resolution while preserving the existing content, positions, geometry and texture identity. Do not add, remove, move or reinterpret leaves, bark, organisms or lighting. Compare aligned full frames and local crops against the source before installing a candidate. Increased nominal dimensions alone do not prove recovered detail, and an image generator's successful response does not prove fidelity.

During this correction, an image-generation candidate was rejected: it was **1672 × 941** against the **1920 × 1080** source and altered textures. It was neither higher-resolution output nor a faithful strict enhancement. Keep it out of the runtime frame replacement and retain the rejection in the review record. Generate and review transparent organism artwork as a separate operation; it does not validate or authorize a background enhancement.


## October 2026 expansion

The current runtime includes scene 07 (6 views / 21 objects), scene 08, **Светлый лес** (28 views / 8 objects), and scene 09, **Тихая поляна** (32 views / 8 objects): 66 views, 37 objects, 130 directed links. The earlier 6-view/21-placement review descriptions above are historical scene-07 scope, not the full new runtime.

Author new video views in `src/photo-walk-october.ts`; their source pixels and map thumbnails are described in `content/scene-08.manifest.json`. Every new view uses a distinct full frame and all next/back connections are reversible. A `thumbnail` is a map-only derivative; never substitute it for the 1920×1080 play surface. Frame-by-frame review details and reproducible commands are in [OCTOBER_WALK_REVIEW.md](OCTOBER_WALK_REVIEW.md).

`scripts/capture-photo-walk-placements.mjs` now accepts `VIEW_PREFIX`, `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT`, `TEST_BROWSER_PATH` and `OUTPUT_DIR`. A scoped capture records its prefix in the report. No prefix means all 37 placements / 148 before-and-after state captures; `VIEW_PREFIX=october-` means all 8 new placements / 32 captures per viewport. Do not describe the latter as a full review of scene 07.


## Second recording and deferred cleanup

Author the 32 second-video views in `src/photo-walk-clearing.ts`; provenance and reproducible file hashes are in `content/scene-09.manifest.json`. `VIEW_PREFIX=clearing-` captures all eight new placements in four before/after, normal/maximum-zoom states per viewport. Run for desktop and phone; inspect the actual PNGs, not only the success flag.

The user explicitly permits incidental people and items in this recording for now. `content/scene-09.cleanup.json` is a developer-only pending-review index with approximate full-frame percentage regions. Distant ambiguous details are marked uncertain. Do not create gameplay finds on people or bags. No removal or retouching has been performed. On later replacement, keep scene/find IDs, update the full image **and** map thumbnail plus their manifest hashes, inspect the old/new pairs and nearby arrow/find placement, and rerun navigation, save-preservation and offline tests. Removing media from a later game build does not erase prior public Git history.
