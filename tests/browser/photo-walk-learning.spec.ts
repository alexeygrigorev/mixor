import { test, expect } from "@playwright/test";

const groups = [
  { id: "slope-myxomycete", title: "Миксомицет", facts: /плазмодий|плазмодия/, source: "rhs.org.uk" },
  { id: "slope-lichen", title: "Лишайник", facts: /симбиозом/, source: "anbg.gov.au" },
  { id: "slope-fungus", title: "Небольшой гриб", facts: /грибниц/, source: "kew.org" },
  { id: "slope-woodlouse", title: "Мокрица", facts: /семь пар/, source: "nhm.ac.uk" },
];

for (const group of groups) {
  test(`discovery teaches about ${group.title} and returns to the same forest`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#world/physarum/video-forest");
    await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
    await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
    const target = page.locator(`[data-object="${group.id}"]`);
    await target.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Найдена деталь" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: group.title, exact: true })).toBeVisible();
    await expect(dialog.locator(".pw-object-kind")).toHaveText("ИГРОВОЙ РИСУНОК");
    await expect(dialog).toContainText(group.facts);
    await expect(dialog.locator(".pw-learning-facts li")).toHaveCount(3);
    await expect(dialog.locator(".pw-object-question")).not.toBeEmpty();
    await expect(dialog).not.toContainText("Иллюстрация для игры. Вид и присутствие в исходном видео не подтверждены.");
    await expect(dialog).not.toContainText("Условная игровая иллюстрация");
    const sources = dialog.locator(".pw-learning-sources");
    await sources.locator("summary").click();
    const links = sources.getByRole("link");
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    const urls = [];
    for (const link of await links.all()) {
      const href = await link.getAttribute("href");
      const url = new URL(href!);
      expect(url.protocol).toBe("https:");
      expect(await link.innerText()).not.toBe("");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
      urls.push(url.hostname);
    }
    expect(urls.some((host) => host === group.source || host.endsWith(`.${group.source}`))).toBe(true);
    await dialog.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-forest");
    await expect(target).toHaveAttribute("aria-pressed", "true");
    await expect(target).toBeFocused();
    await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 37");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
    await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 37");
  });
}

test("related myxomycete atlas link returns to its originating stop with the find preserved", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#world/physarum/video-moss-stump");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
  const target = page.locator('[data-object="moss-myxomycete"]');
  await target.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").getByRole("button", { name: "Другой миксомицет: живая сеть", exact: true }).click();
  await expect(page.locator(".portrait-scene")).toBeVisible();
  await expect(page.locator(".portrait-identity h1")).toHaveText("Badhamia polycephala");
  await page.getByRole("button", { name: "Назад: Лесная прогулка", exact: true }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-moss-stump");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 37");
  await page.reload();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-moss-stump");
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 37");
});
