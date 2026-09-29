import { test, expect, type Page } from "@playwright/test";

async function start(page: Page, zoom = true) {
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-muted", "true");
    const probe = { nativeDrags: 0, objectFocus: 0 };
    (window as any).__dragProbe = probe;
    document.addEventListener("dragstart", event => { if (!event.defaultPrevented) probe.nativeDrags++; });
    document.addEventListener("focusin", event => {
      if (event.target instanceof HTMLElement && event.target.matches(".pw-object")) probe.objectFocus++;
    });
  });
  await page.goto("/#world/physarum/video-forest");
  await expect(page.locator(".photo-walk-scene")).toHaveAttribute("data-busy", "false");
  if (zoom) await page.getByRole("button", { name: "Приблизить", exact: true }).click();
}

async function objectPoint(page: Page) {
  const box = await page.locator(".pw-object").first().boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

async function expectNoReveal(page: Page) {
  await expect(page.locator(".pw-dialog")).not.toBeVisible();
  await expect(page.locator('.pw-object[aria-pressed="true"]')).toHaveCount(0);
  expect(await page.evaluate(() => ({
    ...(window as any).__dragProbe,
    selection: window.getSelection()?.toString(),
    objectFocused: document.activeElement?.matches(".pw-object"),
  }))).toEqual({ nativeDrags: 0, objectFocus: 0, selection: "", objectFocused: false });
}

test("mouse panning from an object and the background never selects or reveals targets", async ({ page }) => {
  await start(page);
  const target = page.locator(".pw-object").first();
  const point = await objectPoint(page);
  const before = await page.locator(".pw-surface").evaluate(node => (node as HTMLElement).style.transform);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  // Catch the old pointerdown focus/recentring before the drag threshold.
  await expect(target).not.toBeFocused();
  expect(await page.locator(".pw-surface").evaluate(node => (node as HTMLElement).style.transform)).toBe(before);
  await page.mouse.move(point.x - 90, point.y - 20, { steps: 12 });
  await page.mouse.up();
  expect(await page.locator(".pw-surface").evaluate(node => (node as HTMLElement).style.transform)).not.toBe(before);
  await expectNoReveal(page);

  await page.mouse.move(70, 170);
  await page.mouse.down();
  await page.mouse.move(160, 220, { steps: 12 });
  await page.mouse.up();
  await expectNoReveal(page);
  expect(await page.locator(".pw-viewport").evaluate(node => {
    const style = getComputedStyle(node);
    return style.getPropertyValue("user-select") || style.getPropertyValue("-webkit-user-select");
  })).toBe("none");
  await target.click();
  await expect(page.locator(".pw-dialog")).toBeVisible();
});

test("touch drag from an object pans without focus or discovery, then a tap still discovers", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Native multi-event touch injection uses Chromium CDP; tap and keyboard coverage runs in both engines.");
  await start(page);
  const point = await objectPoint(page);
  const before = await page.locator(".pw-surface").evaluate(node => (node as HTMLElement).style.transform);
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await expect(page.locator(".pw-object").first()).not.toBeFocused();
  for (let i = 1; i <= 8; i++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x - i * 10, y: point.y }] });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(await page.locator(".pw-surface").evaluate(node => (node as HTMLElement).style.transform)).not.toBe(before);
  await expectNoReveal(page);
  // Let Chromium finish the injected swipe gesture before a distinct native tap.
  await page.waitForTimeout(350);
  await page.locator(".pw-object").first().tap();
  await expect(page.locator(".pw-dialog")).toBeVisible();
  await expect(page.locator(".pw-object").first()).toHaveAttribute("aria-pressed", "true");
  await session.detach();
});

test("keyboard focus remains visible and Enter discovers after pointer panning", async ({ page }) => {
  await start(page);
  await page.mouse.move(70, 170);
  await page.mouse.down();
  await page.mouse.move(150, 170, { steps: 8 });
  await page.mouse.up();
  await page.locator(".pw-viewport").focus();
  await page.keyboard.press("Tab");
  const target = page.locator(".pw-object").first();
  await expect(target).toBeFocused();
  expect(await target.evaluate(node => node.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator(".pw-dialog")).toBeVisible();
  await expect(target).toHaveAttribute("aria-pressed", "true");
});

test("a plain touch tap still opens exactly one discovery", async ({ page }) => {
  await start(page);
  await page.locator(".pw-object").first().tap();
  await expect(page.locator(".pw-dialog")).toBeVisible();
  await expect(page.locator('.pw-object[aria-pressed="true"]')).toHaveCount(1);
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("");
});

test("fresh desktop framing pans in both axes before using zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await start(page, false);
  const before = (await page.locator(".pw-surface").boundingBox())!;
  await page.mouse.move(500, 350);
  await page.mouse.down();
  await page.mouse.move(470, 330, { steps: 8 });
  await page.mouse.up();
  const after = (await page.locator(".pw-surface").boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeGreaterThan(15);
  expect(Math.abs(after.y - before.y)).toBeGreaterThan(10);
  await expectNoReveal(page);
});

test("repeated drags from objects and routes survive releasing outside the photograph", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  const initialUrl = page.url();
  for (const selector of [".pw-object", ".pw-ground-link", ".pw-object", ".pw-ground-link"]) {
    const target = page.locator(selector).first();
    const box = (await target.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    const before = (await page.locator(".pw-surface").boundingBox())!;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 20, y - 10, { steps: 6 });
    await page.mouse.up();
    const after = (await page.locator(".pw-surface").boundingBox())!;
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(10);
    await expect(page.locator(".pw-viewport")).not.toHaveClass(/is-dragging/);
    await expect(page).toHaveURL(initialUrl);
    await expectNoReveal(page);
  }
  await page.mouse.move(4, 200);
  await page.mouse.down();
  await page.mouse.move(-30, 220, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator(".pw-viewport")).not.toHaveClass(/is-dragging/);
  // A new gesture must still start after that outside release.
  const before = (await page.locator(".pw-surface").boundingBox())!;
  await page.mouse.move(500, 250);
  await page.mouse.down();
  await page.mouse.move(550, 260, { steps: 8 });
  await page.mouse.up();
  const after = (await page.locator(".pw-surface").boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeGreaterThan(20);
  await expectNoReveal(page);
});
