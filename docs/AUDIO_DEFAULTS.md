# Speaker defaults and sound intent — U58/U60/U61

Music/nature/effects now default to 36/90/36 instead of 12/45/18. Existing mastered MP3s and per-scene mixing are unchanged. Generic taps retain U58's relative multiplier of 0.3; the distinct uncover and journal cues retain their own gain factors. The derived tap metadata records the new default runtime gain.

Sound defaults on. The manager attempts playback and, if the browser refuses autoplay, retries on the first trusted ordinary click/tap. It tracks playback refusal separately from the saved sound preference, so an autoplay failure does not silently become a permanent mute. Explicit Quiet/Mute runs before the gesture retry and remains effective across reload. Modals do not change the active scene's music or rain.

Preferences use `mixor-sound-settings-v3`. Custom levels, including zeros, are retained. The exact old automatically stored default tuple migrates to the new defaults; any other valid old tuple is custom. Legacy `mixor-muted=true` is preserved as off. Old storage cannot distinguish a deliberately chosen default tuple from automatically written defaults, or intentional legacy mute from an old autoplay failure. Those migration assumptions are explicit; no other game storage is cleared.

Main independently ran all 28 audio browser cases in Chromium (29.5s) and WebKit (39.9s): both passed. Checks include actual media events/progression, distinct uncover versus tap, no same-click duplicate cue, zero effects, quiet reload, custom migration, default-on startup, modeled autoplay refusal followed by real native playback, hidden-tab pause/resume and continuing music through modals. A modeled refusal test is not proof of every physical browser's autoplay policy.

Physical speaker/headphone audibility, remaining buzz and naturalness still need listening. No subjective acceptance is inferred from decoding, numeric volume or passing playback tests.

Completion recheck on `9dac70e`: all 28 audio cases passed again in Chromium (1.4 minutes) and WebKit (1.7 minutes), with no failures/skips. All seven runtime recording hashes match the existing mastering report. Playback/source inspection did not establish a new audio defect; no levels or recordings were changed. [Remaining verification and next input](FEEDBACK_COMPLETION_AUDIT.md).
