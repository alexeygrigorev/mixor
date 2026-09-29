import { test, expect, type Page } from "@playwright/test";
import { photoWalkViews } from "../../src/photo-walk-data";

async function startWalk(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  await page.getByRole("button", { name: "Найти в лесу", exact: false }).click();
  await page.getByRole("button", { name: "Искать: Лесная прогулка", exact: true }).click();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-forest");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
}

async function bounds(page: Page) {
  return page.locator(".pw-viewport").evaluate((viewport) => {
    const frame = viewport.getBoundingClientRect();
    const photo = viewport.querySelector(".pw-surface")!.getBoundingClientRect();
    return {
      frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height },
      photo: { x: photo.x, y: photo.y, width: photo.width, height: photo.height },
      covers: photo.left <= frame.left + 1 && photo.top <= frame.top + 1
        && photo.right >= frame.right - 1 && photo.bottom >= frame.bottom - 1,
    };
  });
}

async function drag(page: Page, from: { x: number; y: number }, dx: number, dy = 0) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 12 });
  await page.mouse.up();
}

test("forest fills the screen and dragging an object explores without finding it", async ({ page }, testInfo) => {
  await startWalk(page);
  const viewport = page.viewportSize()!;
  await expect.poll(async () => (await bounds(page)).covers).toBe(true);
  const initial = await bounds(page);
  expect(initial.frame.width).toBeGreaterThanOrEqual(viewport.width - 2);
  expect(initial.frame.height).toBeGreaterThanOrEqual(viewport.height - 2);
  await page.screenshot({ path: testInfo.outputPath("walk-fill.png") });

  // Magnification guarantees room to pan in portrait and landscape alike.
  await page.getByRole("button", { name: "Приблизить", exact: true }).click();
  const object = page.locator(".pw-object").first();
  await object.focus();
  const box = await object.boundingBox();
  expect(box).not.toBeNull();
  const before = await bounds(page);
  await drag(page, { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }, -100);
  await expect.poll(async () => Math.abs((await bounds(page)).photo.x - before.photo.x)).toBeGreaterThan(40);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");

  // Repeated gestures reach both edges without exposing empty space.
  for (const dx of [-viewport.width + 80, viewport.width - 80]) {
    for (let index = 0; index < 5; index++) {
      const x = dx < 0 ? viewport.width - 40 : 40;
      await drag(page, { x, y: viewport.height / 2 }, dx);
      await expect.poll(async () => (await bounds(page)).covers).toBe(true);
    }
  }
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const explored = (await bounds(page)).photo;
  const overview = page.getByRole("button", { name: "Весь кадр", exact: true });
  await overview.click();
  await expect(overview).toHaveAttribute("aria-pressed", "true");
  const wholePhoto = (await bounds(page)).photo;
  expect(wholePhoto.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(wholePhoto.height).toBeLessThanOrEqual(viewport.height + 1);
  await overview.click();
  await expect(overview).toHaveAttribute("aria-pressed", "false");
  const returned = (await bounds(page)).photo;
  expect(returned.x).toBeCloseTo(explored.x, 1);
  expect(returned.y).toBeCloseTo(explored.y, 1);
  expect(returned.width).toBeCloseTo(explored.width, 1);
  await page.screenshot({ path: testInfo.outputPath("walk-panned.png") });
});

test("touch swipe pans the photograph without activating its discovery", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Native touch dispatch uses Chromium's CDP; pointer drag also runs in WebKit.");
  await startWalk(page);
  await page.getByRole("button", { name: "Приблизить", exact: true }).click();
  const object = page.locator(".pw-object").first();
  await object.focus();
  const box = (await object.boundingBox())!;
  const before = await bounds(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 10; step++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 12 * step, y }] });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => Math.abs((await bounds(page)).photo.x - before.photo.x)).toBeGreaterThan(40);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");

  const viewport = page.viewportSize()!;
  const centre = { x: viewport.width / 2, y: viewport.height / 2 };
  const widthBeforePinch = (await bounds(page)).photo.width;
  const touches = (distance: number) => [
    { id: 0, x: centre.x - distance, y: centre.y },
    { id: 1, x: centre.x + distance, y: centre.y },
  ];
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touches(35) });
  for (let step = 1; step <= 8; step++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touches(35 + step * 6) });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
  await expect.poll(async () => (await bounds(page)).photo.width).toBeGreaterThan(widthBeforePinch * 1.15);
  await expect.poll(async () => (await bounds(page)).covers).toBe(true);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");
});

test("all six real stops remain reachable through anchored travel controls", async ({ page }, testInfo) => {
  // This full walk opens 21 discoveries, traverses ten paths and checks reload.
  test.setTimeout(90000);
  if (testInfo.project.name === "tablet") await page.setViewportSize({ width: 1440, height: 900 });
  await startWalk(page);
  const path = [
    "video-moss-stump", "video-clearing", "video-deadwood", "video-clearing",
    "video-trail", "video-old-stump", "video-trail", "video-clearing", "video-moss-stump", "video-forest",
  ];
  const collected = new Set<string>();
  let totalFound = 0;
  for (const destination of path) {
    const scene = page.locator(".photo-walk-scene");
    const id = await scene.getAttribute("data-view");
    const view = photoWalkViews.find((candidate) => candidate.id === id)!;
    if (!collected.has(view.id)) {
      for (const object of view.objects) {
        const target = page.locator(`.pw-object[data-object="${object.id}"]`);
        await target.focus();
        await target.tap();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
        await expect(target).toBeFocused();
        totalFound++;
        await expect(page.locator(".pw-find-counter")).toHaveText(`Находки ${totalFound} / 21`);
      }
      collected.add(view.id);
      await expect(page.getByRole("button", { name: "Подсказка", exact: true, includeHidden: true })).toBeDisabled();
    }
    const link = view.links.find((candidate) => candidate.to === destination)!;
    const control = page.locator(".pw-ground-nav").getByRole("button", { name: `Перейти: ${link.label}`, exact: true });
    await control.focus();
    await expect(control).toBeInViewport({ ratio: 1 });
    const box = (await control.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    await control.tap();
    await expect(scene).toHaveAttribute("data-view", destination);
    await expect(scene).toHaveAttribute("data-busy", "false");
    await expect.poll(async () => (await bounds(page)).covers).toBe(true);
  }
  await expect(page.locator(".pw-arrow")).toHaveCount(0);
  await expect(page.locator(".pw-counter")).toHaveText("6 / 6 мест");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 21 / 21");
  await expect(page.locator(".pw-mission-text")).toHaveText("Все детали найдены. Лес можно исследовать снова.");
  // The compact HUD puts visible per-stop progress inside the route dialog.
  await page.getByRole("button", { name: "Открыть маршрут", exact: true }).click();
  for (const view of photoWalkViews) {
    await expect(page.locator(".pw-map-row").filter({ hasText: view.title }))
      .toContainText(`Детали ${view.objects.length} / ${view.objects.length}`);
  }
  await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
  await page.reload();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 21 / 21");
  await expect(page.locator(".pw-counter")).toHaveText("6 / 6 мест");
  await page.screenshot({ path: testInfo.outputPath("walk-route-complete.png") });
});

test("a discovery survives rotation, reload and returning from another stop", async ({ page }, testInfo) => {
  await startWalk(page);
  await page.getByRole("button", { name: "Подсказка", exact: true }).click();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");
  const first = page.locator(".pw-object").first();
  await first.focus();
  await first.tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");

  const portrait = page.viewportSize()!;
  await page.setViewportSize({ width: portrait.height, height: portrait.width });
  await expect.poll(async () => (await bounds(page)).covers).toBe(true);
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Перейти: К мшистому пню", exact: true }).focus();
  await page.getByRole("button", { name: "Перейти: К мшистому пню", exact: true }).tap();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-moss-stump");
  await page.reload();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-moss-stump");
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");
  await page.getByRole("button", { name: "Перейти: Назад на склон", exact: true }).focus();
  await page.getByRole("button", { name: "Перейти: Назад на склон", exact: true }).tap();
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-view", "video-forest");
  await expect(page.locator(".pw-object").first()).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("walk-landscape-progress.png") });
});

test("confirmed replay resets the walk and preserves the field journal", async ({ page }) => {
  await startWalk(page);
  await page.evaluate(async () => {
    const storageModule = "/src/storage.ts";
    const { saveObservation } = await import(storageModule);
    await saveObservation({
      id: "synthetic-replay-journal", title: "Synthetic replay fixture", note: "Preserve this journal entry",
      locationLabel: "", observedAt: "2026-09-29", createdAt: "2026-09-29T00:00:00.000Z",
      status: "local_only", photos: [],
    });
    localStorage.setItem("mixor-synthetic-unrelated-progress", "preserve-me");
  });
  await page.getByRole("button", { name: "Подсказка", exact: true }).click();
  await page.locator(".pw-object").first().tap();
  await page.getByRole("button", { name: "Продолжить поиск", exact: true }).click();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");
  await page.getByRole("button", { name: "Открыть маршрут", exact: true }).click();
  await page.getByRole("button", { name: "Новая прогулка", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Фотографии и полевой журнал сохранятся");
  // Merely opening the confirmation must not erase anything.
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 1 / 21");
  await page.getByRole("button", { name: "Начать поиск заново", exact: true }).click();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");
  await expect(page.locator(".pw-counter")).toHaveText("1 / 6 мест");
  await page.reload();
  await expect(page.locator(".pw-find-counter")).toHaveText("Находки 0 / 21");
  const preserved = await page.evaluate(async () => {
    const storageModule = "/src/storage.ts";
    const { listObservations } = await import(storageModule);
    return {
      entries: await listObservations(),
      unrelated: localStorage.getItem("mixor-synthetic-unrelated-progress"),
    };
  });
  expect(preserved.entries).toEqual([expect.objectContaining({
    id: "synthetic-replay-journal", note: "Preserve this journal entry", status: "local_only",
  })]);
  expect(preserved.unrelated).toBe("preserve-me");
});
