import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { woodlands } from "../../src/search-data";
import { scientificNames } from "../../src/taxonomy";

// Evidence is rasterized from each actual DOM composition independently.
// No replacement artwork, repainting, contrast adjustment or generated upscale.
test("all fifteen clues enlarge the same pixels, framing and local support", async ({page}, info) => {
  test.skip(info.project.name !== "phone", "One complete fifteen-pair diagnostic.");
  test.setTimeout(90000);
  const engine = page.context().browser()?.browserType().name() ?? "persistent";
  const output = `tmp/search-fidelity/${engine}/pairs`;
  mkdirSync(output, {recursive:true});
  await page.setViewportSize({width:1024,height:768});
  await page.goto("/#world/physarum/forest");
  await page.getByRole("button", {name:"Начать в тишине", exact:true}).click();
  const report = [];
  for (const scene of woodlands) {
    await page.goto(`/#world/physarum/${scene.id}`);
    for (const spot of scene.spots) {
      const clue = page.locator(`[data-find="${spot.id}"]`);
      await expect(clue.locator(".search-composite")).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode()));
        await Promise.all([...new Set([...document.querySelectorAll("svg image")].map(image => image.getAttribute("href")!))].map(async path => {
          const image = new Image();
          image.src = path;
          await image.decode();
        }));
      });
      const box = (await clue.boundingBox())!;
      await page.screenshot({path:`${output}/${spot.id}-attachment.png`, clip:{
        x:Math.max(0, Math.min(704, box.x + box.width / 2 - 160)),
        y:Math.max(0, Math.min(528, box.y + box.height / 2 - 120)),
        width:320, height:240,
      }});
      await clue.locator(".search-composite").screenshot({path:`${output}/${spot.id}-clue-native.png`});
      await clue.click();
      await expect(page.getByRole("dialog")).toHaveAccessibleName(scientificNames[spot.taxon].name);
      await page.locator(".search-magnified-image").screenshot({path:`${output}/${spot.id}-lens-native.png`});
      for (const specimen of [clue.locator(".search-composite"), page.locator(".search-magnified-image > .search-composite")]) {
        await expect(specimen.locator("image")).toHaveCount(2);
        await expect(specimen.locator("[data-macro-frame] image")).toHaveAttribute("href", "/assets/art/organisms-v2.webp");
        await expect(specimen).toHaveAttribute("data-support", spot.taxon === "didymium" ? "leaf" : "wood");
      }

      const comparison = await page.evaluate(async (id) => {
        const elements = [
          document.querySelector<SVGSVGElement>('[data-find="' + id + '"] .search-composite')!,
          document.querySelector<SVGSVGElement>(".search-magnifier .search-composite")!,
        ];
        const tile = Number(elements[0].dataset.sourceTile);
        // Test-only samples on continuous native material below/between bases.
        // Positions are percentages of the inset atlas tile, not scene pixels.
        const supportSamples = [
          [[25,84],[48,89],[80,87]],
          [[20,77],[48,78],[75,83]],
          [[18,90],[47,94],[80,91]],
          [[28,85],[46,91],[77,92]],
          [[22,78],[48,85],[77,84]],
          [[26,72],[49,78],[76,77]],
          [[20,89],[50,94],[80,94]],
          [[38,67],[44,79],[80,76]],
        ][tile];
        const rawHeads = tile === 7
          ? [[87,147],[337,110],[221,195],[78,258],[370,201],[284,328]]
          : tile === 5
            ? [[76,146],[130,195],[176,181],[217,145],[178,240],[262,209],[313,125],[390,166],[327,247]]
            : [];
        const headSamples = rawHeads.map(([x,y]) => [x * .23 - 1.115, y * .23 - 1.115]);
        const cache = new Map<string, string>();
        const results = [];
        const rasterize = async (svg: SVGSVGElement) => {
          const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], {type:"image/svg+xml"}));
          try {
            const image = new Image();
            image.src = url;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 320;
            const context = canvas.getContext("2d")!;
            context.drawImage(image, 0, 0, 320, 320);
            const pixels = context.getImageData(0, 0, 320, 320).data;
            return {pixels, png:canvas.toDataURL("image/png")};
          } finally { URL.revokeObjectURL(url); }
        };
        for (const element of elements) {
          const clone = element.cloneNode(true) as SVGSVGElement;
          clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          clone.setAttribute("width", "320");
          clone.setAttribute("height", "320");
          clone.removeAttribute("class");
          for (const image of clone.querySelectorAll("image")) {
            const path = image.getAttribute("href")!;
            if (!cache.has(path)) {
              const blob = await (await fetch(path)).blob();
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              cache.set(path, data);
            }
            image.setAttribute("href", cache.get(path)!);
          }
          const full = await rasterize(clone);
          const digest = await crypto.subtle.digest("SHA-256", full.pixels);
          // Context cannot conceal removed support. Compare the actual macro
          // alone against its original unmasked image, at the same raster scale.
          clone.querySelector("[data-scene-context]")!.remove();
          const isolated = await rasterize(clone);
          const reference = clone.cloneNode(true) as SVGSVGElement;
          for (const node of reference.querySelectorAll("[mask], [filter]")) {
            node.removeAttribute("mask");
            node.removeAttribute("filter");
          }
          const native = await rasterize(reference);
          const frame = clone.querySelector("[data-macro-frame]")!;
          const left = Number(frame.getAttribute("x"));
          const top = Number(frame.getAttribute("y"));
          const scale = Number(frame.getAttribute("width")) / 100;
          const sample = ([x,y]: number[]) => {
            const cx = Math.round((left + x * scale) * 3.2);
            const cy = Math.round((top + y * scale) * 3.2);
            let error = 0, actualAlpha = 255, sourceAlpha = 255;
            for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
              const offset = ((cy + dy) * 320 + cx + dx) * 4;
              for (let channel=0; channel<4; channel++)
                error = Math.max(error, Math.abs(isolated.pixels[offset+channel] - native.pixels[offset+channel]));
              actualAlpha = Math.min(actualAlpha, isolated.pixels[offset+3]);
              sourceAlpha = Math.min(sourceAlpha, native.pixels[offset+3]);
            }
            return {error, actualAlpha, sourceAlpha};
          };
          results.push({
            hash:[...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,"0")).join(""),
            png:full.png, emptyCornerAlpha:isolated.pixels[3],
            support: supportSamples.map(sample), heads: headSamples.map(sample),
          });
        }
        return results;
      }, spot.id);
      expect(comparison[0].hash).toBe(comparison[1].hash);
      for (const rendered of comparison) {
        expect(rendered.emptyCornerAlpha).toBe(0);
        expect(rendered.support).toHaveLength(3);
        expect(rendered.heads).toHaveLength(spot.taxon === "didymium" ? 6 : spot.taxon === "trichia" ? 9 : 0);
        for (const sample of [...rendered.support, ...rendered.heads]) {
          // Preserve original RGBA/contact texture, not forced 255 alpha:
          // the unchanged native WebP contains intrinsic partial opacity.
          // Native wood can have lower intrinsic alpha than the heads (e.g.
          // Physarum support 203/255). Require a real source pixel and retain
          // its RGBA, rather than imposing an unrelated opacity floor.
          expect(sample.sourceAlpha).toBeGreaterThan(0);
          expect(sample.actualAlpha).toBeGreaterThanOrEqual(sample.sourceAlpha - 4);
          expect(sample.error).toBeLessThanOrEqual(4);
        }
        for (const head of rendered.heads) expect(head.sourceAlpha).toBeGreaterThanOrEqual(230);
      }
      for (let index=0; index<2; index++) {
        writeFileSync(`${output}/${spot.id}-${index === 0 ? "clue" : "lens"}-common.png`, Buffer.from(comparison[index].png.split(",")[1], "base64"));
      }
      report.push({id:spot.id, scene:scene.image, sourceAnchor:[spot.x,spot.y], commonPixelHash:comparison[0].hash, supportSamples:comparison[0].support, headSamples:comparison[0].heads});
      await page.getByRole("button", {name:"Закрыть увеличение", exact:true}).click();
      await expect(clue).toBeFocused();
      await clue.click();
      await page.getByRole("button", {name:"Узнать больше", exact:true}).click();
      await expect(page.locator(".portrait-scene h1")).toHaveText(scientificNames[spot.taxon].name);
      await page.getByRole("button", {name:`Назад: ${scene.title}`, exact:true}).click();
      await expect(clue).toBeFocused();
      await expect(clue).toHaveAttribute("aria-pressed", "true");
    }
  }
  writeFileSync(`${output}/REPORT.json`, JSON.stringify(report, null, 2));
  expect(report).toHaveLength(15);
});
