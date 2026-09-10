import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const output = "tmp/focused-review/weather";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const report = [];
try {
  for (const [name, width, height] of [
    ["phone", 390, 844], ["tablet", 1024, 768], ["landscape", 844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: true,
      recordVideo: { dir: output, size: { width, height } },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("mixor-entered-v2", "true"));
    await page.goto("http://127.0.0.1:4173/#world/physarum/roots");
    await page.locator(".hiding-place").first().waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    });
    await page.waitForTimeout(1500);
    const before = await page.locator(".rain-streaks > span").first().evaluate((e) => getComputedStyle(e).transform);
    await page.waitForTimeout(700);
    const after = await page.locator(".rain-streaks > span").first().evaluate((e) => getComputedStyle(e).transform);
    await page.screenshot({ path: `${output}/${name}-rain.png` });
    await page.locator(".hiding-place").first().tap();
    await page.locator(".hiding-place").first().tap();
    await page.locator(".portrait-scene").waitFor();
    await page.screenshot({ path: `${output}/${name}-discovery.png` });
    await page.getByRole("button", { name: "Назад: Мшистый берег", exact: true }).tap();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await page.locator(".rain-streaks > span").first().evaluate((e) => getComputedStyle(e).animationName);
    await page.screenshot({ path: `${output}/${name}-rain-reduced.png` });
    await page.getByRole("button", { name: "Предыдущее место: Под листвой" }).tap();
    const dryDrops = await page.locator(".rain-streaks").count();
    await page.screenshot({ path: `${output}/${name}-dry.png` });
    const video = page.video();
    await context.close();
    await video.saveAs(`${output}/${name}-rain-and-discovery.webm`);
    if (before === after || reduced !== "none" || dryDrops !== 0 || errors.length) {
      throw new Error(`${name}: weather/console regression ${JSON.stringify({ before, after, reduced, dryDrops, errors })}`);
    }
    report.push({ name, width, height, animated: before !== after, reduced, dryDrops, errors });
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/REPORT.json`, JSON.stringify(report, null, 2));
console.log("Weather motion, reduced-motion stills, discovery and dry return captured at three viewports.");
