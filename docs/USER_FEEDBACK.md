# User feedback and active acceptance checklist

Updated: 2026-09-10. This is the durable record of the user's playtest requests, including corrections to earlier implementations. Read it before changing the game. Latest explicit feedback overrides conflicting older UI/audio defaults; privacy, source attribution and scientific honesty still apply.

Status vocabulary: **implemented** means present in the working tree, not user-approved; **in progress** means being changed; **open** means not resolved. Automated playback is not a listening test. Do not mark an item accepted just because a build passes.

## Current priorities

| ID | Request / acceptance condition | Status |
| --- | --- | --- |
| AUDIO-01 | Remove the annoying continuous buzz. Keep quiet birds, wind and leaf sounds, with no water. Do not solve it by muting all nature audio. Compare separate stems and the mix, including a loop boundary. | In progress: diagnose and remaster existing stems; listening confirmation still needed. |
| AUDIO-02 | Taps must be subtle but audible. Earlier feedback asked for less pronounced clicks, not silence. Keep effects independent of the music and nature sliders. | Implemented: measure filtered cues before fixed-gain mastering; restore button feedback. Browser playback checks pass; physical listening pending. |
| AUDIO-03 | Uncovering bark/cork, leaves or another hiding place in the forest must produce a short, natural tactile sound synchronized with the reveal. Not merely the generic menu click, a musical reward or an organism's supposed voice. | Implemented: dedicated 1.2-second bark/leaf cue, plays only on a new reveal. Decoding, repeat suppression and mute checks pass; physical listening pending. |
| AUDIO-04 | Opening or closing a modal must not stop or restart the music/ambience. Includes real-photo preview, settings, sources and the new-find form. Mute and hidden-tab pause must still work. | Implemented: removed modal-driven pause. Same advancing tracks verified through all four modal types on phone/tablet Chromium. |
| FIND-03 | Restore the circular forest hotspots/magnified portraits as before. The user's request to remove surrounding UI did NOT ask to remove the circles. Keep the finding/reveal interaction. | Implemented: large circular magnifiers with cover/reveal states across five scenes. Phone/tablet/landscape captures and interaction tests completed; user visual approval pending. |
| ART-02 | Generated images look too artificial. Replace the polished/fantasy/CGI look with natural, photographic lighting, irregular real-world texture and believable organisms. Apply this direction to scenes and development images. Generated content must still be labelled as reconstruction, never a real specimen photo. | Open: existing generated assets are a rejected style baseline, not accepted final art. |

## Complete product feedback to preserve

- **GAME-01 — A game, not a website.** Full-screen, image-led exploration, usable on phones and tablets in portrait and landscape. Avoid an article/dashboard taking over the play space. Keep local run instructions correct; a non-running game is not a delivered feature.
- **HOME-01 — Separate activities.** The main screen chooses finding organisms, development, the classification tree and the journal. Each focused activity has a clear Back route to the main screen.
- **FIND-01 — Several places.** Four or five distinct woodland scenes, each with different hiding places in bark, moss, roots or leaves. Current implementation has five scenes and fifteen hiding places spanning all eight taxa. Preserve them when restoring circles.
- **FIND-02 — Search screen only for finding.** Remove large titles, progress dashboards, article panels, journal/lens/development controls and persistent bottom navigation from this screen. Back is the only surrounding navigation. The organism circles are part of the game, not forbidden UI. Keep clear revealed/unrevealed feedback and touch/keyboard access.
- **FIND-03 — Circles, not tiny pasted fragments.** Latest explicit correction: “this should be like we had before with circles”. Do not reintroduce the earlier mistaken no-circles rule.
- **SPECIES-01 — More than two taxa.** All eight currently prepared taxa remain accessible, not just Physarum/Badhamia and Arcyria. Every listed species must have the development activity.
- **DEV-01 — Focus on development.** One dominant stage image, compact explanation and manual stage controls. No large article column, competing calls to action or global navigation toolbar. Support touch/swipe and accessible buttons; no required automatic playback.
- **DEV-02 — Show the intermediate growth.** Do not jump from one fused cell straight to a large plasmodium. Current sequence: spore → amoeboid/flagellated cells → fusion → zygote → nuclear division in one cell → young multinucleate plasmodium → branching plasmodium → fruiting primordia → mature fruiting bodies → return to spores. The early stages are a sourced group-level educational reconstruction, not a documented time series for every species. Do not invent durations, scale bars or species-specific observations.
- **TREE-01 — Real classification.** A genuinely branching hierarchy with real group names and source/version information, not a flat grid or a life-cycle diagram. Preserve navigation context when returning from a species.
- **NAMES-01 — Proper names.** Scientific names are primary, not invented nicknames such as “Жёлтые облачка”. Current display names include Badhamia polycephala (Physarum polycephalum synonym) and Hemitrichia decipiens (Trichia decipiens synonym); keep stable internal IDs and original photo-source determinations.
- **ART-01 — Generated main imagery, optional actual photos.** Keep a coherent style across organisms and developmental stages. The latest realism criticism refines that style; it does not authorize mislabelling generated images or removing actual reference photos.
- **ART-02 — Natural appearance.** Avoid glowing storybook forests, plastic surfaces, decorative anatomy, exaggerated saturation, uniform perfect shapes and implausible sharpness. Natural imperfections and subdued light matter. All eight taxa and all stages need visual review, not just one hero image.
- **PHOTO-01 — Quiet access to actual photos.** A small optional photo action opens a contextual preview; closing it preserves species, stage and position. Keep author/license and full-frame viewing. If a photo does not show the selected stage, say so; different specimens are not one developmental time series.
- **AUDIO-05 — Low-key background.** The main theme should not dominate attention. Keep quiet birds, wind and leaf movement. No stream, rain, dripping or other water layer. Longer, smoothly joined loops should feel natural. Preserve separately adjustable music/nature/effects, explicit sound consent and mute.
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
- **REVIEW-03:** Qualify the conventional Stemonitis axifera genus placement in the source note and taxonomy data. The chosen 2026 source treats its generic affiliation as unresolved; do not invent a replacement genus. Recheck the primary source before editing the scientific record.

Current review evidence is in `tmp/focused-review/ROUND1_REVIEW.md`; those scratch files may not survive another environment, so the actionable findings are recorded here. The old published `REDESIGN_REVIEW.md` concerns the earlier version and does not close this checklist.
