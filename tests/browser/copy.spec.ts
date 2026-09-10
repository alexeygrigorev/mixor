import { test, expect } from "@playwright/test";

test("five requested boilerplate notes stay removed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  const notices = [
    "Рисованный мир · настоящие фотографии внутри",
    "Учебные реконструкции, не съёмка одного экземпляра.",
    "Ветви классификации, не стадии развития.",
    "При скрытии вкладки звук приостанавливается.",
    "Учебная иллюстрация · создана с ИИ · без масштаба",
  ];
  for (const [route, screen] of [
    ["/#home", ".activity-home"],
    ["/#species", ".species-chooser"],
    ["/#tree", ".classification-scene"],
    ["/#portrait/arcyria", ".portrait-scene"],
  ]) {
    await page.goto(route);
    await expect(page.locator(screen)).toBeVisible();
    for (const notice of notices)
      await expect(page.getByText(notice, { exact: false })).toHaveCount(0);
  }
  await page.goto("/#home");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(notices[3], { exact: false })).toHaveCount(0);
});
