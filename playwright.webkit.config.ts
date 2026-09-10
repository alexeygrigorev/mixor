import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Linux WebKit with phone/tablet viewport and touch emulation, not physical
// iOS Safari. Keep the same projects so layout-specific test branches still run.
export default defineConfig({
  ...base,
  outputDir: "./tmp/webkit-results",
  use: {
    ...base.use,
    browserName: "webkit",
    // The Chromium executable override and --no-sandbox flag do not apply.
    launchOptions: {},
  },
});
