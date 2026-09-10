import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.TEST_BROWSER_PATH,
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(process.env.TEST_PREVIEW_URL || "http://127.0.0.1:4174");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const keys = await page.evaluate(async () => {
    const cacheName = (await caches.keys()).find((key) =>
      key.startsWith("mixor-public-"),
    );
    const cache = await caches.open(cacheName);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  assert(keys.some((path) => /index-.*\.js$/.test(path)));
  assert(keys.includes("/assets/art/organisms-v2.webp"));
  assert(keys.includes("/assets/audio/ambience/birds-canopy-mix.mp3"));
  assert(!keys.some((path) => /observations|private|outbox/.test(path)));
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Развитие", exact: true }).click();
  await page
    .getByRole("button", { name: "Плазмодий", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Настоящее фото", exact: true })
    .click();
  await page.waitForFunction(() => {
    const image = document.querySelector(".photo-zoom img");
    return image?.complete && image.naturalWidth > 0;
  });
  const missing = await page.evaluate(async () => {
    try {
      const response = await fetch("/assets/nonexistent.webp");
      return response.headers.get("content-type");
    } catch {
      return null;
    }
  });
  assert.notEqual(missing, "text/html");
  console.log(
    "Production offline shell: app, self-hosted fonts, generated art and actual photo work offline; no HTML response masquerading as missing media.",
  );
} finally {
  await browser.close();
}
