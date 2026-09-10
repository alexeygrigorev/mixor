# Browser checks and limits

2026-09-10. Browser-rendered phone/tablet checks are not physical iPhone, iPad or Android certification. Test commands are in the README. Chromium is the default; `npm run test:webkit` uses the matching Playwright WebKit binary (26.5 / revision 2336 in this environment).

## Original-photo persistence

The installed Linux WebKit fails nonempty IndexedDB Blob/File writes in its ephemeral test contexts with `UnknownError: Error preparing Blob/File data to be stored in object store`. This reproduces outside Mixor; changing File to Blob does not help. Plain objects and byte arrays succeed. The same WebKit binary with a fresh persistent profile, and Chromium's ephemeral contexts, preserve the files correctly.

The diagnostic compared 54 writes: 33 successful and 21 expected Blob/File failures. Separate actual-app phone/tablet checks saved a synthetic 68-byte PNG, rotated the viewport, reloaded, and restarted the browser. Both persistent WebKit profiles retained identical original bytes (SHA-256 `593437c9481de868bd53353e7dcb4a4d6a578c86a15a4677a880548519f4cd26`). No real user profile or observation was opened, converted or deleted.

Only the originals-persistence test opts into a new temporary persistent WebKit profile. It retains real IndexedDB and original-byte assertions, without a storage mock or skipped save. Other UI tests keep isolated ephemeral contexts. The fixture deletes only its own freshly allocated synthetic profile after closing the browser. This does not fix the underlying ephemeral-runtime limitation or establish behavior in physical Safari/private browsing.

Detailed diagnostic scripts and matrix are under `tmp/webkit-storage/`. No production storage schema was changed. A failed write continues to preserve the form and does not claim success.

## Portable assertions

- Closed native `details` content is unpainted in WebKit although descendant geometry remains. The classification test uses native `checkVisibility()` rather than geometry alone.
- MP3 decoding differs in encoder-padding treatment. The 1.2-second uncover cue is checked within 1.19–1.24 seconds; its signal bounds remain checked.
- Native-touch injection through Chromium's debugging protocol is explicitly Chromium-only. Shared pointer/keyboard tests run in both browsers. Linux WebKit checks do not imply physical iOS swipe verification.
- Audio checks observe media decoding and actual playback progression. They cannot certify absence of audible buzz, comfortable volume or loop naturalness on a listener's device.

Main independently reran the game/storage and accessibility files: 12/12 Chromium (17.8s) and 12/12 WebKit (20.3s), including real original-byte persistence, rotation/reload, focus and refused-write form preservation. Current complete-suite counts belong in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md); these focused checks are not a full-suite result.
