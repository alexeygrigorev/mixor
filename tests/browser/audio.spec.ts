import { test, expect, type Page } from "@playwright/test";

// Observe real media elements, never replace decoding or play() with mocks.
async function instrument(page: Page) {
  // No personal draft is entered in these tests; accept the existing capture
  // discard confirmation without changing the app's protection.
  page.on("dialog", (dialog) => dialog.accept());
  await page.addInitScript(() => {
    const state = {
      media: [] as HTMLMediaElement[],
      plays: [] as string[],
      pauses: [] as string[],
    };
    (window as any).__audioTest = state;
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function () {
      if (!state.media.includes(this)) state.media.push(this);
      state.plays.push(this.src);
      return play.call(this);
    };
    HTMLMediaElement.prototype.pause = function () {
      state.pauses.push(this.src);
      return pause.call(this);
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).__audioTest.plays)).toEqual(
    [],
  );
}
async function enable(page: Page) {
  await page
    .getByRole("button", { name: "Включить звук", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).__audioTest.media.filter(
            (a: HTMLMediaElement) =>
              a.loop && !a.paused && a.currentTime > 0 && a.readyState >= 2,
          ).length,
      ),
    )
    .toBe(3);
}
async function changeRoute(page: Page, hash: string) {
  await page.evaluate((value) => {
    location.hash = value;
  }, hash);
}
async function loops(page: Page) {
  return page.evaluate(() =>
    (window as any).__audioTest.media
      .filter((a: HTMLMediaElement) => a.loop)
      .map((a: HTMLMediaElement) => ({
        src: a.src,
        time: a.currentTime,
        paused: a.paused,
      })),
  );
}
async function assertContinuous(page: Page, open: () => Promise<unknown>) {
  const before = await loops(page);
  const pauses = await page.evaluate(
    () => (window as any).__audioTest.pauses.length,
  );
  await open();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(async () => {
      const after = await loops(page);
      return (
        after.length === 3 &&
        after.every(
          (a: any, i: number) =>
            !a.paused &&
            a.src === before[i].src &&
            a.time > before[i].time + 0.15,
        )
      );
    })
    .toBe(true);
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(() => (window as any).__audioTest.pauses.length),
  ).toBe(pauses);
}

test("music and nature continue through settings, sources, photos and capture modals", async ({
  page,
}) => {
  await instrument(page);
  await enable(page);
  await assertContinuous(page, () =>
    page.getByRole("button", { name: "Настройки", exact: true }).click(),
  );
  await changeRoute(page, "#tree/physarum/spore");
  await assertContinuous(page, () =>
    page.getByRole("button", { name: /Источники/ }).click(),
  );
  await changeRoute(page, "#life/physarum/network");
  await assertContinuous(page, () =>
    page
      .getByRole("button", { name: "Посмотреть реальные фотографии" })
      .click(),
  );
  await changeRoute(page, "#journal");
  await assertContinuous(page, () =>
    page
      .getByRole("button", { name: "Добавить свою находку", exact: true })
      .click(),
  );
  expect((await loops(page)).length).toBe(3);
});

test("taps and forest uncovering decode, have separate cues, and obey effects and mute", async ({
  page,
}) => {
  await instrument(page);
  // Silent play never starts even an uncover cue.
  await changeRoute(page, "#world/physarum/forest");
  await page.locator('.hiding-place[aria-pressed="false"]').first().click();
  expect(await page.evaluate(() => (window as any).__audioTest.plays)).toEqual(
    [],
  );
  await page.getByRole("button", { name: /Назад/ }).click();
  await changeRoute(page, "#base");
  await enable(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__audioTest.media.some(
          (a: HTMLMediaElement) =>
            a.src.includes("fingertip-wood-v2-mix") &&
            a.readyState >= 2 &&
            a.currentTime > 0 &&
            a.volume > 0.1,
        ),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await changeRoute(page, "#world/physarum/stump");
  const target = page.locator('.hiding-place[aria-pressed="false"]').first();
  await target.click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__audioTest.media.some(
          (a: HTMLMediaElement) =>
            a.src.includes("uncover-mix") &&
            a.readyState >= 2 &&
            a.currentTime > 0 &&
            a.volume > 0.1,
        ),
      ),
    )
    .toBe(true);
  const count = await page.evaluate(
    () =>
      (window as any).__audioTest.plays.filter((src: string) =>
        src.includes("uncover-mix"),
      ).length,
  );
  await page.locator('.hiding-place[aria-pressed="true"]').first().click();
  expect(
    await page.evaluate(
      () =>
        (window as any).__audioTest.plays.filter((src: string) =>
          src.includes("uncover-mix"),
        ).length,
    ),
  ).toBe(count);
  await page.getByRole("button", { name: /Назад/ }).click();
  await changeRoute(page, "#base");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("slider", { name: "Касания и инструменты" }).fill("0");
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  const plays = await page.evaluate(
    () => (window as any).__audioTest.plays.length,
  );
  await changeRoute(page, "#world/physarum/leaves");
  await page.locator('.hiding-place[aria-pressed="false"]').first().click();
  expect(
    await page.evaluate(() => (window as any).__audioTest.plays.length),
  ).toBe(plays);
  expect((await loops(page)).every((a: any) => !a.paused)).toBe(true);
  await page.getByRole("button", { name: /Назад/ }).click();
  await changeRoute(page, "#base");
  await page
    .getByRole("button", { name: "Выключить звук", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      (window as any).__audioTest.media.every(
        (a: HTMLMediaElement) => a.paused,
      ),
    ),
  ).toBe(true);
  const mutedPlays = await page.evaluate(
    () => (window as any).__audioTest.plays.length,
  );
  await changeRoute(page, "#world/physarum/roots");
  await page.locator('.hiding-place[aria-pressed="false"]').first().click();
  expect(
    await page.evaluate(() => (window as any).__audioTest.plays.length),
  ).toBe(mutedPlays);
});

test("hidden document pauses and resumes the same loops, without overriding mute", async ({
  page,
}) => {
  await instrument(page);
  await enable(page);
  const before = await loops(page);
  const visibility = (hidden: boolean) =>
    page.evaluate((value) => {
      // Deterministic visibility event simulation; not a physical OS interruption test.
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => value,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await visibility(true);
  expect((await loops(page)).every((a: any) => a.paused)).toBe(true);
  await visibility(false);
  await expect
    .poll(async () =>
      (await loops(page)).every(
        (a: any, i: number) => !a.paused && a.time > before[i].time,
      ),
    )
    .toBe(true);
  expect((await loops(page)).length).toBe(3);
  await page
    .getByRole("button", { name: "Выключить звук", exact: true })
    .click();
  await visibility(true);
  await visibility(false);
  expect((await loops(page)).every((a: any) => a.paused)).toBe(true);
});

test("new physical tap and uncover files decode within digital signal bounds", async ({
  page,
}) => {
  await instrument(page);
  const measurements = await page.evaluate(async () => {
    const context = new AudioContext();
    try {
      const measured = [];
      for (const [file, gain] of [
        ["fingertip-wood-v2-mix", 0.18 * 0.65],
        ["uncover-mix", 0.18 * 0.9],
      ] as const) {
        const response = await fetch(`/assets/audio/sfx/${file}.mp3`);
        if (!response.ok) throw new Error(`Missing cue: ${file}`);
        const buffer = await context.decodeAudioData(
          await response.arrayBuffer(),
        );
        let peak = 0,
          energy = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          for (const sample of buffer.getChannelData(channel)) {
            peak = Math.max(peak, Math.abs(sample));
            energy += sample * sample;
          }
        }
        measured.push({
          file,
          seconds: buffer.duration,
          defaultPeakDb: 20 * Math.log10(peak * gain),
          defaultRmsDb:
            20 *
            Math.log10(
              Math.sqrt(energy / (buffer.length * buffer.numberOfChannels)) *
                gain,
            ),
        });
      }
      return measured;
    } finally {
      await context.close();
    }
  });
  for (const cue of measurements) {
    expect(cue.seconds).toBeGreaterThan(0.2);
    expect(cue.seconds).toBeLessThan(1.6);
    expect(cue.defaultPeakDb).toBeGreaterThan(-36);
    expect(cue.defaultPeakDb).toBeLessThan(-20);
    expect(cue.defaultRmsDb).toBeGreaterThan(-60);
  }
  // These digital-signal bounds catch the previous near-silent files;
  // they do not certify perceived loudness through physical speakers.
});

async function setScene(page: Page, scene: string | null) {
  await page.evaluate(async (id) => {
    // Use the already loaded URL (including Vite's HMR timestamp) so the
    // test observes the app singleton instead of importing a second manager.
    const modulePath = performance.getEntriesByType("resource").map((entry) => entry.name).find((url) => new URL(url).pathname === "/src/audio.ts");
    if (!modulePath) throw new Error("Application audio module was not loaded");
    const { audioManager } = await import(modulePath);
    audioManager.setScene(id);
  }, scene);
}

test("scene audio uses rain only for roots and bark, without restarting shared stems", async ({ page }) => {
  await instrument(page);
  await enable(page);
  const before = await loops(page);
  const loopPlayCount = () => page.evaluate(() => (window as any).__audioTest.plays.filter((src: string) => /forest-acoustic-v2-long|dry-leaves-v2-long|distant-birds-long/.test(src)).length);
  const plays = await loopPlayCount();
  for (const id of ["forest", "stump", "leaves"]) {
    await setScene(page, id);
    await setScene(page, id);
    expect((await loops(page)).filter((a: any) => !a.paused)).toHaveLength(3);
    expect((await loops(page)).some((a: any) => a.src.includes("rain"))).toBe(false);
  }
  await setScene(page, "roots");
  await expect.poll(async () => (await loops(page)).filter((a: any) => a.src.includes("canopy-rain-v2") && !a.paused && a.time > 0).length).toBe(1);
  const rainPlays = await page.evaluate(() => (window as any).__audioTest.plays.filter((src: string) => src.includes("canopy-rain-v2")).length);
  await setScene(page, "bark");
  await setScene(page, "bark");
  expect(await page.evaluate(() => (window as any).__audioTest.plays.filter((src: string) => src.includes("canopy-rain-v2")).length)).toBe(rainPlays);
  expect(await loopPlayCount()).toBe(plays);
  await expect.poll(async () => (await loops(page)).filter((a: any) => !a.src.includes("rain")).every((a: any, i: number) => !a.paused && a.time > before[i].time)).toBe(true);
  for (const id of ["forest", "stump", "leaves", null, "unknown-scene"]) {
    await setScene(page, "roots");
    await setScene(page, id);
    expect((await loops(page)).filter((a: any) => a.src.includes("rain")).every((a: any) => a.paused)).toBe(true);
  }
  expect((await loops(page)).length).toBe(4);
  expect(await page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => a.loop).some((a: HTMLMediaElement) => /forest-stillness|dry-canopy-long/.test(a.src)))).toBe(false);
});

test("rain respects consent, mute, hidden state and zero nature level", async ({ page }) => {
  await instrument(page);
  await setScene(page, "roots");
  expect(await page.evaluate(() => (window as any).__audioTest.plays)).toEqual([]);
  await setScene(page, null);
  await enable(page);
  await page.getByRole("button", { name: "Выключить звук", exact: true }).click();
  const plays = await page.evaluate(() => (window as any).__audioTest.plays.length);
  await setScene(page, "roots");
  expect(await page.evaluate(() => (window as any).__audioTest.plays.length)).toBe(plays);
  await page.getByRole("button", { name: "Включить звук", exact: true }).click();
  await expect.poll(async () => (await loops(page)).filter((a: any) => !a.paused && a.src.includes("rain")).length).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await setScene(page, "bark");
  expect((await loops(page)).every((a: any) => a.paused)).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(async () => (await loops(page)).filter((a: any) => !a.paused).length).toBe(4);
  await page.evaluate(async () => {
    const modulePath = performance.getEntriesByType("resource").map((entry) => entry.name).find((url) => new URL(url).pathname === "/src/audio.ts");
    if (!modulePath) throw new Error("Application audio module was not loaded");
    const { audioManager } = await import(modulePath);
    audioManager.setLevels({ music: 12, nature: 0, effects: 18 });
  });
  const remaining = (await loops(page)).filter((a: any) => !a.paused);
  expect(remaining).toHaveLength(1);
  expect(remaining[0].src).toContain("forest-acoustic-v2-long");
});

test("visible scene weather and discovery return context drive the actual rain layer", async ({ page }) => {
  await instrument(page);
  await enable(page);
  for (const [id, weather] of [["forest", "clear"], ["stump", "overcast"], ["leaves", "overcast"], ["roots", "rain"], ["bark", "rain"]]) {
    await changeRoute(page, `#world/physarum/${id}`);
    await expect(page.locator(".search-scene .scene-weather")).toHaveAttribute("data-weather", weather);
    await expect.poll(async () => (await loops(page)).some((a: any) => a.src.includes("canopy-rain-v2") && !a.paused && a.time > 0)).toBe(weather === "rain");
  }
  const spot = page.locator('.hiding-place[aria-pressed="false"]').first();
  await spot.click();
  const before = await loops(page);
  await page.locator('.hiding-place[aria-pressed="true"]').first().click();
  await expect(page.locator(".search-scene")).toHaveCount(0);
  await expect.poll(async () => (await loops(page)).every((a: any, i: number) => !a.paused && a.src === before[i].src && a.time > before[i].time)).toBe(true);
  await page.getByRole("button", { name: /Назад/ }).first().click();
  await expect(page.locator(".search-scene .scene-weather")).toHaveAttribute("data-weather", "rain");
  await page.getByRole("button", { name: /Назад/ }).first().click();
  await expect(page.locator(".woodland-chooser")).toBeVisible();
  await expect.poll(async () => (await loops(page)).filter((a: any) => a.src.includes("rain")).every((a: any) => a.paused)).toBe(true);
});

test("specific lens and save foley suppress the same event's generic bubbling tap", async ({ page }) => {
  await instrument(page);
  await enable(page);
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop).every((a: HTMLMediaElement) => a.paused || a.ended))).toBe(true);
  for (const id of ["lens-open", "save-local"]) {
    const result = await page.evaluate(async (cue) => {
      const modulePath = performance.getEntriesByType("resource").map((entry) => entry.name).find((url) => new URL(url).pathname === "/src/audio.ts");
      if (!modulePath) throw new Error("Application audio module was not loaded");
      const { audioManager } = await import(modulePath);
      const state = (window as any).__audioTest;
      const before = state.plays.length;
      audioManager.playSfx(cue);
      audioManager.playSfx("ui-press");
      return { plays: state.plays.slice(before) };
    }, id);
    expect(result.plays).toHaveLength(1);
    expect(result.plays[0]).toContain("fingertip-wood-v2-mix");
    await expect.poll(() => page.evaluate(() => {
      const clips = (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop && a.src.includes("fingertip-wood-v2-mix"));
      const latest = clips.at(-1);
      return Boolean(latest && latest.readyState >= 2 && latest.currentTime > 0);
    })).toBe(true);
    expect(await page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop && !a.paused && !a.ended).length)).toBe(1);
    await expect.poll(() => page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop).every((a: HTMLMediaElement) => a.paused || a.ended))).toBe(true);
  }
});
