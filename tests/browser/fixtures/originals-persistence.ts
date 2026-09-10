import { test as base, type BrowserContext } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Opt in only for the originals-persistence test. Linux WebKit 26.5's
// ephemeral contexts abort Blob/File IDB writes with UnknownError; a fresh
// persistent profile preserves the real-Blob assertions without a storage mock.
export const originalsTest = base.extend({
  context: async (
    { context, browserName, playwright, baseURL, viewport, hasTouch, isMobile },
    use,
    testInfo,
  ) => {
    if (browserName !== "webkit") {
      await use(context);
      return;
    }

    const profile = await mkdtemp(join(tmpdir(), "mixor-webkit-originals-"));
    let persistent: BrowserContext | undefined;
    try {
      // The pinned Playwright Test 1.62.1 context hooks apply project launch
      // defaults and configured tracing here too (verified with --trace=on).
      // Keep viewport/touch settings; never reuse real or previous test data.
      persistent = await playwright.webkit.launchPersistentContext(profile, {
        baseURL,
        viewport,
        hasTouch,
        isMobile,
      });
      testInfo.annotations.push({
        type: "storage-context",
        description: "Fresh per-test persistent WebKit profile; real IDB blobs.",
      });
      await use(persistent);
    } finally {
      try {
        await persistent?.close();
      } finally {
        // Only the exact synthetic directory allocated above is removed.
        await rm(profile, { recursive: true, force: true });
      }
    }
  },
});
