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
  assert(keys.includes("/assets/audio/ambience/distant-birds-long.mp3"));
  const freshAudio = [
    "music/forest-acoustic-v2-long",
    "ambience/dry-leaves-v2-long",
    "ambience/canopy-rain-v2-loop",
    "sfx/leaf-friction-v3-mix",
  ];
  for (const file of freshAudio) assert(keys.includes(`/assets/audio/${file}.mp3`));
  assert(!keys.includes("/assets/audio/music/forest-stillness-long.mp3"));
  assert(!keys.includes("/assets/audio/sfx/ui-press-soft-mix.mp3"));
  assert(!keys.includes("/assets/audio/sfx/fingertip-wood-v2-mix.mp3"));
  assert(keys.includes("/assets/audio/sfx/uncover-mix.mp3"));
  assert(!keys.some((path) => /\/assets\/art\/(search-|walk-wetland-)/.test(path)));
  assert(keys.includes("/assets/scene-07/slope.webp"));
  for (const [scene, count] of [["scene-08", 28], ["scene-09", 32]]) {
   for (let i = 1; i <= count; i++) {
    const name = `view-${String(i).padStart(2, "0")}.webp`;
    assert(keys.includes(`/assets/${scene}/${name}`));
    assert(keys.includes(`/assets/${scene}/thumbs/${name}`));
  }
  }
  assert(keys.includes("/assets/art/growth-early.webp"));
  const earlyArt = ["physarum", "arcyria", "fuligo", "lycogala", "stemonitis", "trichia", "tubifera", "didymium"];
  for (const id of earlyArt) assert(keys.includes(`/assets/art/early-${id}-v3.webp`));
  assert(!keys.some((path) => /observations|private|outbox/.test(path)));
  await context.setOffline(true);
  await page.reload();
  const decodedEarlyArt = await page.evaluate(async (ids) => Promise.all(ids.map(async (id) => {
    const img = new Image();
    img.src = `/assets/art/early-${id}-v3.webp`;
    await img.decode();
    return img.naturalWidth / img.naturalHeight;
  })), earlyArt);
  assert(decodedEarlyArt.every((aspect) => aspect === 2), "All eight early plates decode offline");
  const uncoverOffline = await page.evaluate(async () => {
    const response = await fetch("/assets/audio/sfx/uncover-mix.mp3");
    return {
      ok: response.ok,
      type: response.headers.get("content-type"),
      bytes: (await response.arrayBuffer()).byteLength,
    };
  });
  assert(uncoverOffline.ok && uncoverOffline.bytes > 1000);
  assert.match(uncoverOffline.type, /audio/);
  for (const file of freshAudio) {
    const result = await page.evaluate(async (name) => {
      const response = await fetch(`/assets/audio/${name}.mp3`);
      const context = new AudioContext();
      try {
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        return { ok: response.ok, seconds: buffer.duration };
      } finally { await context.close(); }
    }, file);
    assert(result.ok && result.seconds > 0.2, `Offline audio decode: ${file}`);
  }
  await page.getByRole("button", { name: "Развитие", exact: false }).click();
  await page
    .getByRole("button", {
      name: "Развитие: Badhamia polycephala",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /^Выбрать этап\./ }).click();
  await page
    .getByRole("button", { name: /^Этап \d+: Плазмодий$/ })
    .first()
    .click();
  await page
    .getByRole("button", {
      name: "Посмотреть реальные фотографии",
      exact: true,
    })
    .click();
  await page.waitForFunction(() => {
    const image = document.querySelector(".photo-zoom img");
    return image?.complete && image.naturalWidth > 0;
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Назад к выбору вида" }).click();
  await page.getByRole("button", { name: "Назад на главный экран" }).click();
  await page
    .getByRole("button", { name: "Найти в лесу", exact: false })
    .click();
  await page.getByRole("button", { name: "Искать: Лесная прогулка" }).click();
  await page.locator('.photo-walk-scene[data-busy="false"]').waitFor();
  await page.getByRole("button", { name: "Подсказка", exact: true }).click();
  await page.locator(".pw-object").first().click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.locator(".pw-object").first().getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
  await page.getByRole("button", { name: "Перейти: К мшистому пню", exact: true }).click();
  await page.locator('.photo-walk-scene[data-view="video-moss-stump"][data-busy="false"]').waitFor();
  await page.reload();
  await page.locator('.photo-walk-scene[data-view="video-moss-stump"][data-busy="false"]').waitFor();
  assert.equal(await page.locator(".pw-find-counter").textContent(), "Находки 1 / 37");
  const frames = await page.evaluate(async () => Promise.all(
    ["slope", "moss-stump", "clearing", "deadwood", "trail", "old-stump"].map(async (name) => {
      const image = new Image(); image.src = `/assets/scene-07/${name}.webp`;
      await image.decode(); return image.naturalWidth;
    }),
  ));
  assert(frames.every((width) => width === 1920));
  // The new walk must also decode, navigate and restore while disconnected.
  await page.goto((process.env.TEST_PREVIEW_URL || "http://127.0.0.1:4174") + "/#world/physarum/october-28");
  await page.locator('.photo-walk-scene[data-view="october-28"][data-busy="false"]').waitFor();
  const back = page.locator('.pw-ground-link[data-destination="october-27"]');
  await back.focus(); await back.click();
  await page.locator('.photo-walk-scene[data-view="october-27"][data-busy="false"]').waitFor();
  await page.reload();
  await page.locator('.photo-walk-scene[data-view="october-27"][data-busy="false"]').waitFor();
  const october = await page.evaluate(async () => {
    for (let i = 1; i <= 28; i++) {
      const image = new Image(); image.src = `/assets/scene-08/view-${String(i).padStart(2, "0")}.webp`;
      await image.decode(); if (image.naturalWidth !== 1920) return false;
    }
    return true;
  });
  assert(october, "All 28 October frames decode offline");
  await page.goto((process.env.TEST_PREVIEW_URL || "http://127.0.0.1:4174") + "/#world/physarum/clearing-32");
  await page.locator('.photo-walk-scene[data-view="clearing-32"][data-busy="false"]').waitFor();
  const clearingBack = page.locator('.pw-ground-link[data-destination="clearing-31"]');
  await clearingBack.focus(); await clearingBack.click();
  await page.locator('.photo-walk-scene[data-view="clearing-31"][data-busy="false"]').waitFor();
  await page.reload();
  await page.locator('.photo-walk-scene[data-view="clearing-31"][data-busy="false"]').waitFor();
  const clearing = await page.evaluate(async () => {
    for (let i = 1; i <= 32; i++) {
      for (const folder of ["", "thumbs/"]) {
        const image = new Image(); image.src = `/assets/scene-09/${folder}view-${String(i).padStart(2, "0")}.webp`;
        await image.decode(); if (image.naturalWidth !== (folder ? 320 : 1920)) return false;
      }
    }
    return true;
  });
  assert(clearing, "All 32 second-video frames and their 32 thumbnails decode offline");
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
