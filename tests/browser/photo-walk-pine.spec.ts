import { test, expect, type Page } from "@playwright/test";
import { pineWalkViews } from "../../src/photo-walk-pine";

async function enter(page: Page, id = "pine-01") {
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-muted", "true");
  });
  await page.goto(`/#world/physarum/${id}`);
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", id);
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
}
async function travel(page: Page, id: string) {
  const target = page.locator(`.pw-ground-link[data-destination="${id}"]`);
  await target.focus();
  await expect(target).toBeInViewport({ ratio: .999 });
  await target.tap();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", id);
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
}

test("three walks remain selectable on phone, desktop and short landscape", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  await page.getByRole("button", { name: "Найти в лесу", exact: false }).click();
  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const title of ["Лесная прогулка", "Светлый лес", "Сосновый бор"]) {
      const target = page.getByRole("button", { name: `Искать: ${title}`, exact: true });
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeInViewport();
    }
    await page.screenshot({ path: info.outputPath(`three-walks-${viewport.width}.png`) });
  }
  await page.getByRole("button", { name: "Искать: Сосновый бор", exact: true }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "pine-01");
});

test("all 36 second-recording frames travel both ways, including retained people and bags", async ({ page }, info) => {
  // A 36-frame forward/back route plus screenshots exceeds three minutes
  // in mobile WebKit. Keep every per-step timeout and real tap assertion.
  test.setTimeout(300000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  for (const [index, view] of pineWalkViews.entries()) {
    if (index) await travel(page, view.id);
    await expect(page.locator(".pw-image")).toHaveAttribute("src", view.image);
    await expect(page.locator(".pw-object")).toHaveCount(view.objects.length);
    if (!view.objects.length) await expect(page.locator(".pw-hint")).toBeHidden();
    for (const object of view.objects) {
      const target = page.locator(`[data-object="${object.id}"]`);
      await target.focus(); await target.tap();
      await expect(page.getByRole("dialog")).toContainText("ИГРОВОЙ РИСУНОК");
      await page.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
      await expect(target).toHaveAttribute("aria-pressed", "true");
    }
    await page.screenshot({ path: info.outputPath(`${view.id}.png`) });
  }
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 6 / 35");
  for (const view of pineWalkViews.slice(0, -1).reverse()) await travel(page, view.id);
  await expect(page.locator(".pw-counter")).toHaveText("36 / 70 мест");
  await page.reload();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "pine-01");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 6 / 35");
  await travel(page, "october-28");
  await travel(page, "pine-01");
  expect(errors).toEqual([]);
});

test("new route uses 36 small previews and permits only actually visited map stops", async ({ page }) => {
  await enter(page, "pine-34");
  await travel(page, "pine-35");
  await page.getByRole("button", { name: "Открыть маршрут", exact: true }).click();
  await expect(page.locator(".pw-map-row")).toHaveCount(70);
  await expect(page.locator('.pw-map-row img[src*="scene-09/thumbs/"]')).toHaveCount(36);
  await expect(page.locator('.pw-map-row:not(:disabled)')).toHaveCount(2);
});

test("second recording can recover from an unavailable adjacent image without losing a find", async ({ page }) => {
  await page.route("**/assets/scene-09/view-02.webp", route => route.abort());
  await enter(page);
  const object = page.locator('[data-object="pine-01-myxomycete"]');
  await object.focus(); await object.tap();
  await page.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
  const arrow = page.locator('.pw-ground-link[data-destination="pine-02"]');
  await arrow.focus(); await arrow.tap();
  await expect(page.locator(".pw-status")).toContainText("Кадр не загрузился");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "pine-01");
  await expect(object).toHaveAttribute("aria-pressed", "true");
  await page.unroute("**/assets/scene-09/view-02.webp");
  await page.locator(".pw-status button").click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "pine-02");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 35");
});
