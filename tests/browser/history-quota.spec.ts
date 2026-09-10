import { test, expect, type Page } from "@playwright/test";
import { createHistoryCommitter } from "../../src/history-committer";
import { stageSequence } from "../../src/life-data";
import { woodlands } from "../../src/search-data";

test("history committer keeps first/latest commits, retry backoff and cancellation deterministic", () => {
  let now = 0;
  let serial = 0;
  const timers = new Map<number, { at: number; run: () => void }>();
  const clock = {
    now: () => now,
    setTimeout: (run: () => void, delay: number) => {
      timers.set(++serial, { at: now + delay, run }); return serial;
    },
    clearTimeout: (id: number) => { timers.delete(id); },
  };
  const advance = (until: number) => {
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      now = next[1].at; timers.delete(next[0]); next[1].run();
    }
    now = until;
  };
  const queue = createHistoryCommitter(clock);
  const written: string[] = [];
  const shown: string[] = [];
  const request = (id: string) => queue.request(() => { written.push(id); }, () => { shown.push(id); });
  request("first"); request("superseded"); request("latest");
  expect(written).toEqual(["first"]);
  advance(149); expect(shown).toEqual(["first"]);
  advance(150); expect(written).toEqual(["first", "latest"]);
  expect(shown).toEqual(written);
  const attempts: number[] = [];
  queue.request(() => {
    attempts.push(now);
    if (attempts.length <= 5) throw new DOMException("Modeled quota", "SecurityError");
  }, () => { shown.push("recovered"); });
  advance(6049); expect(shown).toEqual(["first", "latest"]);
  advance(6050);
  expect(attempts).toEqual([300, 550, 1050, 2050, 4050, 6050]);
  expect(shown.at(-1)).toBe("recovered");
  request("cancelled"); queue.cancel(); advance(7000);
  expect(written).toEqual(["first", "latest"]);
  queue.request(() => { throw new DOMException("Modeled quota", "SecurityError"); }, () => { shown.push("stale"); });
  queue.cancel(); advance(10000); expect(shown).not.toContain("stale");
  expect(() => queue.request(() => { throw new TypeError("Not quota"); }, () => {})).toThrow("Not quota");
});

async function start(page: Page, path = "/#life/physarum/spore") {
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-muted", "true");
    const probe = { refuse: 0, only: "", attempts: [] as { at: number; url: string; refused: boolean }[] };
    (window as any).__historyQuota = probe;
    const replace = history.replaceState;
    history.replaceState = function (data, unused, url) {
      const refused = probe.refuse > 0 && (!probe.only || String(url) === probe.only);
      probe.attempts.push({ at: performance.now(), url: String(url ?? location.hash), refused });
      if (refused) { probe.refuse--; throw new DOMException("Modeled history quota", "SecurityError"); }
      return replace.call(this, data, unused, url);
    };
  });
  await page.goto(path);
}

async function stage(page: Page, index: number) {
  await expect(page.locator(".stage-position")).toHaveText(`${index + 1} / 11`);
  await expect(page).toHaveURL(new RegExp(`#life/physarum/${stageSequence[index]}$`));
}

test("rapid native stage and scene traversal keeps URL/render aligned without history quota errors", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  // No artificial click delay or relaxed assertion: exceed the old 100-write
  // workload and let the application enforce its own minimum commit interval.
  for (let i = 0; i < 112; i++) {
    await page.locator(".next-stage").click();
    await stage(page, (i + 1) % 11);
  }
  const attempts = await page.evaluate(() => (window as any).__historyQuota.attempts);
  expect(attempts).toHaveLength(112);
  for (let i = 1; i < attempts.length; i++) expect(attempts[i].at - attempts[i - 1].at).toBeGreaterThanOrEqual(149);
  await page.goto("/#world/physarum/forest");
  for (let i = 0; i < 12; i++) {
    await page.getByRole("button", { name: /^Следующее место:/ }).click();
    const woodland = woodlands[(i + 1) % woodlands.length];
    await expect(page.locator(".search-scene")).toHaveAccessibleName(`${woodland.title}: поиск миксомицетов`);
    await expect(page).toHaveURL(new RegExp(`#world/physarum/${woodland.id}$`));
  }
  expect(errors).toEqual([]);
});

test("modeled SecurityError retries real history writes without desynchronizing or freezing the stage", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await page.evaluate(() => { (window as any).__historyQuota.refuse = 2; });
  await page.locator(".next-stage").click();
  await stage(page, 0);
  await stage(page, 1);
  const attempts = await page.evaluate(() => (window as any).__historyQuota.attempts);
  expect(attempts.map((attempt: any) => attempt.refused)).toEqual([true, true, false]);
  expect(attempts[1].at - attempts[0].at).toBeGreaterThanOrEqual(249);
  expect(attempts[2].at - attempts[1].at).toBeGreaterThanOrEqual(499);
  await page.locator(".next-stage").click();
  await stage(page, 2);
  expect(errors).toEqual([]);
});

for (const navigation of ["app Back", "browser Back", "new activity", "hashchange"] as const) {
  test(`pending history retry cannot overwrite ${navigation}`, async ({ page }) => {
    if (navigation === "new activity") {
      await start(page, "/#world/physarum/forest");
      await page.locator(".hiding-place").first().click();
      await expect(page.locator(".search-magnifier")).toBeVisible();
      // Keep only the queued scene write refused until cancellation, so a
      // slow test runner cannot accidentally let its retry finish first.
      await page.evaluate(() => { Object.assign((window as any).__historyQuota, { refuse: 100, only: "#world/physarum/stump" }); });
      await page.getByRole("button", { name: /^Следующее место:/ }).click();
    } else {
      await start(page, "/#species/physarum/spore");
      await page.getByRole("button", { name: /Развитие:.*polycephala/ }).click();
      await stage(page, 0);
      await page.evaluate(() => { Object.assign((window as any).__historyQuota, { refuse: 100, only: "#life/physarum/cells" }); });
      await page.locator(".next-stage").click();
    }
    await expect.poll(() => page.evaluate(() => (window as any).__historyQuota.attempts.some((a: any) => a.refused))).toBe(true);
    if (navigation === "app Back") await page.getByRole("button", { name: "Назад к выбору вида", exact: true }).click();
    else if (navigation === "browser Back") await page.goBack();
    else if (navigation === "new activity") {
      await page.getByRole("button", { name: "Узнать больше", exact: true }).click();
    }
    else await page.evaluate(() => { location.hash = "#world/physarum/roots"; });
    const expected = navigation === "new activity" ? /#portrait\/[^/]+\/spore$/ : navigation === "hashchange" ? /#world\/physarum\/roots$/ : /#species\/physarum\/spore$/;
    await expect(page).toHaveURL(expected);
    const calls = await page.evaluate(() => (window as any).__historyQuota.attempts.length);
    // Observe past the retry deadline; this does not slow the stress clicks.
    await page.waitForTimeout(650);
    await expect(page).toHaveURL(expected);
    expect(await page.evaluate(() => (window as any).__historyQuota.attempts.length)).toBe(calls);
    await expect(page.locator(".development-focus")).toHaveCount(0);
    if (navigation === "new activity") {
      await page.goBack();
      await expect(page).toHaveURL(/#world\/physarum\/forest$/);
      await expect(page.locator(".search-scene")).toHaveAccessibleName(`${woodlands[0].title}: поиск миксомицетов`);
    }
  });
}
