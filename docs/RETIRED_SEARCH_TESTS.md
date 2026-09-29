# Retired generated-search browser checks

Updated: 2026-09-29.

The user explicitly removed generated search stages 1–6 and retained the real-frame forest walk (formerly stage 7). Tests whose sole subject is the retired renderer, generated-background composition, magnifier, weather, stage switching, or generated-discovery return flow are preserved as historical code with an explicit `test.skip` reason. They are not failures waived for the active walk, and they do not constitute current acceptance evidence.

| File | Retired test definitions | Active test definitions | Treatment |
| --- | ---: | ---: | --- |
| `navigation.spec.ts` | 4 | 2 | Retire old scene switching, generated-discovery return/audio, and enlarged generated-search controls. Keep direct-link parents, tree context, development and photo attribution. |
| `focused.spec.ts` | 2 | 2 | Retire generated-place discovery/replay and generated magnifier keyboard coverage. Keep all eight development cycles and classification. |
| `embedded-search.spec.ts` | 3 | 1 | Retire generated-background visual matrices and magnifier geometry. Migrate the originals-preservation scenario to the active photo walk, retaining actual Blob, archived discovery, and development checks. |
| `search-fidelity.spec.ts` | 1 | 0 | Retire pixel equivalence between the generated clue and its old magnifier. Historical definitions use archived woodland metadata. |
| `accessibility.spec.ts` | 0 | 2 | Keep both tests; replace only the generated-discovery portion with keyboard discovery/dialog/focus-return checks in the active photo walk. |
| `portrait.spec.ts` | 1 | 4 | Split the mixed return-context test: preserve the generated-discovery portion as skipped history and keep tree/direct-link return coverage active. All other portrait checks remain active. |
| **Total** | **11** | **11** | Counts are test definitions before browser/project expansion. |

There is no `tests/browser/weather.spec.ts` in this checkout. This record covers only the six files listed above; other test maintenance is recorded separately.

Current exploration coverage belongs to `photo-walk-mobile.spec.ts` and `photo-walk-objects.spec.ts`, with data/progress checks in the photo-walk unit suite. Archived discovery validation remains covered by `tests/content.test.mjs`.

Validation for this maintenance pass: Playwright discovery (`--list` for these six files) succeeds and lists 44 phone/tablet instances, comprising 22 active and 22 intentionally retired instances. Listing is not a browser execution. The coordinating agent records actual browser-run results separately.

Follow-up execution: after aligning migrated selectors with the retained activity labels, the two migrated scenarios (`focused keyboard` and `photo walk exit`) passed on both phone and tablet in Chromium: **4 passed**. This confirms keyboard discovery/focus return and preservation of original Blob bytes, archived findings, and development progress through the active walk. Output: `tmp/retirement-fix-results`.

Audio/history maintenance: three tests tied exclusively to retired rainy woodlands and one old selected-magnifier-to-species navigation case are explicitly skipped. General audio playback, defaults/migration, mute, decode, development and history cancellation remain active. Their stage traversal/uncover tests now use the photo walk. Combined historical retirement is 15 test definitions (30 phone/tablet instances).
