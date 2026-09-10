# Development correction: evidence and review scope

2026-09-10. Covers U54–U57 in [the actual session-input audit](SESSION_INPUTS.md). Independent reviewer Leibniz issued **SCOPED DEVELOPMENT UI / EARLY ART / ELEVEN-STAGE CONTINUITY: ACCEPT** in round 4, with no remaining finite revision. This is not overall or user acceptance: finding-circle presentation, broader scene realism, audio listening and physical-device/Safari testing remain open in [the checklist](USER_FEEDBACK.md).

## Implemented correction

All eight cycles have eleven manually selectable views. The former young-plasmodium → network jump now includes broad spreading lobes and the first sparse connected veins. These explain gradual growth of one continuous cell, not a colony of cells joining together. Old stage IDs and saved progress remain valid.

Eight independent built-in image-generation calls supplied eight different early-stage plates, each with eight square tiles. They are new compositions, not a shared sheet recoloured or mirrored. Source PNGs are in [content/artwork](../content/artwork/); runtime WebPs are in [public/assets/art](../public/assets/art/). Exact prompts, output identifiers, hashes and scientific qualifications are in [the generated-art manifest](../content/generated-art.manifest.json). The three later illustrations per species were retained; this review does not close the broader U50 realism concern about them.

The new development screen uses a dominant uncropped image, brief caption and compact circular arrows. Tapping “Этапы” opens the named picker. Swipe, keyboard, photo preview, source details, contextual Back and cycle restart remain available. The exact two-sentence photo notice rejected in U56 is gone; real captions and author/license credits remain.

## Complete cycle evidence

Each link shows all eleven manually selected stages in the final interface. Eight species × eleven stages × two viewports gives 176 rendered states. Internal file IDs preserve existing saves; displayed scientific names remain primary.

| Display name | Phone, 390×844 | Tablet, 1024×768 |
| --- | --- | --- |
| Badhamia polycephala | [11 stages](screenshots/development-11/phone-physarum-cycle.jpg) | [11 stages](screenshots/development-11/tablet-physarum-cycle.jpg) |
| Arcyria denudata | [11 stages](screenshots/development-11/phone-arcyria-cycle.jpg) | [11 stages](screenshots/development-11/tablet-arcyria-cycle.jpg) |
| Fuligo septica | [11 stages](screenshots/development-11/phone-fuligo-cycle.jpg) | [11 stages](screenshots/development-11/tablet-fuligo-cycle.jpg) |
| Lycogala epidendrum | [11 stages](screenshots/development-11/phone-lycogala-cycle.jpg) | [11 stages](screenshots/development-11/tablet-lycogala-cycle.jpg) |
| Stemonitis axifera | [11 stages](screenshots/development-11/phone-stemonitis-cycle.jpg) | [11 stages](screenshots/development-11/tablet-stemonitis-cycle.jpg) |
| Hemitrichia decipiens | [11 stages](screenshots/development-11/phone-trichia-cycle.jpg) | [11 stages](screenshots/development-11/tablet-trichia-cycle.jpg) |
| Tubifera ferruginosa | [11 stages](screenshots/development-11/phone-tubifera-cycle.jpg) | [11 stages](screenshots/development-11/tablet-tubifera-cycle.jpg) |
| Didymium squamulosum | [11 stages](screenshots/development-11/phone-didymium-cycle.jpg) | [11 stages](screenshots/development-11/tablet-didymium-cycle.jpg) |

Native-size examples: [spreading, phone](screenshots/development-11/phone-spreading.jpg), [first veins, phone](screenshots/development-11/phone-veins.jpg), [picker, tablet](screenshots/development-11/tablet-stage-chooser.jpg), [spreading, short landscape](screenshots/development-11/landscape-spreading.jpg), [fruiting, wide](screenshots/development-11/wide-fruit.jpg).

## What the independent review checked

The reviewer inspected all eight original plates and all sixteen complete cycle sheets, native settled frames at phone/tablet/short-landscape/wide sizes, the picker, photo preview and final 200%-text views. Its separate live probe exercised 44 keyboard-focused picker items, stage selection, reload, photo return, cycle restart, Back and enlarged-text reflow. All finite amended criteria passed: image dominance, compact manual controls, distinct early compositions, visible one-cell growth continuity, quiet genuine-photo access and accessible responsive layout.

Reviewer-run verification: 14 development/accessibility browser tests, 5 content tests and a four-viewport live probe passed. A prior interrupted broad run is not counted. Main separately passed 8 domain/content plus 62 browser tests, then 26 affected audio/focused tests after the later rain-only change. Build, asset validation and the production offline test passed; all eight early plates decode from the public cache offline.

Original detailed review and probes are local scratch artifacts under `tmp/focused-review/ROUND4_DEVELOPMENT_REVIEW.md` and `tmp/focused-review/reviewer-r4/`. This durable summary records their scope without implying that those ignored scratch files are published. Art/data were committed in `3a53ec8`; the reviewed UI hashes are:

```text
74eaad4d07bb1e5ce87b104698688fb73c8d8bbce7f335f5a3e06b7d044e7099 src/focused-scenes.tsx
a4462d57f56e3863f96363591878840c584747746ef74d9e52b6b289f1264271 src/focused.css
```

## Scientific and evidence limits

The early imagery is an explanatory group reconstruction at changing scales, not actual microscope photographs or eight observed specimen histories. Nuclear counts illustrate division without cell separation, not universal timing. The added views subdivide continuous growth for teaching, not formal stages shared identically by every species. Sources and qualifications are recorded beside the stage data and prompts.

Older [feedback-audit captures](screenshots/feedback-audit/) show the previous nine-stage submission. They are historical evidence, not this eleven-stage result or approval of the finding circles. No independent visual review replaces the user's judgement of realism, a biological expert's review or listening on the target devices.
