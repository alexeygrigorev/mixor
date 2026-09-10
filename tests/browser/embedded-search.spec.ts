import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { woodlands } from "../../src/search-data";
import { originalsTest } from "./fixtures/originals-persistence";

async function start(page: Page, scene = "forest") {
  await page.goto(`/#world/physarum/${scene}`);
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
}
async function capture(page: Page, name: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
    await Promise.all([...new Set([...document.querySelectorAll("svg image")].map(image => image.getAttribute("href")!))].map(async path => {
      const image = new Image();
      image.src = path;
      await image.decode();
    }));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  const engine = page.context().browser()?.browserType().name() ?? "persistent";
  await page.screenshot({ path: `tmp/embedded-search/${engine}/${name}.png` });
}
async function anchored(page: Page, scene: (typeof woodlands)[number]) {
  await expect
    .poll(() =>
      page.locator(".search-scene").evaluate((element, spots) => {
        const world = element
          .querySelector(".search-world")!
          .getBoundingClientRect();
        return spots.every((spot) => {
          const box = element
            .querySelector(`[data-find="${spot.id}"]`)!
            .getBoundingClientRect();
          return (
            Math.abs(
              box.x + box.width / 2 - (world.x + (world.width * spot.x) / 100),
            ) < 1 &&
            Math.abs(
              box.y +
                box.height / 2 -
                (world.y + (world.height * spot.y) / 100),
            ) < 1 &&
            box.width >= 48 &&
            box.height >= 48 &&
            box.left >= 0 &&
            box.top >= 70 &&
            box.right <= innerWidth &&
            box.bottom <= innerHeight
          );
        });
      }, scene.spots),
    )
    .toBe(true);
}
async function magnifierFits(page: Page) {
  await expect
    .poll(() =>
      page.locator(".search-magnifier").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.left >= 0 &&
          box.top >= 70 &&
          box.right <= innerWidth + 1 &&
          box.bottom <= innerHeight &&
          element.scrollWidth <= element.clientWidth + 1
        );
      }),
    )
    .toBe(true);
  for (const control of await page.locator(".search-magnifier button").all()) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeInViewport({ ratio: 0.99 });
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
}

test("embedded search: unchanged backgrounds and finite rendered evidence", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "phone",
    "One finite matrix covers all required viewports.",
  );
  test.setTimeout(90000);
  // Pinned to the pre-U59 pictures: a clean checkout does not need review scratch files.
  const backgrounds = [
    [
      "forest",
      "80fc025be41c850bb39cc2799b6cb658ab25afa7852948835b2c90fa07470b74",
      "1a7e062a06b6bb42b4fe806c26e9afe5b2adc85bad2c4365a069a43c9aeb89cd",
    ],
    [
      "stump",
      "0b7fd07902c8d04cb9486b0ed623de9a51850a18a36fb3e770d155ade31698f8",
      "8bea7242a78abad37528acd55ee144197909cbefae1b2bc681f1b787922f817c",
    ],
    [
      "leaves",
      "0306aa1e2e32c56569632105a3b19156fe2d147762c8cbc9637c23a491a5dd5d",
      "a5e39703a34813c1aab9ec20fb0ae626188e3c8cb835e49d2115db395c230c79",
    ],
    [
      "roots",
      "6e85091ba3e9508d13cceaaa0f4b4d1baa396529ffd4dfce4322c3e2228861b9",
      "e0bedf8700533f7b9cf892151d9dfb697e14202e01a256aec4fff83c6ed7020d",
    ],
    [
      "bark",
      "8c8e8fbf643e3dd4d51764674ac864e99ea2b7109c8acc1416bcac99a6cbfc9c",
      "4407c854199562258f08e1a650206eb7ef586086997b21f8a315a215d164f01d",
    ],
  ];
  for (const [scene, sourceHash, runtimeHash] of backgrounds) {
    for (const [path, hash] of [
      [`content/artwork/search-${scene}.png`, sourceHash],
      [`public/assets/art/search-${scene}.webp`, runtimeHash],
    ])
      expect(
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ).toBe(hash);
  }
  await start(page);
  const viewports = [
    { name: "phone", width: 390, height: 844 },
    { name: "tablet", width: 1024, height: 768 },
    { name: "landscape", width: 844, height: 390 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const scene of woodlands) {
      // Each resting capture is a genuine fresh replay, never CSS-hidden finds.
      await page.goto(`/#world/physarum/${scene.id}`);
      await page
        .getByRole("button", { name: "Назад к выбору места", exact: true })
        .click();
      await page
        .getByRole("button", { name: `Искать: ${scene.title}`, exact: true })
        .click();
      await expect(page.locator(".hiding-place.is-found")).toHaveCount(0);
      await anchored(page, scene);
      await expect(page.locator(".rain-streaks")).toHaveCount(
        scene.weather === "rain" ? 1 : 0,
      );
      await expect(page.locator(".scene-weather")).toHaveCSS(
        "pointer-events",
        "none",
      );
      await capture(page, `${viewport.name}-${scene.id}-resting`);
      const reported = {stump:"stump-stemonitis", leaves:"leaves-fuligo", bark:"bark-tubifera"};
      const selectedId = reported[scene.id as keyof typeof reported] ?? scene.spots[0].id;
      await page.locator(`[data-find="${selectedId}"]`).tap();
      await magnifierFits(page);
      await capture(page, `${viewport.name}-${scene.id}-selected`);
      await page.getByRole("button", { name: "Закрыть увеличение" }).click();
    }
  }
  await page.setViewportSize({ width: 1536, height: 864 });
  // Reset the forest itself, not the last woodland visited by the matrix.
  await page.goto("/#world/physarum/forest");
  await page.getByRole("button", { name: "Назад к выбору места" }).click();
  await page
    .getByRole("button", { name: `Искать: ${woodlands[0].title}`, exact: true })
    .click();
  await expect(page.locator(".hiding-place.is-found")).toHaveCount(0);
  await anchored(page, woodlands[0]);
  await capture(page, "wide-forest-resting");
  await page.locator(".hiding-place").first().click();
  await magnifierFits(page);
  await capture(page, "wide-forest-selected");
});

test("embedded search: all-found collapsed, keyboard, rotation and enlarged text", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "phone", "Includes phone and rotated phone.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page, "roots");
  await expect(page.locator(".rain-streaks > span").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  for (const clue of await page.locator(".hiding-place").all()) {
    await clue.focus();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("button", { name: "Закрыть увеличение" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(clue).toBeFocused();
    await expect(clue).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await capture(page, "phone-roots-all-found-collapsed-keyboard");
  const first = page.locator(".hiding-place").first();
  await first.focus();
  await page.keyboard.press("Enter");
  await page.setViewportSize({ width: 844, height: 390 });
  await anchored(page, woodlands[3]);
  await magnifierFits(page);
  await capture(page, "rotated-roots-selected-reduced");
  await page.setViewportSize({ width: 390, height: 844 });
  await anchored(page, woodlands[3]);
  await page.locator(".search-scene").evaluate((scene) => {
    const fonts = [...scene.querySelectorAll<HTMLElement>("*")]
      .filter((el) => el.namespaceURI === "http://www.w3.org/1999/xhtml")
      .map((el) => [el, parseFloat(getComputedStyle(el).fontSize)] as const);
    for (const [el, font] of fonts) el.style.fontSize = `${font * 2}px`;
  });
  await magnifierFits(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await capture(page, "phone-roots-selected-text200");
  await page.getByRole("button", { name: "Закрыть увеличение" }).click();
  await expect(first).toBeFocused();
  await first.tap();
  await page
    .getByRole("button", { name: "Узнать больше", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Назад: ${woodlands[3].title}`, exact: true })
    .click();
  await expect(first).toBeFocused();
  await expect(page.locator(".hiding-place.is-found")).toHaveCount(3);
});

originalsTest(
  "embedded search: reset only exited place, preserve other finds, originals and development",
  async ({ page }) => {
    await start(page);
    const journey = {
      visited: ["physarum/spore", "didymium/division"],
      discoveries: [
        {
          id: "synthetic-study",
          taxonId: "physarum",
          mediaId: "synthetic-photo",
          question: "Synthetic question",
          answer: "Synthetic answer",
          note: "Synthetic fixture",
          createdAt: "2026-09-10T12:00:00Z",
        },
      ],
    };
    await page.evaluate(async (journey) => {
      localStorage.setItem(
        "mixor-search-v1",
        JSON.stringify(["roots-tubifera"]),
      );
      localStorage.setItem("mixor-journey-v2", JSON.stringify(journey));
      const modulePath = "/src/storage.ts";
      const { saveObservation } = await import(/* @vite-ignore */ modulePath);
      await saveObservation({
        id: "synthetic-search-preservation",
        title: "Synthetic original",
        note: "Test only",
        locationLabel: "",
        observedAt: "2026-09-10",
        createdAt: "2026-09-10T12:00:00Z",
        status: "local_only",
        photos: [
          {
            name: "synthetic.svg",
            type: "image/svg+xml",
            blob: new Blob(
              [
                '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="green"/></svg>',
              ],
              { type: "image/svg+xml" },
            ),
          },
        ],
      });
    }, journey);
    await page.reload();
    for (const clue of await page.locator(".hiding-place").all()) {
      await clue.click();
      await page.getByRole("button", { name: "Закрыть увеличение" }).click();
    }
    await page.getByRole("button", { name: /^Следующее место:/ }).click();
    await page.getByRole("button", { name: /^Предыдущее место:/ }).click();
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(3);
    await page.reload();
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(3);
    await page.getByRole("button", { name: "Назад к выбору места" }).click();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("mixor-search-v1")!),
      ),
    ).toEqual(["roots-tubifera"]);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("mixor-journey-v2")!),
      ),
    ).toEqual(journey);
    await page
      .getByRole("button", {
        name: `Искать: ${woodlands[0].title}`,
        exact: true,
      })
      .click();
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(0);
    await page.locator(".hiding-place").first().click();
    await page.goBack();
    await expect(page.locator(".woodland-chooser")).toBeVisible();
    await page.goForward();
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("mixor-search-v1")!),
      ),
    ).toEqual(["roots-tubifera"]);
    const original = await page.evaluate(async () => {
      const modulePath = "/src/storage.ts";
      const { listObservations } = await import(/* @vite-ignore */ modulePath);
      const records = await listObservations();
      return {
        ids: records.map((record: { id: string }) => record.id),
        bytes: await records[0].photos[0].blob.text(),
      };
    });
    expect(original).toEqual({
      ids: ["synthetic-search-preservation"],
      bytes:
        '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="green"/></svg>',
    });
  },
);

test("embedded search: small phone hit areas and every magnifier action fit", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "phone", "Includes both small phone sizes.");
  await start(page);
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    for (const scene of woodlands) {
      await page.goto(`/#world/physarum/${scene.id}`);
      await anchored(page, scene);
      for (const clue of await page.locator(".hiding-place").all()) {
        await clue.tap();
        await magnifierFits(page);
        await page.getByRole("button", { name: "Закрыть увеличение" }).click();
        await expect(clue).toBeFocused();
      }
    }
  }
});
