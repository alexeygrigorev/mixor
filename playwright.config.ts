import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./tmp/test-results",
  timeout: 45000,
  expect: { timeout: 7000 },
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:4173",
    launchOptions: {
      executablePath: process.env.TEST_BROWSER_PATH,
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "tablet",
      use: { viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
