# U51: quieter circles, unchanged interaction

2026-09-10. This is a bounded styling correction to the user's explicit request for less disruptive circles. It does not implement the separately proposed single-expanded-selection interaction or infer approval from an automatic goal continuation. All three circular covers/portraits remain visible; first tap reveals and repeated tap opens information.

**Superseded by U59:** the user says this still is not embedded in the picture and requests the first playable visual treatment with the current background preserved. This document records the `3224617` styling checkpoint, not acceptance or completion of that newer request.

## Changes and inspected evidence

- Reduced typical circle diameter from 171.6 to 136.5px at 390×844 and from 204.8 to 163.84px at 1024×768. Runtime still enforces at least 48px, with viewport-based placement and separation.
- Replaced the five-pixel gold-gradient padding with one-pixel muted framing; removed the warm glow and heavy drop shadow. Retained a distinct keyboard-focus outline.
- Quieted the magnifier badge and “Узнать” invitation without removing their meaning or requiring hover. Generated portraits, natural covers and source images are unchanged.

Main inspected the rendered forest before/after reveal on phone, the revealed forest on tablet, all other places across phone/short-landscape examples, and compared against the prior large-rim result. This is implementer inspection, not independent or user acceptance. The broader concern about artificial-looking organisms remains open.

| View | Retained capture |
| --- | --- |
| Phone, covered | [Forest](screenshots/subtle-circles/phone-forest-covered.png) |
| Phone, revealed | [Forest](screenshots/subtle-circles/phone-forest-revealed.png) |
| Tablet, revealed | [Forest](screenshots/subtle-circles/tablet-forest-revealed.png) |
| Short landscape, revealed | [Birch](screenshots/subtle-circles/landscape-bark-revealed.png) |

## Verification

`npx playwright test tests/browser/focused.spec.ts tests/browser/navigation.spec.ts --workers=2 --output=tmp/subtle-circles/checks`: **20 passed (1.4m)**. The suite covers all fifteen reveal/learn/return interactions, six viewport sizes, no overlapping/clipped circles, keyboard/reduced motion, focus return, reload/history, stored finds, enlarged text, and continued originating audio. It also checks the smaller diameters and absence of the old gradient frame. These assertions support behavior and geometry, not a claim that aesthetic approval is automatic.

Typecheck, build, asset validation and production offline checks passed. Public cache: `mixor-public-b809b95d2fe16f3d`, 74 files. No audio/image assets, stage IDs or personal data were changed. R4/R5 remain historical scoped reviews of development/weather; this later circle-only diff changes the whole-file hashes of `focused-scenes.tsx` and `focused.css`, not the reviewed development implementation inside them.
