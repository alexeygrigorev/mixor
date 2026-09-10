# User feedback and active acceptance checklist

Updated: 2026-09-10. This is the durable record of the user's playtest requests, including corrections to earlier implementations. Read it before changing the game. Latest explicit feedback overrides conflicting older UI/audio defaults; privacy, source attribution and scientific honesty still apply.

The actual session logs have now been inspected: [all 49 submitted inputs, with source lines and timestamps](SESSION_INPUTS.md). U23–U31 were missing from the earlier recap and do not appear as delivered user-text items in the inspected rollout, but are present in this session's submission history. They are requirements, not optional suggestions. This audit corrects the earlier blanket “Back only” and “no rain” interpretations.

## Source-linked working checklist

Checked means the objective fact was verified or the documentation step completed; it never means subjective user acceptance. Unchecked includes partial implementations and reopened regressions. Baseline is commit `d4f8d37`; previous test runs below are historical until rerun. Each implementation commit must update its affected rows with evidence.

- [x] **SETUP-01** — Clone/inspect the requested repository and requirements (U01). Repository and specification are present; initial implementation commits exist.
- [ ] **GAME-01** — Deliver a playable, image-led exploration game, not a website/dashboard; make development obvious (U03, U07). Focused activities exist; missing interaction and rejected art prevent closing this.
- [ ] **DEVICE-01** — Work on phone and tablet (U03). Prior Chromium emulation passed; fresh checks after fixes and physical-device confirmation remain.
- [ ] **RUN-01** — Explain how to run it and actually keep it reachable (U05–U06). README has commands; recheck the live server before handoff.
- [x] **AUDIO-TOOLS** — Use ElevenLabs tooling from `../red-stamp` for sound assets (U02). Generator and npm command exist; credentials remain outside browser/Git.
- [ ] **HOME-01** — Main screen selects focused activities: finding, development, tree, etc. (U14). Present; preserve while correcting Back behavior.
- [ ] **NAV-01** — Back follows context, not always the beginning: woodland → scene chooser → main; discovery → originating woodland (U14 refined by U30–U31). **Open: selected woodland currently goes straight home.**
- [ ] **NAV-02** — Move between scenes without leaving finding mode (U23, U31). **Open: no in-scene scene-switch action.**
- [ ] **FIND-01** — Four or five distinct scenes with different hiding places to search (U13). Five scenes / fifteen places exist; wider, natural scene assets still missing.
- [ ] **FIND-02** — Finding screen is devoted to finding, without article panels, competing activities or dashboard chrome (U13–U14). Keep Back and quiet in-mode navigation required by U23; inspect screenshot removals again after changes.
- [ ] **FIND-03** — Restore the earlier circular portraits/magnifiers (U22). Circles restored, but functional acceptance depends on FIND-04.
- [ ] **FIND-04** — Learn more about a discovery; the found circles must be clickable (U29, U31, U39). **Open: found-circle handler currently does nothing.** Preserve finds and return context.
- [x] **SPECIES-01** — More than two taxa; every offered species has development (U09, U15). Eight taxa / nine stages each are implemented; visual quality remains separately open.
- [ ] **DEV-01** — Focus development on viewing evolution, not an article or dashboard (U04, U07, U15). Present; fresh rendered check including enlarged text remains.
- [ ] **DEV-02** — Generated, coherent stage imagery for every single species (U04, U08, U15). Coverage exists, but user rejected the artificial visual style. Shared microscopic stages must remain labelled educational reconstruction.
- [ ] **DEV-03** — Show the biological steps between one cell and a large plasmodium (U20). Nine-stage sequence includes zygote, nuclear division and young plasmodium; review the actual images, not just stage labels.
- [ ] **TREE-01** — Real branching classification, real names and real groupings, explorable (U04, U18). Present; unresolved genus-source qualification and return-context review remain.
- [x] **NAMES-01** — Proper scientific names instead of invented names such as “Жёлтые облачка” (U19). Scientific names are primary; retain synonyms and source determinations.
- [ ] **ART-01** — Generated main imagery in a coherent style; optional actual photographs (U08, U12). Mechanism present; replacement realism remains open.
- [ ] **ART-02** — All scenes and organisms should look natural, not artificial, shiny, polished or CGI-like (U22, U27, U31, U38). **User-rejected: existing art must be replaced and inspected.**
- [ ] **ART-03** — Specifically replace the unrealistic polished stump (U24, U31). **Open.**
- [ ] **ART-04** — Zoom out scene 3 (“under leaves”) and also scenes 4 and 5; show more surrounding things (U25–U26, U31). **Open: previously omitted.**
- [ ] **WEATHER-01** — Different weather, not sunshine everywhere; visible rain in some scenes (U28, U31). **Open: previously omitted.** Preserve readable interaction and reduced-motion support.
- [ ] **PHOTO-01** — Real photographs are subtle and optional, without disrupting the current flow (U12, U16). Preview exists; preserve context and improve attribution touch/readability.
- [ ] **AUDIO-01** — Remove the annoying buzz without removing all audible nature/tap sounds (U21, U34, U43). **Reopened: user still hears buzz after previous mastering.** Not merely “listening pending.”
- [ ] **AUDIO-02** — Subtle but audible tapping/changing; natural, not electronic (U11, U34, U37). **Reopened: electronic change sound explicitly rejected.** Replace timbre, not only gain.
- [ ] **AUDIO-03** — Hear a natural tactile uncovering cue when moving bark/cork/leaves (U35). Dedicated cue exists; listening quality remains unconfirmed.
- [ ] **AUDIO-04** — Modals must not stop/restart music (U36). Previous actual-playback tests pass; rerun after sound changes.
- [ ] **AUDIO-05** — Less pronounced, low-key main theme and subtle, longer natural loops (U10, U17). Longer masters exist; buzz and listening balance remain unresolved.
- [ ] **AUDIO-06** — Birds, wind and nature; no unnecessary continuous water. Sound depends on scene: hear rain only where it visibly rains (U10, U17 refined by U28/U31). **Open: current three layers are global, with no scene weather.**
- [x] **PROCESS-01** — Inspect actual session history, retain every request and make a complete checklist (U32–U33, U40–U45, U47–U48). Actual history/rollout inspected; 49 inputs preserved, including duplicates and nine formerly missed submissions.
- [ ] **PROCESS-02** — Work through the checklist, not just recap it; do not treat partial fixes as all feedback handled (U40, U45–U46, U49). Active work; report implementation, tests and user acceptance separately.
- [ ] **PROCESS-03** — Parallel fixes are allowed (U32–U33). Use bounded, non-overlapping tasks where useful; this is permission, not a user-facing feature to claim complete.
- [ ] **PROCESS-04** — Commit regularly (U45). Commit this source audit first, then verified logical fix batches; no unrelated changes or automatic push.

Status vocabulary: **implemented** means present in the working tree, not user-approved; **in progress** means being changed; **open** means not resolved. Automated playback is not a listening test. Do not mark an item accepted just because a build passes.

## Current priorities

| ID | Request / acceptance condition | Status |
| --- | --- | --- |
| AUDIO-01 | Remove the annoying continuous buzz. Keep quiet birds, wind and leaf sounds; rain only in rainy scenes. Do not solve it by muting all nature audio. Compare separate stems and the mix, including a loop boundary. | Reopened by U43: user still hears buzz after installed cleaned masters. Previous numerical improvements did not resolve user acceptance. |
| AUDIO-02 | Taps must be subtle but audible and natural, not electronic. Earlier feedback asked for less pronounced clicks, not silence. Keep effects independent of the music and nature sliders. | Reopened by U37: changing sound is electronic and annoying. Previous playback/level tests do not establish acceptable timbre. |
| AUDIO-03 | Uncovering bark/cork, leaves or another hiding place in the forest must produce a short, natural tactile sound synchronized with the reveal. Not merely the generic menu click, a musical reward or an organism's supposed voice. | Implemented: dedicated 1.2-second bark/leaf cue, plays only on a new reveal. Decoding, repeat suppression and mute checks pass; physical listening pending. |
| AUDIO-04 | Opening or closing a modal must not stop or restart the music/ambience. Includes real-photo preview, settings, sources and the new-find form. Mute and hidden-tab pause must still work. | Implemented: removed modal-driven pause. Same advancing tracks verified through all four modal types on phone/tablet Chromium. |
| FIND-03 | Restore the circular forest hotspots/magnified portraits as before. The user's request to remove surrounding UI did NOT ask to remove the circles. Keep the finding/reveal interaction. | Partial: circles restored, but U39 reports them not clickable. Found circles currently have no action; FIND-04 remains open. |
| ART-02 | Generated images look too artificial. Replace the polished/fantasy/CGI look with natural, photographic lighting, irregular real-world texture and believable organisms. Apply this direction to scenes and development images. Generated content must still be labelled as reconstruction, never a real specimen photo. | Open: existing generated assets are a rejected style baseline, not accepted final art. |

## Complete product feedback to preserve

- **GAME-01 — A game, not a website.** Full-screen, image-led exploration, usable on phones and tablets in portrait and landscape. Avoid an article/dashboard taking over the play space. Keep local run instructions correct; a non-running game is not a delivered feature.
- **HOME-01 — Separate activities.** The main screen chooses finding organisms, development, the classification tree and the journal. Back follows the actual activity hierarchy. U30 corrects the earlier shortcut: woodland → scene chooser → main, not woodland → main.
- **FIND-01 — Several places.** Four or five distinct woodland scenes, each with different hiding places in bark, moss, roots or leaves. Current implementation has five scenes and fifteen hiding places spanning all eight taxa. Preserve them when restoring circles.
- **FIND-02 — Search screen only for finding.** Remove large titles, progress dashboards, article panels, journal/lens/development controls and persistent activity navigation from this screen. Keep Back plus quiet scene-switch controls explicitly requested later in U23. The organism circles are part of the game, not forbidden UI. Found organisms must open information (U29/U39). Keep clear revealed/unrevealed feedback and touch/keyboard access.
- **FIND-03 — Circles, not tiny pasted fragments.** Latest explicit correction: “this should be like we had before with circles”. Do not reintroduce the earlier mistaken no-circles rule.
- **SPECIES-01 — More than two taxa.** All eight currently prepared taxa remain accessible, not just Physarum/Badhamia and Arcyria. Every listed species must have the development activity.
- **DEV-01 — Focus on development.** One dominant stage image, compact explanation and manual stage controls. No large article column, competing calls to action or global navigation toolbar. Support touch/swipe and accessible buttons; no required automatic playback.
- **DEV-02 — Show the intermediate growth.** Do not jump from one fused cell straight to a large plasmodium. Current sequence: spore → amoeboid/flagellated cells → fusion → zygote → nuclear division in one cell → young multinucleate plasmodium → branching plasmodium → fruiting primordia → mature fruiting bodies → return to spores. The early stages are a sourced group-level educational reconstruction, not a documented time series for every species. Do not invent durations, scale bars or species-specific observations.
- **TREE-01 — Real classification.** A genuinely branching hierarchy with real group names and source/version information, not a flat grid or a life-cycle diagram. Preserve navigation context when returning from a species.
- **NAMES-01 — Proper names.** Scientific names are primary, not invented nicknames such as “Жёлтые облачка”. Current display names include Badhamia polycephala (Physarum polycephalum synonym) and Hemitrichia decipiens (Trichia decipiens synonym); keep stable internal IDs and original photo-source determinations.
- **ART-01 — Generated main imagery, optional actual photos.** Keep a coherent style across organisms and developmental stages. The latest realism criticism refines that style; it does not authorize mislabelling generated images or removing actual reference photos.
- **ART-02 — Natural appearance.** Avoid glowing storybook forests, plastic surfaces, decorative anatomy, exaggerated saturation, uniform perfect shapes and implausible sharpness. Natural imperfections and subdued light matter. All eight taxa and all stages need visual review, not just one hero image.
- **PHOTO-01 — Quiet access to actual photos.** A small optional photo action opens a contextual preview; closing it preserves species, stage and position. Keep author/license and full-frame viewing. If a photo does not show the selected stage, say so; different specimens are not one developmental time series.
- **AUDIO-05 — Low-key background.** The main theme should not dominate attention. Keep quiet birds, wind and leaf movement. No unnecessary continuous stream/dripping layer. U28 explicitly requires rain audio in rainy scenes and none in dry scenes; it supersedes the earlier blanket ban on rain. Longer, smoothly joined loops should feel natural. Preserve separately adjustable music/nature/effects, explicit sound consent and mute.
- **AUDIO-01–04 — Latest sound regressions.** Buzz removal, audible taps, tactile uncovering and uninterrupted modal playback are separate acceptance items above. Fixing one does not close the others.
- **RUN-01 — How to run.** Document `npm ci` and `npm run dev -- --host 0.0.0.0 --port 4173`; explain the server's address on phone/tablet. Ordinary play must not require API keys. ElevenLabs credentials may be used from the sibling `../red-stamp` environment only by asset tooling, never exposed to the browser or Git.

## Screenshot feedback references

These are local attachment references, not files to publish or infer extra requirements from:

- `20260910-121247-01-annotated-clipboard-20260910-101246.png`: finding screen; remove surrounding chrome, retain the play area.
- `20260910-121353-01-annotated-clipboard-20260910-101352.png`: focused development for every species.
- `20260910-121647-01-clipboard.png`: genuine taxonomy tree.
- `20260910-121750-01-clipboard.png`: missing intermediate growth stages.
- `20260910-125303-01-annotated-image-20260910-105303.png`: red circles over three forest positions; restore circular presentation.
- `20260910-125249-01-annotated-clipboard-20260910-105249.png`: received image appeared uniformly dark; do not invent annotations from it.
- `20260910-132530-01-clipboard.png`: three revealed organism circles with check badges; user says these are not clickable. Found items must open information and return to the same woodland.

## Verification and handoff rules

- Test silent entry, audible tap/uncover after consent, effects at zero, master mute, hidden-tab pause/resume and continuous music through every modal. Check actual media decoding and advancing playback, not only calls to `play()`.
- Listen to the cleaned stems and combined soundtrack on headphones and phone/tablet speakers. Until that happens, AUDIO-01 and subjective volume/loop quality remain awaiting listening, even if signal measurements improve.
- Verify all five forest scenes before/after revealing, all eight species and nine stages, photo preview return, genuine tree grouping and phone/tablet/short-landscape layouts.
- Keep implementation, automated checks, user listening/visual approval and untested physical-device behavior separate in the status report.
- Current generated art remains pending replacement. Earlier design-review acceptance belongs to the earlier design only; it is not acceptance of these latest corrections.
- Preserve local observations, original photo files, attribution, stored preferences and stable progress IDs throughout these fixes. Do not advance to unrelated AWS work while these playtest regressions are unresolved.

## Additional review findings to retain

These are independent review findings, not additional requests invented on the user's behalf. The previous full UI review remains REVISE until rechecked:

- **REVIEW-01:** Verify development at 200% text. Rail/control wrapping was corrected, but the scientific-name header also needs a fresh rendered check for clipping.
- **REVIEW-02:** Make real-photo credit links comfortably readable and at least 48px touch targets inside the optional photo view. The earlier review measured 8px type / 11px-high links.
- **REVIEW-03:** Data qualification added after rechecking [Shchepin et al. (2026), “Species incertae sedis”](https://www.bioacad.com/article/doi.org/10.65390/fdiv.2026.136015): Stemonitis axifera has unresolved generic affiliation within Stemonitidaceae. Keep its conventional name with a provisional-placement flag and note, not a fabricated replacement genus. Content test covers that qualification; visible source-note/branch review remains pending.

## Work log after the source audit

- `7023c06`: committed 49 verbatim submissions and the corrected source-linked checklist. A source comparison subsequently verified all 49 entries, including attachments and duplicates.
- Taxonomy data: rechecked the primary 2026 publication; marked Stemonitis placement provisional and added an explicit note. `node --test tests/content.test.mjs`: 3 passed. This does not close the entire tree/UI requirement.
- Live development server responded HTTP 200 on `http://127.0.0.1:4173/` during this pass. Physical phone/tablet access is not inferred from that check.
- A full browser run overlapped active UI/audio edits and therefore is not final regression evidence. Rerun after the implementation batch is stable.
- Scene-art replacement: all five backgrounds regenerated with the built-in image tool; the main-screen forest reuses the new clearing. Exact prompts and output identifiers are in `content/generated-art.manifest.json`. Wider ordinary woodland compositions replace the old shiny/golden close-ups; originals and runtime WebP files are installed. Source images and four live phone/tablet/landscape frames inspected; full independent review remains pending.
- Weather data/layer: forest clear; stump/leaves overcast; roots/birch rainy. Noninteractive rain respects reduced-motion and calm mode. Rain audio integration is a separate active change, not implied complete by the visual layer.

Current review evidence is in `tmp/focused-review/ROUND1_REVIEW.md`; those scratch files may not survive another environment, so the actionable findings are recorded here. The old published `REDESIGN_REVIEW.md` concerns the earlier version and does not close this checklist.

## Latest completed checks

- `npm test`: 6 domain/content tests and 28 phone/tablet browser tests passed. Includes actual tap/uncover signal bounds, modal continuity, all species/stages, circles, storage and keyboard regressions.
- `npm run typecheck`, `npm run build`, `npm run assets:validate`, and `npm run test:offline` passed. The public cache contains 68 files, including the dedicated uncover cue.
- Cleaned loop files: music 174.036s, wind 167s, birds 191s. Source/master hashes and numerical boundaries: [audio-mastering-report.json](../content/audio-mastering-report.json). These measurements are not a physical listening report.
- Retained screenshots: [phone circles](screenshots/phone-search-circles.png), [tablet circles](screenshots/tablet-search-circles.png), [phone development](screenshots/phone-development-focused.jpg), [tablet development](screenshots/tablet-development-focused.jpg), [classification](screenshots/phone-classification-focused.jpg). Current art is shown as evidence of implementation, not acceptance of realism.
