import { test, expect, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
}

test("scene 07 hides and reveals illustrated forest details without changing the video frame", async ({ page }, testInfo) => {
  await start(page);
  await page.getByRole("button", { name: "Найти в лесу", exact: false }).click();
  await page.getByRole("button", { name: "Искать: Лесная прогулка", exact: true }).click();

  await expect(page.locator('.photo-walk-scene[data-view="video-forest"]')).toBeVisible();
  await expect(page.locator(".pw-object")).toHaveCount(4);
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");
  await page.getByRole("button", { name: "Весь кадр", exact: true }).click();

  const first = page.locator(".pw-object").first();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(first).toHaveAccessibleName(/Найти:/);
  await page.screenshot({ path: testInfo.outputPath("scene-07-hidden.png") });
  await first.tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Иллюстрация для игры");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");
  await page.screenshot({ path: testInfo.outputPath("scene-07-found-dialog.png") });

  await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
  await expect(first).toBeFocused();
  await first.tap();
  await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");

  await page.getByRole("button", { name: "Перейти: К мшистому пню", exact: true }).tap();
  await expect(page.locator('.photo-walk-scene[data-view="video-moss-stump"]')).toBeVisible();
  await expect(page.locator(".pw-object")).toHaveCount(3);
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");
  await expect(page.locator(".pw-image")).toHaveAttribute("src", /moss-stump\.webp/);
  await expect(page.locator(".pw-arrow")).toHaveCount(0);
});
