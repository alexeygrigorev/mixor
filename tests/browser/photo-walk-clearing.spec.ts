import { test, expect, type Page } from "@playwright/test";
import { clearingWalkViews } from "../../src/photo-walk-clearing";

async function enter(page: Page, id = "clearing-01") {
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-muted", "true");
  });
  await page.goto(`/#world/physarum/${id}`);
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", id);
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
}
async function travel(page: Page, id: string) {
  const arrow = page.locator(`.pw-ground-link[data-destination="${id}"]`);
  await arrow.focus();
  // Chromium's intersection ratio can be 0.99999946 for a fully visible
  // transformed button. Allow subpixel rounding, but still require a real tap.
  await expect(arrow).toBeInViewport({ ratio: 0.999 });
  await arrow.tap();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", id);
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
}

test("the new walk is selectable beside the original, including on a small phone", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  await page.getByRole("button", { name: "Найти в лесу", exact: false }).click();
  for (const size of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size);
    const original = page.getByRole("button", { name: "Искать: Лесная прогулка", exact: true });
    const october = page.getByRole("button", { name: "Искать: Тихая поляна", exact: true });
    await expect(original).toBeVisible(); await expect(october).toBeVisible();
    await october.scrollIntoViewIfNeeded();
    await expect(october).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`chooser-${size.width}.png`) });
  }
  await page.getByRole("button", { name: "Искать: Тихая поляна", exact: true }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "clearing-01");
});

test("all 32 new frames navigate forward and back with all eight finds preserved", async ({ page }, info) => {
  test.setTimeout(150000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  let found = 0;
  for (const [index, view] of clearingWalkViews.entries()) {
    if (index) await travel(page, view.id);
    await expect(page.locator(".pw-image")).toHaveAttribute("src", view.image);
    await expect(page.locator(".pw-object")).toHaveCount(view.objects.length);
    if (!view.objects.length) {
      await expect(page.locator(".pw-hint")).toBeDisabled();
      await expect(page.locator(".pw-hint")).toBeHidden();
    }
    for (const object of view.objects) {
      const target = page.locator(`[data-object="${object.id}"]`);
      await target.focus(); await target.tap();
      await expect(page.getByRole("dialog")).toContainText("ИГРОВОЙ РИСУНОК");
      await page.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
      await expect(target).toHaveAttribute("aria-pressed", "true");
      found++;
    }
    await page.screenshot({ path: info.outputPath(`${view.id}.png`) });
  }
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 8 / 37");
  for (const view of clearingWalkViews.slice(0, -1).reverse()) await travel(page, view.id);
  await expect(page.locator(".pw-counter")).toHaveText("32 / 66 мест");
  await page.reload();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "clearing-01");
  await expect(page.locator(".pw-find-counter")).toHaveText(`Находки ${found} / 37`);
  await travel(page, "october-28");
  await travel(page, "clearing-01");
});

test("new route keeps real-image anchored arrows, map thumbnails and a stationary opacity fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enter(page, "clearing-14");
  const animations: { duration: number; keys: string[] }[] = [];
  await page.exposeFunction("recordWalkAnimation", (event: typeof animations[number]) => animations.push(event));
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      void (window as unknown as { recordWalkAnimation: (e: unknown) => Promise<void> }).recordWalkAnimation({
        duration: typeof options === "object" ? options?.duration : options,
        keys: Array.isArray(frames) ? Object.keys(frames[0]) : Object.keys(frames || {}),
      });
      return animate.call(this, frames, options);
    };
  });
  await travel(page, "clearing-15");
  expect(animations.some(item => item.duration === 240 && item.keys.join() === "opacity")).toBe(true);
  await page.getByRole("button", { name: "Открыть маршрут", exact: true }).click();
  await expect(page.locator(".pw-map-row")).toHaveCount(66);
  await expect(page.locator('.pw-map-row img[src*="scene-09/thumbs/"]')).toHaveCount(32);
  await expect(page.locator('.pw-map-row:not(:disabled)')).toHaveCount(2);
});

test("a failed adjacent frame leaves the old view usable and can be retried", async ({ page }) => {
  await page.route("**/assets/scene-09/view-02.webp", route => route.abort());
  await enter(page);
  const arrow = page.locator('.pw-ground-link[data-destination="clearing-02"]');
  await arrow.focus(); await arrow.click();
  await expect(page.locator(".pw-status")).toContainText("Кадр не загрузился");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "clearing-01");
  await page.unroute("**/assets/scene-09/view-02.webp");
  await page.locator(".pw-status button").click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "clearing-02");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
});
