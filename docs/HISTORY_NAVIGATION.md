# Reliable rapid stage and scene navigation

2026-09-10. The original WebKit trace showed `history.replaceState` exceeding 100 calls in ten seconds. The exception occurred before React advanced the route, so a stage appeared stuck even though the arrow received the click.

Same-activity navigation now commits the first request immediately and the latest pending request no more often than every 150 ms. The URL and rendered route publish together after a successful write. A `SecurityError` retries with 250/500/1000/2000 ms backoff; other errors are not disguised as quota errors. Back, a new activity, browser history/hash changes and unmount cancel pending navigation. Normal Back hierarchy and saved observations are unchanged.

Implementation: [history-committer.ts](../src/history-committer.ts), integrated into [App.tsx](../src/App.tsx). Regression coverage: [history-quota.spec.ts](../tests/browser/history-quota.spec.ts).

Main independently passed all **14 quota/navigation cases in Chromium and all 14 in WebKit**. These include 112 native stage clicks, scene switches, deterministic first/latest and capped retries, modeled refusal followed by real History API writes, and cancellation through four navigation paths. All four all-species/four-size arrow-position cases also passed after the fix, without delaying test clicks or relaxing position assertions.

The combined main runs were not whole-suite passes: Chromium had 25 pass/3 fail; WebKit 22 pass/4 fail/2 documented CDP skips. A test helper incorrectly expected the development screen when opening species selection; it now waits for the shared scene root. Separate heavy 88-stage screenshot cases exhausted their 180-second deadline under the concurrent capture workload. Trace inspection found no page errors, quota errors or HMR; URL waits totaled 2.52 s / 2.24 s, while repeated serial geometry preparation consumed 51.9 s / 44.1 s. Some captures completed during teardown, so file counts are not completed-assertion counts.

The test now reads geometry in one browser call, retaining every size/aspect/overflow/absence assertion and native intersection ratios for ancestor clipping. No timeout was raised and no assertion removed. Main reran the heavy eight-species/eleven-stage capture and saved-visit cases on the frozen production build, one worker and one engine at a time: **4/4 Chromium (1.4 min), 4/4 WebKit (1.5 min)**. Each engine completed all 176 phone/tablet stage captures and assertions. The shared readiness helper also passed an earlier 2/2 Chromium rerun. These harness corrections do not change navigation behavior.

The production build with this navigation fix passed and contains 74 public assets under `mixor-public-f0e87390a5fe31bb`. Search fidelity/placement is a separate active correction; later final build and browser results belong in [implementation status](IMPLEMENTATION_STATUS.md).
