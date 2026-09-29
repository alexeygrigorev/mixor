import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { photoWalkViews, validatePhotoWalk } from "../src/photo-walk-data.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4173";
const output = path.resolve(root, process.env.OUTPUT_DIR ?? "tmp/photo-walk-placements");
const viewport = { width: 1440, height: 900 };
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const imageBytes = (url) => readFile(path.join(root, "public", url.replace(/^\//, "")));
validatePhotoWalk(photoWalkViews);
await mkdir(output, { recursive: true });
const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const trackedDiff = execFileSync("git", ["diff", "HEAD", "--", "src", "scripts", "content"], { cwd: root });
const inputs = ["src/photo-walk-data.ts", "src/photo-walk-core.ts", "src/photo-walk-camera.ts", "src/photo-walk.css", "src/photo-walk-navigation.css"];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async (file) => [file, digest(await readFile(path.join(root, file)))])));
const views = await Promise.all(photoWalkViews.map(async (view) => ({
  id: view.id,
  sourceTimeSeconds: view.sourceTimeSeconds,
  image: view.image,
  sha256: digest(await imageBytes(view.image)),
})));
const expectedIds = photoWalkViews.flatMap((view) => view.objects.map((object) => object.id));
const report = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  baseURL: base,
  viewport,
  engine: "chromium",
  revision,
  trackedWorkingDiffSha256: digest(trackedDiff),
  inputHashes,
  sources: views,
  expectedCount: expectedIds.length,
  capturedCount: 0,
  captureComplete: false,
  status: "pending_review",
  note: "Automated evidence capture only. Every placement still requires visual inspection and independent review.",
  placements: [],
};
async function writeIndex() {
  report.capturedCount = report.placements.length;
  await writeFile(path.join(output, "review-index.json"), `${JSON.stringify(report, null, 2)}\n`);
}
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
async function focusScene(page) {
  // Keep controls out of their hover state in both sides of a found-state pair.
  await page.mouse.move(0, 0);
  await page.locator(".pw-viewport").focus();
  await settle(page);
}
async function cameraState(page) {
  return page.locator(".pw-viewport").evaluate((node) => {
    const box = node.querySelector(".pw-surface").getBoundingClientRect();
    return { zoom: Number(node.dataset.zoom), overview: node.dataset.overview === "true", photo: { x: box.x, y: box.y, width: box.width, height: box.height } };
  });
}
async function cropAround(target) {
  const box = await target.boundingBox();
  if (!box) throw new Error("Discovery has no rendered bounds");
  return {
    x: Math.max(0, Math.min(viewport.width - 600, box.x + box.width / 2 - 300)),
    y: Math.max(0, Math.min(viewport.height - 450, box.y + box.height / 2 - 225)),
    width: 600,
    height: 450,
  };
}
await writeIndex();
const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  for (const view of photoWalkViews) {
    const source = views.find((candidate) => candidate.id === view.id);
    for (const object of view.objects) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.addInitScript(() => {
          localStorage.setItem("mixor-entered-v2", "true");
          localStorage.setItem("mixor-muted", "true");
        });
        const destination = new URL(base.endsWith("/") ? base : `${base}/`);
        destination.hash = `world/physarum/${view.id}`;
        await page.goto(destination.href);
        await page.locator(`.photo-walk-scene[data-view="${view.id}"][data-busy="false"]`).waitFor();
        await settle(page);
        const target = page.locator(`[data-object="${object.id}"]`);
        if (await target.getAttribute("aria-pressed") !== "false") throw new Error(`${object.id}: initial state is already found`);
        const files = Object.fromEntries(["normal-unfound", "zoom-unfound", "zoom-found", "normal-found"].map((state) => [state, `${object.id}-${state}.png`]));
        await page.getByRole("button", { name: "Весь кадр", exact: true }).click();
        await focusScene(page);
        const normalBefore = await cameraState(page);
        await page.screenshot({ path: path.join(output, files["normal-unfound"]) });
        for (let step = 0; step < 5; step++) await page.getByRole("button", { name: "Приблизить", exact: true }).click();
        await target.focus();
        await focusScene(page);
        const zoomBefore = await cameraState(page);
        if (zoomBefore.zoom !== 2.5) throw new Error(`${object.id}: maximum zoom was ${zoomBefore.zoom}`);
        const clip = await cropAround(target);
        await page.screenshot({ path: path.join(output, files["zoom-unfound"]), clip });
        await target.click();
        await page.getByRole("dialog").waitFor();
        await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
        await focusScene(page);
        if (await target.getAttribute("aria-pressed") !== "true") throw new Error(`${object.id}: found state missing`);
        const zoomAfter = await cameraState(page);
        for (const axis of ["x", "y", "width", "height"]) {
          if (Math.abs(zoomBefore.photo[axis] - zoomAfter.photo[axis]) > 1) throw new Error(`${object.id}: camera moved after finding (${axis})`);
        }
        await page.screenshot({ path: path.join(output, files["zoom-found"]), clip });
        await page.getByRole("button", { name: "Весь кадр", exact: true }).click();
        await focusScene(page);
        await page.screenshot({ path: path.join(output, files["normal-found"]) });
        if (pageErrors.length) throw new Error(`${object.id}: ${pageErrors.join("; ")}`);
        report.placements.push({
          objectId: object.id,
          viewId: view.id,
          support: object.support,
          rectangle: { x: object.x, y: object.y, width: object.width, height: object.height },
          rotation: object.rotation,
          image: object.image,
          imageSha256: digest(await imageBytes(object.image)),
          backgroundSha256: source.sha256,
          sourceTimeSeconds: view.sourceTimeSeconds,
          files,
          zoomCrop: clip,
          camera: { normalBefore, zoomBefore, zoomAfter },
          status: "pending_review",
          defects: [],
          reviewer: null,
        });
        await writeIndex();
        console.log(`${report.placements.length}/${expectedIds.length}: ${object.id}`);
      } finally {
        await context.close();
      }
    }
  }
  const capturedIds = new Set(report.placements.map((item) => item.objectId));
  if (capturedIds.size !== expectedIds.length || expectedIds.some((id) => !capturedIds.has(id))) throw new Error("Placement matrix is incomplete");
  for (const [file, hash] of Object.entries(inputHashes)) {
    if (digest(await readFile(path.join(root, file))) !== hash) throw new Error(`Input changed during capture: ${file}; rerun after edits settle`);
  }
  for (const source of views) {
    if (digest(await imageBytes(source.image)) !== source.sha256) throw new Error(`Background changed during capture: ${source.id}`);
  }
  for (const placement of report.placements) {
    if (digest(await imageBytes(placement.image)) !== placement.imageSha256) throw new Error(`Artwork changed during capture: ${placement.objectId}`);
  }
  report.captureComplete = true;
  await writeIndex();
  console.log(`Wrote ${expectedIds.length * 4} captures and ${path.join(output, "review-index.json")}. Visual review is still pending.`);
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  await writeIndex();
  throw error;
} finally {
  await browser.close();
}
