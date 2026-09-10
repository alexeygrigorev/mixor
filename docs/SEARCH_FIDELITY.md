# Matching magnification and grounded finds — U73–U75

2026-09-10. Current implementation is under final bounded visual review. This supersedes the matching/placement claims of the earlier [search checkpoint](SEARCH_REVIEW.md), while retaining its discovery and replay flow.

## What changed

The clue and lens now use the same [SearchSpecimen](../src/search-specimen.tsx) composition: the same generated specimen, inset atlas crop, mask, orientation and local woodland pixels. Only display size changes. The lens no longer substitutes the full unrotated portrait for a clipped, rotated fragment.

Each location is registered by its contact with the surface, not just its visual center. The colony's base is placed at the same source-image point through resizing. Ten anchors were moved; all fifteen were rechecked. Stable find IDs, species, weather, photos, saved data and all five background images remain unchanged. No new artwork was generated for this correction.

The reported Fuligo now meets the broken log face. The birch-scene Tubifera has moved off the living fern, and the other Tubifera location has also moved onto the foreground log. Stemonitis uses a closer outline around its colony and stalk bases so the old angular piece of atlas ground does not travel with it.

## Support map

Coordinates are percentages of the existing 1536×1024 illustrations, not geographic locations or measured biological scale. The exact tile outlines and contact landmarks are in `specimenFrames`; [search-data.ts](../src/search-data.ts) supplies the anchors. Both display sizes register that contact at `(50, 68)` in the composite's 100-unit square.

| Find | Source anchor | Visible support |
| --- | --- | --- |
| forest-network | 40, 43 | Exposed crack on the fallen log |
| forest-arcyria | 50, 52 | Bark beside the log's moss edge |
| forest-lycogala | 60, 62 | Lower fissure in the same log |
| stump-fuligo | 43, 66 | Exposed fibres of the broken root |
| stump-stemonitis | 39, 50 | Split stump edge |
| stump-trichia | 56, 63 | Fallen branch to the right of the stump |
| leaves-didymium | 49, 75 | Brown fallen leaf between twigs |
| leaves-trichia | 43, 46 | Decaying twig left of the large log |
| leaves-fuligo | 61.5, 55.5 | Exposed wood on the broken log end |
| roots-tubifera | 49, 75 | Fissure in the foreground fallen log |
| roots-physarum | 60, 78 | Longitudinal fissure in that log |
| roots-didymium | 41, 52 | Fallen leaf at the moss edge |
| bark-stemonitis | 52.5, 55 | Dark split in the fallen birch |
| bark-arcyria | 61.5, 64 | Edge of peeling bark |
| bark-tubifera | 42.5, 50.5 | Dark broken end of the fallen birch |

The wood placements are consistent with the specimen-based habitat descriptions for [Stemonitis axifera](https://biotanz.landcareresearch.co.nz/scientific-names/1cb1a5c3-36b9-11d5-9548-00d0592d548c) and [Tubifera ferruginosa](https://biotanz.landcareresearch.co.nz/scientific-names/1cb1a87a-36b9-11d5-9548-00d0592d548c) in Stephenson's *Myxomycetes of New Zealand* (2003). Tubifera is also reported from fallen leaf litter; the correction is not a claim that every slime mould can occur only on wood. The particular scene anchors are illustration choices, not specimen records or expert habitat certification.

## Verification

The [fidelity test](../tests/browser/search-fidelity.spec.ts) independently rasterizes the clue and lens compositions at a common size for every find, compares their pixels, and exercises select/dismiss/reselect/learn/return. Matching pixels establish correspondence, not believable placement; the visual review checks the latter separately.

[Embedded-search checks](../tests/browser/embedded-search.spec.ts) pin all ten source/runtime background hashes and cover five scenes at phone, tablet and short-landscape sizes, a wide forest, keyboard/Escape, rotation, 200% text, small phones and the replay boundary without deleting an original photo. The three reported finds are selected in every size of the rendered matrix. The original 56px touch areas remain independent of the smaller visible colonies.

Main passed typecheck, eight domain/content tests, production build and asset validation. The updated offline check explicitly decodes both raster images referenced by the SVG magnifier: SVG `<image>` elements are not part of `document.images`. The production cache is `mixor-public-4f7c79444c701b11`, with 74 public files. Final cross-browser and full visual results are pending below; no physical-device or broad artistic acceptance is implied.

Independent early R1 rejected an angular brown carrier beneath Stemonitis. Local R2 cleared that finding. The full static R3 pass then rejected partial erasure of Didymium's six bodies and residual ground fragments around Hemitrichia; these affect four finds and are being corrected by the same implementer. Stemonitis's accepted treatment remains unchanged. Working evidence: `tmp/search-fidelity/` and `tmp/embedded-review/U73_U75_STATIC_R3.md`.

The first main WebKit production search run passed all fifteen pixel comparisons, the 32-frame matrix, keyboard/rotation/200% text and small-phone actions. Its four failures are retained, not labelled a passing batch: two storage-fixture cases import `/src/storage.ts`, so they must run against the development server, and two five-scene cases exposed a 0.53125px shortfall against the existing ten-pixel bottom margin. A separate short-landscape probe found a 0.70457px shortfall against the four-pixel gap between two circular hit areas. Tiny anchor adjustments within the same wood surfaces are in progress; no safety-margin assertion is being relaxed. Full F1–F6 acceptance and settled affected tests remain pending.
