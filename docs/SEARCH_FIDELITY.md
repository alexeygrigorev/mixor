# Matching magnification and grounded finds — U73–U76

2026-09-10. Independent R9 verdict: **SCOPED SEARCH FIDELITY / PLACEMENT: ACCEPT. F1–F6 satisfied; no remaining material finding in this contract.** The accepted revision retains continuous supporting material with every organism and corrects the two remaining network edges. This supersedes the matching/placement claims of the earlier [search checkpoint](SEARCH_REVIEW.md), while retaining its discovery and replay flow. It is not overall user, physical-device, listening or broad artistic acceptance.

## What changed

The clue and lens now use the same [SearchSpecimen](../src/search-specimen.tsx) composition: the same generated specimen together with its native wood or leaf, contact texture and shadows. Both use the same inset atlas crop, edge treatment and orientation; only display size changes. The lens no longer substitutes a different portrait for a clipped, rotated fragment. Body extraction and colour-key filters have been removed.

Each location is registered by its contact with the surface, not just its visual center. The colony's base is placed at the same source-image point through resizing. Ten anchors were moved; all fifteen were rechecked. Stable find IDs, species, weather, photos, saved data and all five background images remain unchanged. No new artwork was generated for this correction.

The reported Fuligo now meets the broken log face. The birch-scene Tubifera has moved off the living fern, and the other Tubifera location has also moved onto the foreground log. All eight taxa retain their actual pictured supporting surface; Didymium retains its dead leaf, while the other seven retain wood. This is a local composition on an appropriate existing scene feature, not a new full-background image.

Didymium's leaf and the yellow network use softened, irregular peripheral joins. Protected bodies/outer branches and the continuous native surface remain together; the same treatment is used in the small clue and lens. This removes the rejected resting badge/disc boundaries without returning to floating cutouts.

## Support map

Coordinates are percentages of the existing 1536×1024 illustrations, not geographic locations or measured biological scale. Native contact landmarks are in `specimenFrames`; [search-data.ts](../src/search-data.ts) supplies the anchors. `specimenContact` projects the landmark through the shared macro framing; both display sizes register the same contact against the same scene anchor. Resting organism scale is preserved when restoring the substrate.

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
| roots-physarum | 60, 77.8 | Longitudinal fissure in that log |
| roots-didymium | 41, 52 | Fallen leaf at the moss edge |
| bark-stemonitis | 52.5, 55 | Dark split in the fallen birch |
| bark-arcyria | 61.5, 64 | Edge of peeling bark |
| bark-tubifera | 42.3, 50.5 | Dark broken end of the fallen birch |

The wood placements are consistent with the specimen-based habitat descriptions for [Stemonitis axifera](https://biotanz.landcareresearch.co.nz/scientific-names/1cb1a5c3-36b9-11d5-9548-00d0592d548c) and [Tubifera ferruginosa](https://biotanz.landcareresearch.co.nz/scientific-names/1cb1a87a-36b9-11d5-9548-00d0592d548c) in Stephenson's *Myxomycetes of New Zealand* (2003). Tubifera is also reported from fallen leaf litter; the correction is not a claim that every slime mould can occur only on wood. The particular scene anchors are illustration choices, not specimen records or expert habitat certification.

## Verification

The [fidelity test](../tests/browser/search-fidelity.spec.ts) independently rasterizes the clue and lens compositions at a common size for every find, compares their pixels, and exercises select/dismiss/reselect/learn/return. It removes the scene-context layer and checks native support samples below/between the bases against the unmasked source, so an unrelated background cannot conceal missing support. Didymium's six bodies and Hemitrichia's nine heads are sampled too. Matching pixels establish correspondence, not believable placement; the visual review checks the latter separately.

[Embedded-search checks](../tests/browser/embedded-search.spec.ts) pin all ten source/runtime background hashes and cover five scenes at phone, tablet and short-landscape sizes, a wide forest, keyboard/Escape, rotation, 200% text, small phones and the replay boundary without deleting an original photo. The three reported finds are selected in every size of the rendered matrix. The original 56px touch areas remain independent of the smaller visible colonies.

The U76 batch passed **10 Chromium cases** (implementer-run, 1.2 minutes) and **14 WebKit cases** (main-run, 2.2 minutes), with four intentional redundant-project skips per engine. WebKit additionally covered four navigation/context cases. Each engine checked all fifteen image pairs, retained support/head texture, the responsive matrix, keyboard/rotation/200% text, small-phone actions and original-photo/replay boundaries.

After the final network-edge adjustment, the two affected checks—fifteen-pair fidelity and the full native matrix—passed again in **Chromium (2 PASS, 39.6s)** and **WebKit (2 PASS / 2 duplicate skips, 58.4s)**. These are reruns of existing coverage, not additional unique cases. All thirteen unaffected compositions remain byte-identical in both engines. The final maximum support/head RGBA difference is **3/255**, within the unchanged 4/255 tolerance. Native wood alpha varies; the check preserves the actual source rather than requiring invented opacity. Eight domain/content tests, typecheck, production build, asset validation and offline smoke pass. Current production cache: `mixor-public-411042930399a909`, 74 public assets.

Main inspected all eight taxa's native lenses, all five contact sheets, representative phone/tablet frames and both final corrected network pairs. R7 cleared the Didymium edge; full-family R8 confirmed all fifteen supporting surfaces and accepted the other thirteen finds. R9 inspected the corrected network pairs, six affected resting frames and genuine zero-found wide replay, then closed the full F1–F6 contract. Full reports and byte-preserved evidence remain in `tmp/embedded-review/U76_FINAL_REVIEW_R8.md`, `U76_FINAL_REVIEW_R9.md` and `u76-r9/`.

Accepted renderer SHA-256: `056438d94b8f807d0c22630919e24cb734e264074c5285b1fcca585974a0d6a4`. The existing matrix fixture was also corrected to reset the forest itself before its wide resting capture, with an explicit zero-found assertion. That test-only change codifies the replay already used for the accepted wide evidence; it does not change the game or reopen visual acceptance. Main reran that matrix successfully in Chromium (1 PASS, 25.5s) and WebKit (1 PASS, 42.6s), then passed typecheck, eight domain/content tests and `git diff --check` after acceptance.

## Retained current evidence

Each sheet shows all three finds in that place: attachment context, native lens, then independently rasterized clue/lens at the same size.

- [Forest pairs](screenshots/search-fidelity/forest-pairs.png), [stump pairs](screenshots/search-fidelity/stump-pairs.png), [leaf-litter pairs](screenshots/search-fidelity/leaves-pairs.png), [roots pairs](screenshots/search-fidelity/roots-pairs.png), [birch pairs](screenshots/search-fidelity/bark-pairs.png).
- Phone: [stump](screenshots/search-fidelity/phone-stump-selected.png), [log-end Fuligo](screenshots/search-fidelity/phone-leaves-selected.png), [birch Tubifera](screenshots/search-fidelity/phone-bark-selected.png).
- [Tablet roots](screenshots/search-fidelity/tablet-roots-selected.png), [short-landscape birch](screenshots/search-fidelity/landscape-bark-selected.png).

The five pair sheets are Chromium evidence; the five native viewport captures are WebKit evidence. Full per-engine native files, fifteen-row projected mapping and source/evidence hashes remain in `tmp/search-fidelity/` and `tmp/embedded-search/`. No audio, life-cycle, portrait, taxonomy, source artwork or full-background files changed in this correction.

## Rejected intermediate attempts

Before U76, main passed typecheck, eight domain/content tests, production build and asset validation. The updated offline check explicitly decodes both raster images referenced by the SVG magnifier: SVG `<image>` elements are not part of `document.images`. That production cache was `mixor-public-9f09a7b7ba3b90aa`, with 74 public files. The settled affected search/navigation batch passed **14 Chromium and 14 WebKit cases**, with four deliberate redundant-project skips per engine. These are historical functional results for the rejected extraction approach, not visual approval or final evidence for the next revision.

Independent early R1 rejected an angular brown carrier beneath Stemonitis. Local R2 cleared that finding. Static R3 rejected partial erasure of Didymium's six bodies and residual ground fragments around Hemitrichia. Local R4 cleared those four cases, but isolated feet/bases still read as floating over the enlarged scene. Main and independent R5 rejected that broader failure after U76. Retaining the original continuous substrate resolved it; R6–R9 then corrected and verified the remaining peripheral joins. Working history remains in `tmp/embedded-review/`; these intermediate passes are not substituted for final visual acceptance.

The first main WebKit production search run passed all fifteen pixel comparisons, the 32-frame matrix, keyboard/rotation/200% text and small-phone actions. Its four failures are retained, not labelled a passing batch: two storage-fixture cases import `/src/storage.ts`, so they must run against the development server, and two five-scene cases exposed a 0.53125px shortfall against the existing ten-pixel bottom margin. A separate short-landscape probe found a 0.70457px shortfall against the four-pixel gap between two circular hit areas. Tiny anchor adjustments within the same wood surfaces corrected both safety margins; the settled per-engine batches above passed without relaxing assertions. The final source-relative support probe also replaced an invalid assumption that all native wood alpha exceeds 220: direct inspection of the unchanged atlas confirmed lower values. No image was modified or assertion weakened to conceal lost support.
