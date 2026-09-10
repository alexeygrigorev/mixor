import { test, expect } from "@playwright/test";

test("stage changes reset explanation scroll; journal action is named and touch-sized", async ({
  page,
}) => {
  await page.goto("/#life/physarum/spore");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
  await page.locator(".stage-notes").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await expect(page).toHaveURL(/life\/physarum\/cells$/);
  expect(
    await page.locator(".stage-notes").evaluate((element) => element.scrollTop),
  ).toBe(0);
  await page.locator(".stage-notes").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.goBack();
  await expect(page).toHaveURL(/life\/physarum\/spore$/);
  expect(
    await page.locator(".stage-notes").evaluate((element) => element.scrollTop),
  ).toBe(0);
  await page.getByRole("button", { name: "Журнал", exact: true }).click();
  const add = page.getByRole("button", {
    name: "Добавить свою находку",
    exact: true,
  });
  const bounds = (await add.boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(48);
  expect(bounds.height).toBeGreaterThanOrEqual(48);
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Новая находка" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "К первому открытию", exact: true })
    .focus();
  const outline = await page
    .getByRole("button", { name: "К первому открытию", exact: true })
    .evaluate((element) => getComputedStyle(element).outlineColor);
  expect(outline).toBe("rgb(32, 63, 43)");
});
