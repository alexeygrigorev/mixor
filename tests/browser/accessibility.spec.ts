import { test, expect } from "@playwright/test";

test("focused keyboard, photo focus return, rotation, large text and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#life/physarum/fusion");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
  const next = page.getByRole("button", {
    name: "Следующий этап",
    exact: true,
  });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/life\/physarum\/zygote$/);
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/life\/physarum\/division$/);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(next).toBeInViewport();
  expect(
    (await page.locator(".development-image .art").boundingBox())!.height,
  ).toBeGreaterThan(160);
  await page.setViewportSize(viewport);
  const peek = page.getByRole("button", {
    name: "Посмотреть реальные фотографии",
  });
  await peek.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".peek-context")).toContainText(
    "не выбранного этапа",
  );
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("dialog")),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(peek).toBeFocused();
  await expect(page).toHaveURL(/life\/physarum\/division$/);
  for (const selector of [
    ".activity-back",
    ".quiet-photo",
    ".model-note",
    ".step-button",
  ]) {
    const box = (await page.locator(selector).first().boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  await page.evaluate(() => {
    const values = [
      ...document.querySelectorAll<HTMLElement>(".development-focus *"),
    ]
      .filter((e) => e.namespaceURI === "http://www.w3.org/1999/xhtml")
      .map((e) => [e, parseFloat(getComputedStyle(e).fontSize)] as const);
    for (const [e, size] of values) e.style.fontSize = `${size * 2}px`;
  });
  await next.scrollIntoViewIfNeeded();
  await expect(next).toBeVisible();
  await page.getByRole("button", { name: "Назад к выбору вида" }).click();
  await expect(page.locator(".species-chooser")).toBeVisible();
  await page.getByRole("button", { name: "Назад на главный экран" }).click();
  await page
    .getByRole("button", { name: "Найти в лесу", exact: false })
    .click();
  await page.getByRole("button", { name: "Искать: Лесная поляна" }).click();
  const target = page.locator(".hiding-place").first();
  await target.focus();
  await page.keyboard.press("Enter");
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".search-scene [role=status]")).toContainText(
    "Badhamia polycephala",
  );
  await page.goto("/#tree");
  const group = page
    .locator("summary")
    .filter({ hasText: "Columellomycetidae" });
  await group.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Рассмотреть: Badhamia polycephala" }),
  ).toBeHidden();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Рассмотреть: Badhamia polycephala" })
    .click();
  await expect(page).toHaveURL(/portrait\/physarum/);
});

test("journal action remains named, touch-sized and keyboard accessible", async ({
  page,
}) => {
  await page.goto("/#journal");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
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
  const first = page.getByRole("button", {
    name: "К первому открытию",
    exact: true,
  });
  await first.focus();
  expect(await first.evaluate((e) => getComputedStyle(e).outlineColor)).toBe(
    "rgb(32, 63, 43)",
  );
});
