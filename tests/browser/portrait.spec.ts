import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { taxa } from "../../src/data";
import { scientificNames } from "../../src/taxonomy";
import { woodlands } from "../../src/search-data";

const output = "tmp/portrait-u66";
const evidenceRoot = (info: TestInfo) => `${output}/${info.project.use.browserName || "chromium"}`;

async function enter(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Начать в тишине", exact: true }).click();
}

async function capture(page: Page, info: TestInfo, name: string) {
  const directory = evidenceRoot(info);
  await mkdir(directory, { recursive: true });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => undefined)));
  });
  await page.screenshot({ path: `${directory}/${info.project.name}-${name}.png` });
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.locator(".portrait-scene").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}

test("all eight portraits expose correct identity, art, and development", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  const evidence = [];
  for (const [index, taxon] of taxa.entries()) {
    await page.goto(`/#portrait/${taxon.id}/spore`);
    const name = page.locator(".portrait-identity h1");
    await expect(name).toHaveText(scientificNames[taxon.id].name);
    await expect(name).toBeInViewport({ ratio: 1 });
    const synonym = scientificNames[taxon.id].synonym;
    if (synonym) await expect(page.locator(".portrait-identity .latin")).toContainText(synonym);
    await expect(page.locator(".portrait-summary")).toHaveText(taxon.summary);
    await expect(page.locator(".portrait-scene h2")).toHaveCount(0);
    const art = page.locator(".portrait-picture > .art");
    await expect(art.locator("img")).toHaveAttribute("src", "/assets/art/organisms-v2.webp");
    expect(await art.evaluate(el => [el.style.getPropertyValue("--column"), el.style.getPropertyValue("--row")])).toEqual([String(index % 4), String(Math.floor(index / 4))]);
    const artBox = (await art.boundingBox())!;
    expect(Math.min(artBox.width, artBox.height)).toBeGreaterThanOrEqual(240);
    const development = page.getByRole("button", { name: "Как он развивается?", exact: true });
    await expect(development).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("button", { name: "Наблюдать", exact: true })).toBeInViewport({ ratio: 1 });
    for (const action of await page.locator(".portrait-actions button").all()) {
      await expect(action).toHaveAccessibleName((await action.innerText()).trim());
    }
    await noHorizontalOverflow(page);
    await capture(page, info, `${taxon.id}-rest`);
    evidence.push({ taxon: taxon.id, name: await name.textContent(), art: artBox });
    await development.click();
    await expect(page).toHaveURL(new RegExp(`#life/${taxon.id}/spore$`));
    await expect(page.locator(".development-name")).toHaveText(scientificNames[taxon.id].name);
    await page.getByRole("button", { name: "Назад к организму", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#portrait/${taxon.id}/spore$`));
  }
  expect(errors).toEqual([]);
  await writeFile(`${evidenceRoot(info)}/${info.project.name}-all-species.json`, JSON.stringify(evidence, null, 2));
});

test("portrait photos, credits, full frame and discovery save stay usable", async ({ page }, info) => {
  await enter(page);
  await page.goto("/#portrait/arcyria/spore");
  const peek = page.getByRole("button", { name: "Настоящее фото", exact: true });
  await peek.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".photo-zoom img")).toBeVisible();
  expect((await page.locator(".photo-viewport").boundingBox())!.height).toBeGreaterThanOrEqual(240);
  await expect(page.locator(".portrait-photo-caption")).toHaveText(taxa.find(t => t.id === "arcyria")!.media[0].caption);
  for (const link of await page.locator(".portrait-scene .photo-credit a").all()) {
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
    await expect(link).toHaveAttribute("href", /^https:\/\//);
  }
  await capture(page, info, "arcyria-photo");
  await page.getByRole("button", { name: "Увеличить фото", exact: true }).click();
  await page.getByRole("button", { name: "Вернуть полный кадр", exact: true }).click();
  await expect(page.locator(".photo-zoom")).toHaveAttribute("style", /width: 100%/);
  await page.getByRole("button", { name: "Иллюстрация", exact: true }).click();
  await expect(peek).toBeFocused();
  const sources = page.getByRole("button", { name: "Источники и точность", exact: true });
  await sources.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(sources).toBeFocused();
  await capture(page, info, "arcyria-keyboard-focus");
  await page.getByRole("button", { name: "Наблюдать", exact: true }).click();
  await page.locator(".portrait-scene").evaluate(el => { el.scrollTop = 0; });
  expect((await page.locator(".photo-viewport").boundingBox())!.height).toBeGreaterThanOrEqual(240);
  await capture(page, info, "arcyria-observation");
  await page.getByRole("button", { name: "Не различаю", exact: true }).click();
  await expect(page.locator(".observation-feedback")).toContainText("Это тоже наблюдение");
  const save = page.getByRole("button", { name: "Записать открытие", exact: true });
  await save.scrollIntoViewIfNeeded();
  await capture(page, info, "arcyria-answer");
  await noHorizontalOverflow(page);
  await save.click();
  await expect(page.locator(".discovery-page")).toContainText("Не различаю");
  await page.reload();
  await page.locator(".journal-entry").click();
  await expect(page.locator(".discovery-page")).toContainText("Это тоже наблюдение");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("mixor-journey-v2")!).discoveries.length)).toBe(1);
  await capture(page, info, "arcyria-saved");
});

test("portrait landscape, wide and enlarged text preserve usable image and controls", async ({ page }, info) => {
  const short = info.project.name === "phone";
  await page.setViewportSize(short ? { width: 844, height: 390 } : { width: 1536, height: 864 });
  await enter(page);
  await page.goto("/#portrait/arcyria/spore");
  await expect(page.locator(".portrait-identity h1")).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Как он развивается?", exact: true })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Наблюдать", exact: true })).toBeInViewport({ ratio: 1 });
  const art = (await page.locator(".portrait-picture > .art").boundingBox())!;
  expect(Math.min(art.width, art.height)).toBeGreaterThanOrEqual(short ? 220 : 400);
  await noHorizontalOverflow(page);
  await capture(page, info, short ? "landscape-arcyria" : "wide-arcyria");
  await page.getByRole("button", { name: "Настоящее фото", exact: true }).click();
  expect((await page.locator(".photo-viewport").boundingBox())!.height).toBeGreaterThanOrEqual(short ? 190 : 300);
  await capture(page, info, short ? "landscape-photo" : "wide-photo");
  await page.getByRole("button", { name: "Наблюдать", exact: true }).click();
  await capture(page, info, short ? "landscape-observation" : "wide-observation");
  await page.getByRole("button", { name: "Не различаю", exact: true }).click();
  await page.getByRole("button", { name: "Записать открытие", exact: true }).scrollIntoViewIfNeeded();
  await capture(page, info, short ? "landscape-answer" : "wide-answer");
  await noHorizontalOverflow(page);

  await page.setViewportSize(short ? { width: 390, height: 844 } : { width: 1024, height: 768 });
  await page.goto("/#portrait/physarum/spore");
  // Start the independent enlarged-text/direct-link scenario at a fresh page,
  // not at the previous observation's retained local scroll position.
  await page.reload();
  await expect(page.locator(".portrait-identity h1")).toHaveText(scientificNames.physarum.name);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>(".portrait-scene *")];
    const sizes = nodes.map(el => parseFloat(getComputedStyle(el).fontSize));
    nodes.forEach((el, index) => { el.style.fontSize = `${sizes[index] * 2}px`; });
  });
  await expect(page.locator(".portrait-identity h1")).toBeInViewport({ ratio: 1 });
  await noHorizontalOverflow(page);
  await capture(page, info, "physarum-text200");
  const development = page.getByRole("button", { name: "Как он развивается?", exact: true });
  await development.scrollIntoViewIfNeeded();
  await expect(development).toBeInViewport({ ratio: 1 });
  await capture(page, info, "physarum-text200-actions");
  await development.click();
  await expect(page).toHaveURL(/#life\/physarum\/spore$/);
});

test("portrait returns preserve the finding, browser history, tree and direct-link parent", async ({ page }) => {
  await enter(page);
  const woodland = woodlands[0];
  const spot = woodland.spots[1];
  await page.goto(`/#world/physarum/${woodland.id}`);
  const clue = page.locator(`[data-find="${spot.id}"]`);
  await clue.tap();
  await expect(clue).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Узнать больше", exact: true }).click();
  await expect(page.locator(".portrait-identity h1")).toHaveText(scientificNames[spot.taxon].name);
  await page.getByRole("button", { name: "Настоящее фото", exact: true }).click();
  await page.getByRole("button", { name: "Иллюстрация", exact: true }).click();
  await page.getByRole("button", { name: "Как он развивается?", exact: true }).click();
  await page.getByRole("button", { name: "Назад к организму", exact: true }).click();
  await page.getByRole("button", { name: `Назад: ${woodland.title}`, exact: true }).click();
  await expect(clue).toHaveAttribute("aria-pressed", "true");
  await expect(clue).toBeFocused();
  await clue.tap();
  await page.getByRole("button", { name: "Узнать больше", exact: true }).click();
  await expect(page.locator(".portrait-scene")).toBeVisible();
  await page.goBack();
  await expect(clue).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page.locator(".portrait-identity h1")).toHaveText(scientificNames[spot.taxon].name);
  await page.getByRole("button", { name: `Назад: ${woodland.title}`, exact: true }).click();
  await expect(clue).toHaveAttribute("aria-pressed", "true");

  await page.goto("/#portrait/stemonitis/spore");
  await page.getByRole("button", { name: "Назад к дереву", exact: true }).click();
  await expect(page.locator(".classification-scene")).toBeVisible();
  await page.getByRole("button", { name: "Рассмотреть: Arcyria denudata", exact: true }).click();
  await expect(page.locator(".portrait-identity h1")).toHaveText("Arcyria denudata");
  await page.reload();
  await page.getByRole("button", { name: "Назад к дереву", exact: true }).click();
  await expect(page.locator(".classification-scene")).toBeVisible();
});
