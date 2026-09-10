import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { taxa } from "../src/data.ts";
import { woodlands } from "../src/search-data.ts";
import { stageSequence } from "../src/life-data.ts";

const output = "tmp/focused-review/current";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4173";
const evidence = [];
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => undefined)),
    );
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
}
try {
  for (const [name, width, height] of [
    ["phone", 390, 844],
    ["tablet", 1024, 768],
    ["landscape", 844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(() =>
      localStorage.setItem("mixor-entered-v2", "true"),
    );
    async function shot(label) {
      await settle(page);
      await page.screenshot({
        path: `${output}/${name}-${label}.jpg`,
        type: "jpeg",
        quality: 82,
      });
      evidence.push({
        file: `${name}-${label}.jpg`,
        url: page.url(),
        width,
        height,
      });
    }
    for (const route of ["home", "woods", "species", "tree"]) {
      await page.goto(`${base}/#${route}`);
      await shot(route);
      if (route === "tree") {
        await page
          .locator(".classification-scroll")
          .evaluate((e) => (e.scrollTop = e.scrollHeight));
        await shot("tree-bottom");
      }
    }
    for (const w of woodlands) {
      await page.goto(`${base}/#world/physarum/${w.id}`);
      await shot(`search-${w.id}-before`);
      for (const spot of w.spots)
        await page.locator(`[data-find="${spot.id}"]`).tap();
      await shot(`search-${w.id}-found`);
    }
    for (const taxon of name === "landscape" ? taxa.slice(0, 1) : taxa) {
      for (const [i, stage] of stageSequence.entries()) {
        await page.goto(`${base}/#life/${taxon.id}/${stage}`);
        await shot(`life-${taxon.id}-${i + 1}-${stage}`);
      }
    }
    for (const stage of ["division", "network"]) {
      await page.goto(`${base}/#life/physarum/${stage}`);
      await page
        .getByRole("button", { name: "Посмотреть реальные фотографии" })
        .click();
      await shot(`photo-${stage}`);
      await page.keyboard.press("Escape");
      await shot(`photo-${stage}-closed`);
    }
    if (name === "phone") {
      for (const route of ["life/didymium/division", "tree"]) {
        await page.goto(`${base}/#${route}`);
        await page.reload();
        await settle(page);
        await page.evaluate(() => {
          const values = [...document.querySelectorAll("main *")]
            .filter((e) => e.namespaceURI === "http://www.w3.org/1999/xhtml")
            .map((e) => [e, parseFloat(getComputedStyle(e).fontSize)]);
          for (const [element, font] of values)
            element.style.fontSize = `${font * 2}px`;
        });
        await shot(`large-text-${route.startsWith("life") ? "life" : "tree"}`);
      }
    }
    console.log(`Captured ${name}`);
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  `${output}/INDEX.json`,
  JSON.stringify(
    { base, createdAt: new Date().toISOString(), evidence },
    null,
    2,
  ),
);
console.log(`${evidence.length} rendered evidence frames in ${output}`);
