import { test, expect, type Page } from "@playwright/test";
import { migrateSoundPreferences, defaultSoundLevels, soundPreferencesKey } from "../../src/audio-preferences";

// Observe native media events. The opt-in autoplay-rejection model below never
// synthesizes successful playback; every successful play still uses real media.
async function observeAudio(page: Page, blockUntilGesture = false) {
  // No personal draft is entered in these tests; accept the existing capture
  // discard confirmation without changing the app's protection.
  page.on("dialog", (dialog) => dialog.accept());
  await page.addInitScript((blockUntilGesture) => {
    const state = {
      media: [] as HTMLMediaElement[],
      plays: [] as string[],
      pauses: [] as string[],
      playback: [] as { src: string; loop: boolean; volume: number; events: string[]; maxTime: number; readyState: number; maxConcurrentSfx: number }[],
    };
    (window as any).__audioTest = state;
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    let unlocked = false;
    document.addEventListener("click", (event) => { if (event.isTrusted) unlocked = true; }, true);
    const latest = new WeakMap<HTMLMediaElement, (typeof state.playback)[number]>();
    HTMLMediaElement.prototype.play = function () {
      if (!state.media.includes(this)) {
        state.media.push(this);
        for (const name of ["playing", "timeupdate", "ended"]) this.addEventListener(name, () => {
          const record = latest.get(this);
          if (!record) return;
          record.events.push(name);
          record.maxTime = Math.max(record.maxTime, this.currentTime);
          record.readyState = Math.max(record.readyState, this.readyState);
          record.maxConcurrentSfx = Math.max(record.maxConcurrentSfx, state.media.filter((a) => !a.loop && !a.paused && !a.ended).length);
        });
      }
      state.plays.push(this.src);
      const record = { src: this.src, loop: this.loop, volume: this.volume, events: [] as string[], maxTime: 0, readyState: 0, maxConcurrentSfx: 0 };
      state.playback.push(record);
      latest.set(this, record);
      if (blockUntilGesture && this.loop && !unlocked)
        return Promise.reject(new DOMException("Test model: browser requires a trusted gesture", "NotAllowedError"));
      return play.call(this);
    };
    HTMLMediaElement.prototype.pause = function () {
      state.pauses.push(this.src);
      return pause.call(this);
    };
  }, blockUntilGesture);
}
async function instrument(page: Page) {
  // These continuity tests begin with an explicitly quiet legacy preference.
  // Fresh/default-on behavior is tested separately below.
  await page.addInitScript(() => localStorage.setItem("mixor-muted", "true"));
  await observeAudio(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).__audioTest.plays)).toEqual(
    [],
  );
}
async function decodedCue(page: Page, afterPlay: number, file = "leaf-friction-v3-mix") {
  await expect.poll(() => page.evaluate(({ afterPlay, file }) => (window as any).__audioTest.playback.slice(afterPlay).some((p: any) =>
    p.src.includes(file) && p.events.includes("playing") && p.maxTime > 0 && p.readyState >= 2), { afterPlay, file })).toBe(true);
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
            a.src.includes("leaf-friction-v3-mix") &&
            a.readyState >= 2 &&
            a.currentTime > 0 &&
            Math.abs(a.volume - 0.36 * 0.65 * 0.3) < 0.0001,
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
  await page.getByRole("button", { name: "Закрыть увеличение", exact: true }).click();
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

test("leaf friction and distinct uncover files decode within digital signal bounds", async ({
  page,
}) => {
  await instrument(page);
  const measurements = await page.evaluate(async () => {
    const context = new AudioContext();
    try {
      const measured = [];
      for (const [file, gain] of [
        ["leaf-friction-v3-mix", 0.36 * 0.65 * 0.3],
        ["uncover-mix", 0.36 * 0.9],
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
    expect(cue.defaultPeakDb).toBeGreaterThan(cue.file === "leaf-friction-v3-mix" ? -48 : -36);
    expect(cue.defaultPeakDb).toBeLessThan(-20);
    expect(cue.defaultRmsDb).toBeGreaterThan(cue.file === "leaf-friction-v3-mix" ? -70 : -60);
    if (cue.file === "leaf-friction-v3-mix") {
      expect(cue.seconds).toBeGreaterThanOrEqual(0.25);
      expect(cue.seconds).toBeLessThanOrEqual(0.5);
    } else {
      // Chromium trims MP3 encoder delay/padding; Linux WebKit retains it.
      // This file has 1.2s of source audio and a 1.227755s MP3 duration.
      // Keep a tight bound around both, independently of the loudness guards.
      expect(cue.seconds).toBeGreaterThanOrEqual(1.19);
      expect(cue.seconds).toBeLessThanOrEqual(1.24);
    }
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
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.media.find((a: HTMLMediaElement) => a.loop && a.src.includes("canopy-rain-v2"))?.duration ?? 0)).toBeGreaterThan(120);
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
  const before = await loops(page);
  await spot.click();
  await expect(page.locator(".search-magnifier")).toBeVisible();
  await expect.poll(async () => (await loops(page)).every((a: any, i: number) => !a.paused && a.src === before[i].src && a.time > before[i].time)).toBe(true);
  await page.getByRole("button", { name: "Узнать больше", exact: true }).click();
  await expect(page.locator(".search-scene")).toHaveCount(0);
  await expect.poll(async () => (await loops(page)).every((a: any, i: number) => !a.paused && a.src === before[i].src && a.time > before[i].time)).toBe(true);
  await page.getByRole("button", { name: /Назад/ }).first().click();
  await expect(page.locator(".search-scene .scene-weather")).toHaveAttribute("data-weather", "rain");
  await page.getByRole("button", { name: /Назад/ }).first().click();
  await expect(page.locator(".woodland-chooser")).toBeVisible();
  await expect.poll(async () => (await loops(page)).filter((a: any) => a.src.includes("rain")).every((a: any) => a.paused)).toBe(true);
});

test("generic, lens, discovery and save rustles suppress same-event duplicate taps", async ({ page }) => {
  await instrument(page);
  await enable(page);
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop).every((a: HTMLMediaElement) => a.paused || a.ended))).toBe(true);
  for (const id of ["ui-press", "lens-open", "discovery", "save-local"]) {
    const result = await page.evaluate(async (cue) => {
      const modulePath = performance.getEntriesByType("resource").map((entry) => entry.name).find((url) => new URL(url).pathname === "/src/audio.ts");
      if (!modulePath) throw new Error("Application audio module was not loaded");
      const { audioManager } = await import(modulePath);
      const state = (window as any).__audioTest;
      const before = state.plays.length;
      audioManager.playSfx(cue);
      audioManager.playSfx("ui-press");
      return { before, plays: state.plays.slice(before) };
    }, id);
    expect(result.plays).toHaveLength(1);
    expect(result.plays[0]).toContain("leaf-friction-v3-mix");
    await decodedCue(page, result.before);
    expect(await page.evaluate((offset) => (window as any).__audioTest.playback[offset].maxConcurrentSfx, result.before)).toBe(1);
    await expect.poll(() => page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop).every((a: HTMLMediaElement) => a.paused || a.ended))).toBe(true);
  }
});

test("actual stage, lens and save clicks play one new rustle without legacy cues", async ({ page }) => {
  await instrument(page);
  await enable(page);
  const clickOneRustle = async (name: string) => {
    await expect.poll(() => page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => !a.loop).every((a: HTMLMediaElement) => a.paused || a.ended))).toBe(true);
    const before = await page.evaluate(() => (window as any).__audioTest.plays.length);
    await page.getByRole("button", { name, exact: true }).click();
    const cues = await page.evaluate((offset) => (window as any).__audioTest.plays.slice(offset).filter((src: string) => src.includes("/sfx/")), before);
    expect(cues).toHaveLength(1);
    expect(cues[0]).toContain("leaf-friction-v3-mix");
    await decodedCue(page, before);
  };
  await changeRoute(page, "#life/physarum/spore");
  await clickOneRustle("Следующий этап");
  await changeRoute(page, "#portrait/physarum/spore");
  await clickOneRustle("Наблюдать");
  await clickOneRustle("Не различаю");
  await clickOneRustle("Записать открытие");
  await expect(page.locator(".discovery-page")).toContainText("Не различаю");
  expect(await page.evaluate(() => (window as any).__audioTest.plays.some((src: string) => /fingertip-wood|ui-press-soft|lens-open\.mp3|save-local\.mp3|discovery\.mp3/.test(src)))).toBe(false);
});

test("audio preference migration preserves explicit choices and documents legacy assumptions", () => {
  expect(migrateSoundPreferences(null, null, null)).toMatchObject({ sound: "on", soundOrigin: "default", levels: defaultSoundLevels, levelsMode: "default" });
  expect(migrateSoundPreferences(null, { music: 12, nature: 45, effects: 18 }, null).levels).toEqual(defaultSoundLevels);
  for (const levels of [{ music: 0, nature: 45, effects: 18 }, { music: 70, nature: 15, effects: 2 }, { music: 0, nature: 0, effects: 0 }]) {
    expect(migrateSoundPreferences(null, levels, true)).toMatchObject({ sound: "off", soundOrigin: "legacy", levels, levelsMode: "custom" });
  }
  const explicit = { version: 3 as const, sound: "off" as const, soundOrigin: "explicit" as const, levelsMode: "custom" as const, levels: { music: 12, nature: 45, effects: 18 } };
  expect(migrateSoundPreferences(explicit, null, false)).toEqual(explicit);
  for (const invalid of [null, [], "bad", { music: NaN, nature: 30, effects: 20 }, { music: 101, nature: 30, effects: 20 }, { music: 0, nature: 30 }])
    expect(migrateSoundPreferences(null, invalid, false).levels).toEqual(defaultSoundLevels);
});

async function expectThreePlaying(page: Page) {
  await expect.poll(async () => (await loops(page)).filter((a: any) => !a.paused && a.time > 0).length).toBe(3);
}
async function savedSound(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), soundPreferencesKey);
}

test("untouched returning defaults are louder and on, with first normal tap sufficient", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-sound-levels-v2", JSON.stringify({ music: 12, nature: 45, effects: 18 }));
  });
  await observeAudio(page);
  await page.goto("/");
  await expect.poll(() => savedSound(page)).toMatchObject({ sound: "on", levels: defaultSoundLevels, levelsMode: "default" });
  await expect.poll(() => page.evaluate(() => (window as any).__audioTest.plays.length)).toBeGreaterThan(0);
  // Whether native autoplay is allowed or refused, no separate Unmute is used.
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expectThreePlaying(page);
  for (const [name, value] of [["Музыка", "36"], ["Ветер и птицы", "90"], ["Касания и инструменты", "36"]])
    await expect(page.getByRole("slider", { name, exact: true })).toHaveValue(value);
  const volumes = await page.evaluate(() => (window as any).__audioTest.media.filter((a: HTMLMediaElement) => a.loop).map((a: HTMLMediaElement) => a.volume));
  for (const [i, expected] of [0.36 * 0.45, 0.9 * 0.38 * 0.45, 0.9 * 0.25 * 0.55].entries()) expect(volumes[i]).toBeCloseTo(expected, 4);
  expect((await loops(page)).length).toBe(3);
});

test("modeled autoplay refusal never saves mute; first trusted tap retries real playback", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mixor-entered-v2", "true"));
  await observeAudio(page, true);
  await page.goto("/");
  await expect.poll(() => page.evaluate(async () => {
    const modulePath = performance.getEntriesByType("resource").map((e) => e.name).find((url) => new URL(url).pathname === "/src/audio.ts");
    if (!modulePath) return null;
    return (await import(modulePath)).audioManager.getPlaybackState();
  })).toBe("blocked");
  expect(await savedSound(page)).toMatchObject({ sound: "on", soundOrigin: "default" });
  expect(await page.evaluate(() => localStorage.getItem("mixor-muted"))).toBeNull();
  expect((await loops(page)).every((a: any) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expectThreePlaying(page);
  const calls = await page.evaluate(() => (window as any).__audioTest.plays.filter((src: string) => !src.includes("/sfx/")).length);
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__audioTest.plays.filter((src: string) => !src.includes("/sfx/")).length)).toBe(calls);
  expect((await loops(page)).length).toBe(3);
});

test("explicit quiet entry cancels first-gesture unlock and persists across reload", async ({ page }) => {
  await observeAudio(page, true);
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
  expect(await savedSound(page)).toMatchObject({ sound: "off", soundOrigin: "explicit" });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  expect((await loops(page)).every((a: any) => a.paused)).toBe(true);
  expect(await page.evaluate(() => (window as any).__audioTest.playback.some((p: any) => p.events.includes("playing")))).toBe(false);
  await page.reload();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__audioTest.plays.length)).toBe(0);
});

test("legacy custom levels and zeros survive migration, edits and explicit mute reload", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mixor-entered-v2", "true");
    localStorage.setItem("mixor-muted", "true");
    localStorage.setItem("mixor-sound-levels-v2", JSON.stringify({ music: 0, nature: 55, effects: 0 }));
  });
  await observeAudio(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  expect(await savedSound(page)).toMatchObject({ sound: "off", soundOrigin: "legacy", levelsMode: "custom", levels: { music: 0, nature: 55, effects: 0 } });
  expect(await page.evaluate(() => (window as any).__audioTest.plays.length)).toBe(0);
  await page.getByRole("slider", { name: "Музыка", exact: true }).fill("24");
  await page.getByRole("button", { name: "Включить звуки леса", exact: true }).click();
  await expectThreePlaying(page);
  await page.getByRole("button", { name: "Выключить весь звук", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  expect(await savedSound(page)).toMatchObject({ sound: "off", soundOrigin: "explicit", levelsMode: "custom", levels: { music: 24, nature: 55, effects: 0 } });
  expect(await page.evaluate(() => (window as any).__audioTest.plays.length)).toBe(0);
});
