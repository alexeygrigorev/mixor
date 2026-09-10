import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { taxa } from "../../src/data";
import { lifeCycles, stageSequence, stageBrief } from "../../src/life-data";

async function start(page: Page, path: string) {
  await page.goto(path);
  const enter = page.getByRole("button", {
    name: "Начать в тишине",
    exact: true,
  });
  if (await enter.isVisible()) await enter.click();
}

async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.screenshot({
    path: info.outputPath(`${name}.jpg`),
    type: "jpeg",
    quality: 85,
  });
}

async function composition(page: Page) {
  const viewport = page.viewportSize()!;
  const art = page.locator(".development-image .art");
  const image = (await art.boundingBox())!;
  const caption = (await page.locator(".development-caption").boundingBox())!;
  const controls = (await page.locator(".development-controls").boundingBox())!;
  expect(image.x).toBeGreaterThanOrEqual(0);
  expect(image.y).toBeGreaterThanOrEqual(0);
  expect(image.x + image.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(image.y + image.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(image.width * image.height).toBeGreaterThan(
    caption.width * caption.height,
  );
  const aspect = await art.evaluate((element) =>
    Number(getComputedStyle(element).getPropertyValue("--tile-aspect")),
  );
  expect(image.width / image.height).toBeCloseTo(aspect, 2);
  expect(caption.y + caption.height).toBeLessThanOrEqual(controls.y + 1);
  for (const control of await page
    .locator(".development-focus button:visible")
    .all()) {
    const bounds = (await control.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(48);
    expect(bounds.height).toBeGreaterThanOrEqual(48);
    await expect(control).toBeInViewport({ ratio: 0.99 });
  }
  for (const arrow of await page.locator(".step-button").all()) {
    expect((await arrow.boundingBox())!.width).toBeLessThanOrEqual(64);
  }
  expect(
    await page
      .locator(".development-focus")
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  await expect(page.locator(".development-stage-picker")).toBeHidden();
  await expect(
    page.locator(".hud, .game-nav, .stage-notes, .material-switch"),
  ).toHaveCount(0);
}

test("every supplied stage in all eight cycles stays image-led with compact manual controls", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const taxon of taxa) {
    const stages = lifeCycles[taxon.id].stages.filter(
      (stage) => stage.id !== "rest",
    );
    expect(stages.map((stage) => stage.id)).toEqual([...stageSequence]);
    await start(page, `/#life/${taxon.id}/${stages[0].id}`);
    for (const [index, stage] of stages.entries()) {
      await expect(page).toHaveURL(new RegExp(`life/${taxon.id}/${stage.id}$`));
      await expect(page.locator(".development-name")).toHaveText(
        taxon.latinName,
      );
      await expect(page.locator(".development-caption h1")).toHaveText(
        stage.label,
      );
      await expect(page.locator(".development-caption > p")).toHaveText(
        stageBrief[stage.id],
      );
      await expect(page.locator(".stage-position")).toHaveText(
        `${index + 1} / ${stages.length}`,
      );
      await expect(page.locator(".model-note")).toContainText(
        "Реконструкция ИИ",
      );
      await capture(page, info, `${taxon.id}-${stage.id}`);
      await composition(page);
      if (index === 0)
        await expect(
          page.getByRole("button", { name: "Предыдущий этап", exact: true }),
        ).toBeDisabled();
      await page
        .getByRole("button", {
          name:
            index === stages.length - 1 ? "Снова к споре" : "Следующий этап",
          exact: true,
        })
        .click();
    }
    await expect(page).toHaveURL(new RegExp(`life/${taxon.id}/spore$`));
  }
  expect(errors).toEqual([]);
});

test("stage chooser, keyboard, swipe, deep links and optional views preserve the current stage", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page, "/#life/didymium/division");
  const chooser = page.getByRole("button", { name: /^Выбрать этап\./ });
  await chooser.focus();
  await page.keyboard.press("Enter");
  await expect(chooser).toHaveAttribute("aria-expanded", "true");
  const rail = page.getByRole("group", { name: "Этапы развития", exact: true });
  await expect(rail.getByRole("button")).toHaveCount(stageSequence.length);
  await expect(rail.locator('[aria-current="step"]')).toBeFocused();
  await expect(rail.locator('[aria-current="step"]')).toBeInViewport({
    ratio: 1,
  });
  await capture(page, info, "stage-chooser");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/life\/didymium\/young$/);
  await expect(chooser).toBeFocused();
  await expect(rail).toBeHidden();
  // Repeated direct selections must update image, caption, count and URL
  // together, without retaining a stale selected-stage focus target.
  const directStages = lifeCycles.didymium.stages.filter(
    (stage) => stage.id !== "rest",
  );
  for (const id of ["fruit", "spore", "spreading", "veins", "zygote"]) {
    const index = directStages.findIndex((stage) => stage.id === id);
    await chooser.click();
    const target = rail.getByRole("button").nth(index);
    await target.scrollIntoViewIfNeeded();
    await target.click();
    const stage = directStages[index];
    await expect(page).toHaveURL(new RegExp(`life/didymium/${stage.id}$`));
    await expect(page.locator(".development-caption h1")).toHaveText(
      stage.label,
    );
    await expect(page.locator(".development-image .art")).toHaveAccessibleName(
      `${stage.label}. Учебная реконструкция ИИ, не фотография`,
    );
    await expect(page.locator(".stage-position")).toHaveText(
      `${index + 1} / ${directStages.length}`,
    );
    await expect(chooser).toBeFocused();
  }
  await chooser.click();
  const last = rail.getByRole("button").last();
  await last.scrollIntoViewIfNeeded();
  await last.click();
  await expect(page).toHaveURL(/life\/didymium\/fruit$/);
  await chooser.click();
  await page.keyboard.press("Escape");
  await expect(chooser).toBeFocused();
  await expect(rail).toBeHidden();
  await page
    .getByRole("button", { name: "Снова к споре", exact: true })
    .click();
  const image = (await page.locator(".development-image").boundingBox())!;
  await page.mouse.move(
    image.x + image.width * 0.75,
    image.y + image.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    image.x + image.width * 0.25,
    image.y + image.height / 2,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(page).toHaveURL(/life\/didymium\/cells$/);
  const touch = await page.context().newCDPSession(page);
  async function swipe(from: number, to: number) {
    const bounds = (await page.locator(".development-image").boundingBox())!;
    const y = bounds.y + bounds.height / 2;
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: bounds.x + bounds.width * from, y }],
    });
    for (let step = 1; step <= 8; step++) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: bounds.x + bounds.width * (from + ((to - from) * step) / 8), y },
        ],
      });
    }
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await swipe(0.75, 0.25);
  await expect(page).toHaveURL(/life\/didymium\/fusion$/);
  await swipe(0.25, 0.75);
  await expect(page).toHaveURL(/life\/didymium\/cells$/);
  await touch.detach();
  await page.reload();
  await expect(page).toHaveURL(/life\/didymium\/cells$/);
  const photo = page.getByRole("button", {
    name: "Посмотреть реальные фотографии",
    exact: true,
  });
  await photo.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".photo-zoom img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
  await expect(page).toHaveURL(/life\/didymium\/cells$/);
  const sources = page.getByRole("button", {
    name: "О реконструкции и источниках",
    exact: true,
  });
  await sources.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sources).toBeFocused();
  await expect(page).toHaveURL(/life\/didymium\/cells$/);
  await page
    .getByRole("button", { name: "Назад к выбору вида", exact: true })
    .click();
  await expect(page.locator(".species-chooser")).toBeVisible();
});

test("wide and short-landscape representative cycles keep image and controls usable together", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const viewports =
    info.project.name === "tablet"
      ? [
          { width: 1440, height: 900 },
          { width: 1536, height: 864 },
        ]
      : [{ width: 844, height: 390 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const id of ["physarum", "tubifera"] as const) {
      const stages = lifeCycles[id].stages.filter(
        (stage) => stage.id !== "rest",
      );
      await start(page, `/#life/${id}/spore`);
      for (const [index, stage] of stages.entries()) {
        await expect(page).toHaveURL(new RegExp(`life/${id}/${stage.id}$`));
        await capture(page, info, `${viewport.width}-${id}-${stage.id}`);
        await composition(page);
        if (viewport.width >= 1400) {
          expect(
            (await page.locator(".development-image .art").boundingBox())!
              .height,
          ).toBeGreaterThan(viewport.height * 0.75);
        }
        await page
          .getByRole("button", {
            name:
              index === stages.length - 1 ? "Снова к споре" : "Следующий этап",
            exact: true,
          })
          .click();
      }
    }
  }
});

test("enlarged names, captions and dynamic chooser reflow without hiding content", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  for (const viewport of [page.viewportSize()!, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await start(page, "/#life/physarum/division");
    await page.reload();
    await page.evaluate(() => {
      const values = [
        ...document.querySelectorAll<HTMLElement>(".development-focus *"),
      ]
        .filter(
          (element) => element.namespaceURI === "http://www.w3.org/1999/xhtml",
        )
        .map(
          (element) =>
            [element, parseFloat(getComputedStyle(element).fontSize)] as const,
        );
      for (const [element, size] of values)
        element.style.fontSize = `${size * 2}px`;
      document.querySelector(".development-focus")!.scrollTop = 0;
    });
    await expect(page.locator(".development-name")).toBeInViewport({
      ratio: 1,
    });
    await capture(page, info, `${viewport.width}-text200-top`);
    const next = page.getByRole("button", {
      name: "Следующий этап",
      exact: true,
    });
    await next.scrollIntoViewIfNeeded();
    await expect(next).toBeInViewport({ ratio: 0.99 });
    const caption = (await page.locator(".development-caption").boundingBox())!;
    const header = (await page.locator(".development-top").boundingBox())!;
    const controls = (await page
      .locator(".development-controls")
      .boundingBox())!;
    expect(caption.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(caption.y + caption.height).toBeLessThanOrEqual(controls.y + 1);
    expect(
      await page
        .locator(".development-focus")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await capture(page, info, `${viewport.width}-text200-controls`);
    const chooser = page.getByRole("button", { name: /^Выбрать этап\./ });
    await chooser.click();
    const last = page
      .getByRole("group", { name: "Этапы развития", exact: true })
      .getByRole("button")
      .last();
    await last.scrollIntoViewIfNeeded();
    await capture(page, info, `${viewport.width}-text200-chooser`);
    expect(
      await last.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    await last.click();
    await expect(page).toHaveURL(/life\/physarum\/fruit$/);
    await expect(chooser).toBeFocused();
  }
});

test("existing visit IDs survive the expanded stage count in the species chooser", async ({
  page,
}) => {
  const oldStages = [
    "spore",
    "cells",
    "fusion",
    "zygote",
    "division",
    "young",
    "network",
    "forming",
    "fruit",
  ];
  await page.addInitScript((stages) => {
    localStorage.setItem(
      "mixor-journey-v2",
      JSON.stringify({
        visited: stages.map((stage) => `physarum/${stage}`),
        discoveries: [],
      }),
    );
  }, oldStages);
  await start(page, "/#species/physarum/spore");
  const species = page.getByRole("button", {
    name: "Развитие: Badhamia polycephala",
    exact: true,
  });
  await expect(species).toContainText(
    `${oldStages.length} / ${stageSequence.length} этапов`,
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("mixor-journey-v2")!).visited,
    ),
  ).toEqual(oldStages.map((stage) => `physarum/${stage}`));
});
