import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { taxa } from "../../src/data";
import { stageSequence } from "../../src/life-data";

test("every species loads its own eight early frames and retains all eleven development steps", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const output = `tmp/early-art-review/${testInfo.project.name}`;
  await mkdir(output, { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mixor-entered-v2", "true"));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const sources = new Set<string>();
  for (const taxon of taxa) {
    const frames = new Set<string>();
    for (const [index, stage] of stageSequence.entries()) {
      await page.goto(`/#life/${taxon.id}/${stage}`);
      const art = page.locator(".development-image .art");
      const img = art.locator("img");
      await expect(img).toBeVisible();
      await img.evaluate((element: HTMLImageElement) => element.decode());
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".stage-position")).toHaveText(`${index + 1} / 11`);
      if (index < 8) {
        const path = `/assets/art/early-${taxon.id}-v3.webp`;
        await expect(img).toHaveAttribute("src", path);
        sources.add(path);
        const tile = await art.evaluate((element) => ({
          columns: element.style.getPropertyValue("--columns"),
          column: element.style.getPropertyValue("--column"),
          row: element.style.getPropertyValue("--row"),
          aspect: element.style.getPropertyValue("--tile-aspect"),
        }));
        expect(tile).toEqual({ columns: "4", column: `${index % 4}`, row: `${Math.floor(index / 4)}`, aspect: "1" });
        frames.add(JSON.stringify(tile));
        await art.screenshot({ path: `${output}/${taxon.id}-${index + 1}-${stage}-art.png` });
      } else {
        await expect(img).toHaveAttribute("src", `/assets/art/growth-${stage === "network" ? "networks" : stage === "forming" ? "forming" : "mature"}.webp`);
      }
      await page.screenshot({ path: `${output}/${taxon.id}-${index + 1}-${stage}.png` });
    }
    expect(frames.size).toBe(8);
  }
  expect(sources.size).toBe(8);
  expect(errors).toEqual([]);
});
