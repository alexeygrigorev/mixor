import { test, expect } from "@playwright/test";
import { pineWalkViews } from "../../src/photo-walk-pine";

test("320px full-frame overview keeps all 36 pine frames, arrows and discoveries separately tappable", async ({ page }) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-muted", "true");
  });
  for (const view of pineWalkViews) {
    await page.goto(`/#world/physarum/${view.id}`);
    await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", view.id);
    await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
    if (await page.locator(".pw-viewport").getAttribute("data-overview") !== "true") {
      await page.getByRole("button", { name: "Весь кадр", exact: true }).click();
    }
    await expect(page.locator(".pw-viewport")).toHaveAttribute("data-overview", "true");
    const targets = page.locator(".pw-ground-link, .pw-object");
    for (const target of await targets.all()) {
      const result = await target.evaluate(node => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return { reachable: hit === node || (hit !== null && node.contains(hit)),
          label: node.getAttribute("aria-label"), blocker: hit?.closest("button")?.getAttribute("aria-label") };
      });
      expect(result.reachable, `${view.id}: ${result.label} blocked by ${result.blocker}`).toBe(true);
    }
    const arrowBoxes = await page.locator(".pw-ground-link").evaluateAll(nodes => nodes.map(node => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }));
    if (arrowBoxes.length === 2) {
      const [a, b] = arrowBoxes;
      expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y,
        `${view.id}: direction touch targets overlap`).toBe(true);
    }
  }
});
