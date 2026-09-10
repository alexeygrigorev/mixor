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
  await enable(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__audioTest.media.some(
          (a: HTMLMediaElement) =>
            a.src.includes("ui-press-soft-mix") &&
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

test("mastered tap and uncover files contain audible-level signal, not just a successful play call", async ({
  page,
}) => {
  await instrument(page);
  const measurements = await page.evaluate(async () => {
    const context = new AudioContext();
    try {
      const measured = [];
      for (const [file, gain] of [
        ["ui-press-soft-mix", 0.18 * 0.65],
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
