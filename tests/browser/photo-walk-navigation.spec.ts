import { test, expect, type Page } from "@playwright/test";

async function enter(page: Page, view = "video-forest") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/#world/physarum/${view}`);
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
}

async function groundError(page: Page) {
  return page.locator(".pw-ground-link").first().evaluate((link) => {
    const image = link.closest(".pw-photo-layer")!.getBoundingClientRect();
    const marker = link.getBoundingClientRect();
    return {
      x: Math.abs(marker.x + marker.width / 2 - image.x - image.width * parseFloat(link.style.left) / 100),
      y: Math.abs(marker.y + marker.height / 2 - image.y - image.height * parseFloat(link.style.top) / 100),
    };
  });
}

test("ground directions move with the photograph and route remains a fallback", async ({ page }) => {
  await enter(page);
  await expect(page.locator(".pw-travel, .pw-path")).toHaveCount(0);
  const link = page.getByRole("button", { name: "Перейти: К мшистому пню", exact: true });
  await expect(link).toHaveClass("pw-ground-link");
  const initial = await groundError(page);
  expect(initial.x).toBeLessThan(1);
  expect(initial.y).toBeLessThan(1);
  await page.getByRole("button", { name: "Приблизить", exact: true }).click();
  await page.locator(".pw-viewport").focus();
  await page.keyboard.press("ArrowRight");
  const moved = await groundError(page);
  expect(moved.x).toBeLessThan(1);
  expect(moved.y).toBeLessThan(1);
  await link.focus();
  await expect(link).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Enter");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-moss-stump");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
  await page.getByRole("button", { name: "Открыть маршрут", exact: true }).click();
  await page.locator(".pw-map-row").filter({ hasText: "Под низкими ветвями" }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-clearing");
});

test("hint can be hidden without finding an object or leaving the scene", async ({ page }) => {
  await enter(page);
  const hint = page.getByRole("button", { name: "Подсказка", exact: true });
  await expect(hint).toHaveAttribute("aria-pressed", "false");
  await hint.click();
  await expect(page.locator(".pw-object.is-hinted")).toHaveCount(1);
  const hide = page.getByRole("button", { name: "Скрыть подсказку", exact: true });
  await expect(hide).toHaveAttribute("aria-pressed", "true");
  await hide.click();
  await expect(page.locator(".pw-object.is-hinted")).toHaveCount(0);
  await expect(hint).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 37");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-forest");
});

test("quiet scene HUD leaves the image clear and keeps reachable touch targets", async ({ page }) => {
  await enter(page, "video-clearing");
  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const footer = (await page.locator(".pw-footer").boundingBox())!;
    expect(footer.width).toBeLessThanOrEqual(48);
    expect(footer.height).toBeLessThanOrEqual(48);
    const shade = await page.locator(".pw-edge-shade").evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(shade).toBe("none");
    for (const selector of [".pw-caption", ".pw-progress", ".pw-mission-text", ".pw-instruction"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box ? box.width * box.height : 0).toBeLessThanOrEqual(1);
    }
    for (const name of ["Открыть маршрут", "Подсказка", "Приблизить", "Отдалить", "Весь кадр"]) {
      const control = page.getByRole("button", { name, exact: true });
      await expect(control).toBeInViewport({ ratio: 1 });
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  }
});
