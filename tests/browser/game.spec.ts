import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
}
async function shot(page: Page, info: TestInfo, name: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => undefined)),
    );
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mkdir("tmp/redesign-review", { recursive: true });
  await page.screenshot({
    path: `tmp/redesign-review/round1-${info.project.name}-${name}.png`,
  });
}
async function inViewport(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth + 1 &&
        document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
}

test("observe a real photo, save an educational discovery and revisit after reload", async ({
  page,
}, info) => {
  await start(page);
  await page.goto("/#portrait/physarum/spore");
  await page
    .getByRole("button", { name: "Сделать открытие", exact: true })
    .click();
  await expect(page.locator(".photo-zoom img")).toBeVisible();
  await page.getByRole("button", { name: "Иллюстрация", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Записать открытие", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Не различаю", exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Сделать открытие", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Увеличить фото", exact: true })
    .click();
  await page.getByRole("button", { name: "Не различаю", exact: true }).click();
  await shot(page, info, "observation");
  await page
    .getByRole("button", { name: "Записать открытие", exact: true })
    .click();
  await expect(page.locator(".discovery-page")).toContainText("Не различаю");
  await page.reload();
  await page.locator(".journal-entry").click();
  await expect(page.locator(".discovery-page")).toContainText(
    "Это тоже наблюдение",
  );
  await shot(page, info, "saved-discovery");
  const count = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("mixor-journey-v2")!).discoveries.length,
  );
  expect(count).toBe(1);
  await inViewport(page);
});

test("native dialog, originals persisted, rotation", async ({
  page,
}, info) => {
  await start(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot(page, info, "settings");
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("dialog")),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Настройки", exact: true }),
  ).toBeFocused();
  await page.goto("/#journal");
  await page
    .getByRole("button", { name: "Добавить свою находку", exact: true })
    .click();
  await page
    .getByLabel("Как назовём находку?")
    .fill("Синтетическая тестовая находка");
  await page
    .getByLabel("Что заметили?")
    .fill("Только тест. Не настоящая семейная запись.");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/YQAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "synthetic-pixel.png",
    mimeType: "image/png",
    buffer: png,
  });
  const viewport = page.viewportSize()!;
  await page.setViewportSize({
    width: viewport.height,
    height: viewport.width,
  });
  await expect(page.getByLabel("Как назовём находку?")).toHaveValue(
    "Синтетическая тестовая находка",
  );
  await page
    .getByRole("button", { name: "Сохранить на устройстве", exact: true })
    .click();
  await page.setViewportSize(viewport);
  await expect(page.locator(".own-observation")).toContainText(
    "Синтетическая тестовая находка",
  );
  await page.reload();
  await expect(page.locator(".own-observation")).toContainText(
    "Синтетическая тестовая находка",
  );
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("mixor-local-demo", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const records: any[] = await new Promise((resolve, reject) => {
      const req = db
        .transaction("observations")
        .objectStore("observations")
        .getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return {
      blob: records[0].photos[0].blob instanceof Blob,
      size: records[0].photos[0].blob.size,
      type: records[0].photos[0].blob.type,
    };
  });
  expect(stored).toEqual({ blob: true, size: png.length, type: "image/png" });
  await inViewport(page);
});

test("silent by default, real audio decoding, mute pauses every track, failures stay playable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    (window as any).__played = [];
    HTMLMediaElement.prototype.play = function () {
      if (!(window as any).__played.includes(this))
        (window as any).__played.push(this);
      return original.call(this);
    };
  });
  await start(page);
  expect(await page.evaluate(() => (window as any).__played.length)).toBe(0);
  await page
    .getByRole("button", { name: "Включить звук", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).__played.filter(
            (a: HTMLAudioElement) =>
              a.currentTime > 0 && a.readyState >= 2 && !a.paused,
          ).length,
      ),
    )
    .toBe(3);

  await page
    .getByRole("button", { name: "Выключить звук", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      (window as any).__played.every((a: HTMLAudioElement) => a.paused),
    ),
  ).toBe(true);
  await page.route("**/assets/art/organisms-v2.webp", (route) => route.abort());
  await page.goto("/#portrait/physarum/spore");
  await expect(
    page.getByText("Иллюстрация недоступна. Можно открыть настоящее фото."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Настоящее фото", exact: true })
    .click();
  await expect(page.locator(".photo-zoom img")).toBeVisible();
});

test("a refused local write never claims success and keeps the form", async ({
  page,
}) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException(
        "Недостаточно места. Запись не сохранена.",
        "QuotaExceededError",
      );
    };
  });
  await start(page);
  await page.goto("/#journal");
  await page
    .getByRole("button", { name: "Добавить свою находку", exact: true })
    .click();
  await page
    .getByLabel("Как назовём находку?")
    .fill("Несохранённый тестовый черновик");
  await page
    .getByRole("button", { name: "Сохранить на устройстве", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("не сохранена");
  await expect(page.getByLabel("Как назовём находку?")).toHaveValue(
    "Несохранённый тестовый черновик",
  );
  await expect(page.getByRole("dialog")).toBeVisible();
});
