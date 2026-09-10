import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { woodlands } from "../../src/search-data";
import { scientificNames } from "../../src/taxonomy";

async function start(page: Page, path = "/") {
  await page.goto(path);
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
}
async function shot(page: Page, info: TestInfo, label: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.screenshot({ path: info.outputPath(`${label}.png`) });
}
async function forest(page: Page, index: number) {
  const woodland = woodlands[index];
  await expect(page.locator(".search-scene")).toHaveAccessibleName(
    `${woodland.title}: поиск миксомицетов`,
  );
  await expect(page.locator(".search-places")).toHaveAccessibleName(
    `Места поиска. Сейчас: ${woodland.title}`,
  );
  await expect(page.locator(".scene-weather")).toHaveAttribute(
    "data-weather",
    woodland.weather,
  );
  await expect(page.locator(".hiding-place")).toHaveCount(3);
}

test("in-mode scene switching wraps both ways, retains finds and returns through the chooser", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Найти в лесу", exact: false })
    .click();
  await page
    .getByRole("button", { name: `Искать: ${woodlands[0].title}` })
    .click();
  for (let index = 0; index < woodlands.length; index++) {
    await forest(page, index);
    await page.locator(".hiding-place").first().tap();
    await page.getByRole("button", { name: /^Следующее место:/ }).tap();
  }
  await forest(page, 0);
  for (let index = woodlands.length - 1; index >= 0; index--) {
    const previous = page.getByRole("button", { name: /^Предыдущее место:/ });
    await previous.focus();
    await page.keyboard.press("Enter");
    await forest(page, index);
    await expect(page.locator(".hiding-place").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await page.reload();
  await forest(page, 0);
  await expect(page.locator(".hiding-place").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goBack();
  await expect(page.locator(".woodland-chooser")).toBeVisible();
  await page.goForward();
  await forest(page, 0);
  await page
    .getByRole("button", { name: "Назад к выбору места", exact: true })
    .click();
  await expect(page.locator(".woodland-chooser")).toBeVisible();
  await page
    .getByRole("button", { name: "Назад на главный экран", exact: true })
    .click();
  await expect(page.locator(".activity-home")).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("mixor-search-v1")!).length,
    ),
  ).toBe(5);
});

test("found information, photos and development preserve originating woodland through reload and browser Back", async ({
  page,
}, info) => {
  const woodland = woodlands[3];
  const spot = woodland.spots[0];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page
    .getByRole("button", { name: "Найти в лесу", exact: false })
    .click();
  await page
    .getByRole("button", { name: `Искать: ${woodlands[2].title}` })
    .click();
  await page.getByRole("button", { name: /^Следующее место:/ }).click();
  await forest(page, 3);
  const circle = page.locator(`[data-find="${spot.id}"]`);
  await circle.focus();
  await page.keyboard.press("Enter");
  await expect(circle).toHaveAttribute("aria-pressed", "true");
  await expect(circle).toHaveAccessibleName(
    `Узнать больше: ${scientificNames[spot.taxon].name}`,
  );
  await page.keyboard.press("Space");
  await expect(page.locator(".portrait-scene h1")).toHaveText(
    scientificNames[spot.taxon].name,
  );
  await expect(page.locator(".specimen-notes")).toContainText(
    "Как он развивается?",
  );
  await shot(page, info, "found-information");
  await page.reload();
  await page
    .getByRole("button", { name: "Настоящее фото", exact: true })
    .click();
  await expect(page.locator(".photo-zoom img")).toBeVisible();
  await page.getByRole("button", { name: "Иллюстрация", exact: true }).click();
  await page
    .getByRole("button", { name: "Как он развивается?", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Следующий этап", exact: true })
    .click();
  const stageUrl = page.url();
  const photo = page.getByRole("button", {
    name: "Посмотреть реальные фотографии",
  });
  await photo.click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    scientificNames[spot.taxon].name,
  );
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
  await expect(page).toHaveURL(stageUrl);
  await page.reload();
  await page
    .getByRole("button", { name: "Назад к организму", exact: true })
    .click();
  await expect(page.locator(".portrait-scene h1")).toHaveText(
    scientificNames[spot.taxon].name,
  );
  await page.goBack();
  await forest(page, 3);
  await expect(circle).toHaveAttribute("aria-pressed", "true");
  await expect(circle).toBeFocused();
  await circle.tap();
  await page.reload();
  await page
    .getByRole("button", { name: `Назад: ${woodland.title}`, exact: true })
    .click();
  await forest(page, 3);
  await expect(circle).toBeFocused();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mixor-search-v1")!),
    ),
  ).toEqual([spot.id]);
});

test("direct links have activity parents and a tree portrait retains its tree context", async ({
  page,
}) => {
  await start(page, "/#world/physarum/bark");
  await page
    .getByRole("button", { name: "Назад к выбору места", exact: true })
    .click();
  await expect(page.locator(".woodland-chooser")).toBeVisible();
  await page
    .getByRole("button", { name: "Назад на главный экран", exact: true })
    .click();
  await expect(page.locator(".activity-home")).toBeVisible();
  await page.goto("/#life/didymium/division");
  await page
    .getByRole("button", { name: "Назад к выбору вида", exact: true })
    .click();
  await expect(page.locator(".species-chooser")).toBeVisible();
  await page.goto("/#portrait/stemonitis/spore");
  await page
    .getByRole("button", { name: "Назад к дереву", exact: true })
    .click();
  const group = page.locator("summary").filter({ hasText: /^Physaraceae/ });
  await group.click();
  await page
    .getByRole("button", {
      name: "Рассмотреть: Stemonitis axifera",
      exact: true,
    })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Назад к дереву", exact: true })
    .click();
  await expect(group.locator("..")).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Источники", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    scientificNames.stemonitis.placementNote!,
  );
});

test("woodland ambience continues through found information and photos, and uncover fires only once", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const audio: HTMLAudioElement[] = [];
    const plays: string[] = [];
    Object.assign(window, { navigationAudio: audio, navigationPlays: plays });
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(src?: string) {
        super(src);
        audio.push(this);
        const play = this.play.bind(this);
        this.play = () => {
          plays.push(this.src);
          return play();
        };
      }
    };
  });
  await page.goto("/#world/physarum/roots");
  await page
    .getByRole("button", { name: "Начать со звуками леса", exact: true })
    .click();
  const rainState = () =>
    page.evaluate(() => {
      const audio = (
        window as unknown as { navigationAudio: HTMLAudioElement[] }
      ).navigationAudio;
      const rain = audio.find(
        (element) => element.loop && element.src.includes("rain"),
      );
      return rain
        ? {
            time: rain.currentTime,
            paused: rain.paused,
            volume: rain.volume,
            ready: rain.readyState,
            count: audio.filter(
              (element) => element.loop && element.src.includes("rain"),
            ).length,
          }
        : null;
    });
  await expect
    .poll(async () => (await rainState())?.time ?? 0)
    .toBeGreaterThan(0);
  const firstRain = (await rainState())!;
  expect(firstRain.ready).toBeGreaterThanOrEqual(3);
  const effectCounts = () =>
    page.evaluate(() => {
      const plays = (window as unknown as { navigationPlays: string[] })
        .navigationPlays;
      return {
        uncover: plays.filter((src) => src.endsWith("/uncover-mix.mp3")).length,
        tap: plays.filter((src) => src.endsWith("/leaf-friction-v3-mix.mp3"))
          .length,
      };
    });
  const before = await effectCounts();
  await page.locator(".hiding-place").first().tap();
  expect(await effectCounts()).toEqual({
    uncover: before.uncover + 1,
    tap: before.tap,
  });
  await page.locator(".hiding-place").first().tap();
  await expect(page.locator(".portrait-scene")).toBeVisible();
  await page
    .getByRole("button", { name: "Настоящее фото", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Как он развивается?", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Посмотреть реальные фотографии" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(async () => (await rainState())?.time ?? 0)
    .toBeGreaterThan(firstRain.time);
  expect(await rainState()).toMatchObject({
    paused: false,
    count: 1,
    volume: firstRain.volume,
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Назад к организму", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Назад: ${woodlands[3].title}`, exact: true })
    .click();
  expect((await effectCounts()).uncover).toBe(before.uncover + 1);
  await page.getByRole("button", { name: /^Предыдущее место:/ }).click();
  await forest(page, 2);
  await expect
    .poll(rainState)
    .toMatchObject({ paused: true, volume: 0, count: 1 });
});

test("enlarged development header and photo attribution stay readable and reachable", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await start(page, "/#life/didymium/division");
  for (const viewport of [page.viewportSize()!, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await page.evaluate(() => {
      const sizes = [
        ...document.querySelectorAll<HTMLElement>(".development-focus *"),
      ]
        .filter(
          (element) => element.namespaceURI === "http://www.w3.org/1999/xhtml",
        )
        .map(
          (element) =>
            [element, parseFloat(getComputedStyle(element).fontSize)] as const,
        );
      for (const [element, size] of sizes)
        element.style.fontSize = `${size * 2}px`;
      document.querySelector(".development-focus")!.scrollTop = 0;
    });
    const title = page.locator(".development-name");
    await expect(title).toBeInViewport({ ratio: 1 });
    expect(
      await title.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".step-button")
        .evaluateAll((buttons) =>
          buttons.every(
            (button) => button.scrollWidth <= button.clientWidth + 1,
          ),
        ),
    ).toBe(true);
    const caption = (await page.locator(".development-caption").boundingBox())!;
    const controls = (await page
      .locator(".development-controls")
      .boundingBox())!;
    expect(caption.y + caption.height).toBeLessThanOrEqual(controls.y + 1);
    await shot(page, info, `${viewport.width}-text200-header`);
    const next = page.getByRole("button", {
      name: "Следующий этап",
      exact: true,
    });
    await next.scrollIntoViewIfNeeded();
    // Chromium rounds scroll offsets to pixels; a fractional border edge can
    // remain under one pixel outside while the whole label/target is reachable.
    await expect(next).toBeInViewport({ ratio: 0.99 });
    await shot(page, info, `${viewport.width}-text200-controls`);
    await next.click();
    await expect(page).toHaveURL(/life\/didymium\/young$/);
    await page.reload();
    await page
      .getByRole("button", { name: "Посмотреть реальные фотографии" })
      .click();
    for (const link of await page.locator(".photo-credit a").all()) {
      await link.scrollIntoViewIfNeeded();
      const bounds = (await link.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(48);
      expect(bounds.height).toBeGreaterThanOrEqual(48);
      expect(
        await link.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(14);
      await expect(link).toBeInViewport({ ratio: 1 });
    }
    await shot(page, info, `${viewport.width}-photo-credits`);
    await page.keyboard.press("Escape");
    await page.goto("/#life/didymium/division");
  }
});

test("enlarged search controls and discovered information remain reachable", async ({
  page,
}, info) => {
  await start(page, "/#world/physarum/forest");
  const enlarge = async () =>
    page.locator("main").evaluate((main) => {
      const sizes = [...main.querySelectorAll<HTMLElement>("*")]
        .filter(
          (element) => element.namespaceURI === "http://www.w3.org/1999/xhtml",
        )
        .map(
          (element) =>
            [element, parseFloat(getComputedStyle(element).fontSize)] as const,
        );
      for (const [element, size] of sizes)
        element.style.fontSize = `${size * 2}px`;
    });
  for (const circle of await page.locator(".hiding-place").all())
    await circle.tap();
  await enlarge();
  const back = (await page
    .getByRole("button", { name: "Назад к выбору места", exact: true })
    .boundingBox())!;
  const places = (await page.locator(".search-places").boundingBox())!;
  expect(back.x + back.width).toBeLessThanOrEqual(places.x);
  expect(places.x + places.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await shot(page, info, "search-text200");
  await page.locator(".hiding-place").first().tap();
  await enlarge();
  const name = page.locator(".portrait-scene h1");
  await expect(name).toBeInViewport({ ratio: 1 });
  expect(
    await page
      .locator(".portrait-scene")
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  await shot(page, info, "found-information-text200");
  const development = page.getByRole("button", {
    name: "Как он развивается?",
    exact: false,
  });
  await development.scrollIntoViewIfNeeded();
  await development.click();
  await expect(page.locator(".development-name")).toHaveText(
    scientificNames.physarum.name,
  );
});
