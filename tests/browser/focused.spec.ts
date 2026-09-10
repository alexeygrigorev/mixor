import { test, expect, type Page } from "@playwright/test";
import { woodlands } from "../../src/search-data";
import { taxa } from "../../src/data";
import { stageSequence } from "../../src/life-data";
import { scientificNames } from "../../src/taxonomy";

async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth + 1 &&
        document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
}
async function circlesFit(page: Page) {
  await expect
    .poll(() =>
      page.locator(".hiding-place").evaluateAll((circles) => {
        const bounds = circles.map((circle) => circle.getBoundingClientRect());
        const back = document
          .querySelector(".search-scene .activity-back")!
          .getBoundingClientRect();
        return bounds.every(
          (box, index) =>
            box.width >= 48 &&
            Math.abs(box.width - box.height) < 1 &&
            box.left >= 10 &&
            box.top >= 10 &&
            box.right <= innerWidth - 10 &&
            box.bottom <= innerHeight - 10 &&
            (box.top >= back.bottom + 8 || box.left >= back.right + 8) &&
            bounds
              .slice(index + 1)
              .every(
                (other) =>
                  Math.hypot(
                    box.x + box.width / 2 - other.x - other.width / 2,
                    box.y + box.height / 2 - other.y - other.height / 2,
                  ) >=
                  (box.width + other.width) / 2 + 4,
              ),
        );
      }),
    )
    .toBe(true);
  await fits(page);
}

async function readyToCapture(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
}

test("five places, quiet scene navigation, circular discoveries and persistent finds through rotation", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  const originalViewport = page.viewportSize()!;
  for (const woodland of woodlands) {
    await page
      .getByRole("button", { name: "Найти в лесу", exact: false })
      .click();
    await page
      .getByRole("button", { name: `Искать: ${woodland.title}` })
      .click();
    await expect(
      page.locator(".hud, .game-nav, .world-heading, .life-invitation"),
    ).toHaveCount(0);
    await expect(page.locator(".search-scene button")).toHaveCount(
      woodland.spots.length + 3,
    );
    await expect(page.locator(".search-environment")).toHaveAttribute(
      "src",
      woodland.image,
    );
    await page.mouse.click(originalViewport.width / 2, 120);
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(0);
    for (const viewport of [
      originalViewport,
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 568, height: 320 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await circlesFit(page);
    }
    await readyToCapture(page);
    await page.screenshot({
      path: testInfo.outputPath(`${woodland.id}-landscape-covered.png`),
    });
    await page.setViewportSize(originalViewport);
    await circlesFit(page);
    await page.screenshot({
      path: testInfo.outputPath(`${woodland.id}-covered.png`),
    });
    for (const spot of woodland.spots) {
      const target = page.locator(`[data-find="${spot.id}"]`);
      await expect(target).toHaveAccessibleName(`Осмотреть: ${spot.label}`);
      await expect(target).toHaveCSS("border-radius", "50%");
      await expect(target.locator(".search-lens")).toHaveCSS(
        "border-radius",
        "50%",
      );
      await expect(target.locator(".natural-cover")).toHaveCSS("opacity", "1");
      await expect(target.locator(".natural-cover")).toHaveCSS(
        "clip-path",
        "none",
      );
      await expect(target.locator(".hidden-organism")).toHaveCSS(
        "opacity",
        "0",
      );
      await expect(target.locator(".hidden-organism")).toHaveCSS(
        "mask-image",
        "none",
      );
      expect((await target.boundingBox())!.width).toBeGreaterThan(150);
      await target.tap();
      await expect(target).toHaveAttribute("aria-pressed", "true");
      await expect(target).toHaveAccessibleName(
        `Узнать больше: ${scientificNames[spot.taxon].name}`,
      );
      await expect(target.locator(".natural-cover")).toHaveCSS("opacity", "0");
      await expect(target.locator(".hidden-organism")).toHaveCSS(
        "opacity",
        "1",
      );
      await expect(target.locator(".hidden-organism .art")).toHaveCSS(
        "filter",
        "none",
      );
      await expect(page.locator(".search-scene [role=status]")).toHaveText(
        `Найдено: ${scientificNames[spot.taxon].name}. Коснись ещё раз, чтобы узнать больше.`,
      );
      await expect(target.locator(".search-found-invitation")).toHaveText(
        "Узнать",
      );
      await target.tap();
      await expect(page.locator(".portrait-scene h1")).toHaveText(
        scientificNames[spot.taxon].name,
      );
      await page
        .getByRole("button", { name: `Назад: ${woodland.title}`, exact: true })
        .click();
      await expect(target).toHaveAttribute("aria-pressed", "true");
    }
    await circlesFit(page);
    await page.screenshot({
      path: testInfo.outputPath(`${woodland.id}-revealed.png`),
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await circlesFit(page);
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(3);
    await page.screenshot({
      path: testInfo.outputPath(`${woodland.id}-landscape-revealed.png`),
    });
    await page.setViewportSize(originalViewport);
    await page.reload();
    await expect(page.locator(".hiding-place.is-found")).toHaveCount(3);
    await page.getByRole("button", { name: "Назад к выбору места" }).click();
    await expect(page.locator(".woodland-chooser")).toBeVisible();
    await page.getByRole("button", { name: "Назад на главный экран" }).click();
    await expect(page.locator(".activity-home")).toBeVisible();
  }
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mixor-search-v1")!),
  );
  expect(stored).toHaveLength(15);
  expect(new Set(stored).size).toBe(15);
  expect(errors).toEqual([]);
});

test("forest circles uncover with keyboard and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#world/physarum/forest");
  await page
    .getByRole("button", { name: "Начать в тишине", exact: true })
    .click();
  const circles = page.locator(".hiding-place");
  await page.keyboard.press("Tab");
  for (let index = 0; index < 3; index++) {
    const circle = circles.nth(index);
    await expect(circle).toBeFocused();
    await expect(circle).toHaveCSS("outline-style", "solid");
    await page.keyboard.press(index === 1 ? "Space" : "Enter");
    await expect(circle).toHaveAttribute("aria-pressed", "true");
    await expect(circle.locator(".natural-cover")).toHaveCSS("opacity", "0");
    await expect(circle.locator(".hidden-organism")).toHaveCSS("opacity", "1");
    await expect(circle.locator(".hidden-organism")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await page.keyboard.press("Tab");
  }
  await expect(
    page.getByRole("button", { name: "Назад к выбору места" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".woodland-chooser")).toBeVisible();
});

test("eight nine-stage cycles, scientific names, distinct growth stills and quiet photo peek", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  for (const taxon of taxa) {
    await page.getByRole("button", { name: "Развитие", exact: false }).click();
    await page
      .getByRole("button", {
        name: `Развитие: ${taxon.latinName}`,
        exact: true,
      })
      .click();
    const views = new Set<string>();
    for (const [index, id] of stageSequence.entries()) {
      await expect(page).toHaveURL(new RegExp(`life/${taxon.id}/${id}$`));
      await expect(page.locator(".development-name")).toHaveText(
        taxon.latinName,
      );
      await expect(page.locator(".stage-position")).toHaveText(
        `${index + 1} / 9`,
      );
      await expect(
        page.locator(".hud, .game-nav, .stage-notes, .material-switch"),
      ).toHaveCount(0);
      const art = page.locator(".development-image .art");
      await expect(art.locator("img")).toBeVisible();
      await expect
        .poll(() =>
          art
            .locator("img")
            .evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
        )
        .toBe(true);
      views.add(
        await art.evaluate(
          (e) => e.getAttribute("style") + e.querySelector("img")!.src,
        ),
      );
      const b = (await art.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
      await fits(page);
      if (id === "division" || (taxon.id === "physarum" && id === "network")) {
        const peek = page.getByRole("button", {
          name: "Посмотреть реальные фотографии",
        });
        await peek.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.locator(".photo-zoom img")).toBeVisible();
        await expect(page.locator(".peek-context")).toContainText(
          id === "division" ? "не выбранного этапа" : "этой стадии",
        );
        await expect(
          page.getByRole("dialog").locator(".photo-credit a").first(),
        ).toHaveAttribute("href", /commons.wikimedia.org/);
        await page.keyboard.press("Escape");
        await expect(peek).toBeFocused();
        await expect(page).toHaveURL(new RegExp(`life/${taxon.id}/${id}$`));
      }
      await page
        .getByRole("button", {
          name: index === 8 ? "Снова к споре" : "Следующий этап",
          exact: true,
        })
        .click();
    }
    expect(views.size).toBe(9);
    await expect(page).toHaveURL(new RegExp(`life/${taxon.id}/spore$`));
    await page.getByRole("button", { name: "Назад к выбору вида" }).click();
    await expect(page.locator(".species-chooser")).toBeVisible();
    await page.getByRole("button", { name: "Назад на главный экран" }).click();
  }
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("mixor-journey-v2")!).visited.length,
    ),
  ).toBe(72);
  expect(errors).toEqual([]);
});

test("tree has genuine groupings and eight species destinations", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Дерево жизни", exact: false })
    .click();
  await expect(
    page.locator(".classification-branches > .taxonomy-node"),
  ).toHaveCount(2);
  await expect(page.locator(".species-leaf")).toHaveCount(8);
  await expect(page.locator(".classification-scroll")).not.toContainText(
    /Жёлтые облачка|Жёлтая сеть|Красные башенки|Лесные шарики/,
  );
  const family = page
    .locator("summary")
    .filter({ hasText: /^Physaraceae/ })
    .locator("..");
  await expect(family).toContainText("Badhamia polycephala");
  await expect(family).toContainText("Fuligo septica");
  for (const taxon of taxa) {
    await page
      .getByRole("button", {
        name: `Рассмотреть: ${taxon.latinName}`,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`portrait/${taxon.id}`));
    await expect(page.locator(".portrait-scene h1")).toHaveText(
      taxon.latinName,
    );
    await page
      .getByRole("button", { name: "Настоящее фото", exact: true })
      .click();
    await expect(page.locator(".photo-zoom img")).toBeVisible();
    await page
      .getByRole("button", { name: "Назад к дереву", exact: true })
      .click();
  }
});
