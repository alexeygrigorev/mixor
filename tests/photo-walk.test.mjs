import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { photoWalkViews, validatePhotoWalk, getPhotoWalkView, PHOTO_WALK_ENTRY } from "../src/photo-walk-data.ts";
import { fitPhoto } from "../src/photo-walk-core.ts";

test("three walks have 70 different real frames and searchable forest details", () => {
  assert.equal(photoWalkViews.length, 70);
  assert.equal(new Set(photoWalkViews.map(view => view.image)).size, 70);
  const objects = photoWalkViews.flatMap(view => view.objects);
  assert.equal(objects.length, 35);
  assert.equal(new Set(objects.map(object => object.id)).size, objects.length);
  assert.deepEqual(new Set(objects.map(object => object.kind)), new Set(["myxomycete", "lichen", "fungus", "creature"]));
  assert(objects.every(object => object.image.startsWith("/assets/scene-07/objects/") && object.title && object.description));
  const assets = JSON.parse(readFileSync(new URL("../content/assets.manifest.json", import.meta.url)));
  for (const id of ["scene-07-myxomycete-clue", "scene-07-lichen-clue", "scene-07-fungus-clue", "scene-07-woodlouse-clue"]) {
    const asset = assets.assets.find(item => item.id === id);
    assert(asset, `${id}: registered generated overlay`);
    assert.equal(asset.kind, "game_art");
    assert.equal(asset.isGenerated, true);
    assert(readFileSync(new URL(`../${asset.path}`, import.meta.url)).length > 0);
  }
  assert.equal(getPhotoWalkView(PHOTO_WALK_ENTRY)?.woodlandId, "video-forest");
  assert.equal(getPhotoWalkView("not-a-scene"), undefined);
});
test("all scene 07 routes are reachable and reversible", () => {
  assert.doesNotThrow(() => validatePhotoWalk(photoWalkViews));
  assert.equal(photoWalkViews.reduce((count, view) => count + view.links.length, 0), 138);
  assert.equal(getPhotoWalkView("video-clearing").links.length, 3);
});
test("missing destinations and missing return paths are rejected", () => {
  const bad = structuredClone(photoWalkViews);
  bad[0].links[0].to = "absent";
  assert.throws(() => validatePhotoWalk(bad), /invalid link/);
  const oneWay = structuredClone(photoWalkViews);
  oneWay[1].links = oneWay[1].links.filter(link => link.to !== PHOTO_WALK_ENTRY);
  assert.throws(() => validatePhotoWalk(oneWay), /missing return/);
});
test("duplicate views and out-of-image crops are rejected", () => {
  assert.throws(() => validatePhotoWalk([...photoWalkViews, photoWalkViews[0]]), /invalid view ids/);
  const bad = structuredClone(photoWalkViews);
  bad[0].details[0].x = 90;
  assert.throws(() => validatePhotoWalk(bad), /invalid rectangle/);
});
test("letterbox projection retains the whole source and stable anchors", () => {
  for (const [width, height] of [[1440, 900], [1920, 1080], [1024, 768], [390, 844]]) {
    const box = fitPhoto(width, height);
    assert(box.width <= width && box.height <= height);
    assert(Math.abs(box.width / box.height - 16 / 9) < 1e-10);
    assert(Math.abs(box.left * 2 + box.width - width) < 1e-8);
    assert(Math.abs(box.top * 2 + box.height - height) < 1e-8);
    for (const view of photoWalkViews) for (const link of view.links) {
      const x = box.left + box.width * link.x / 100;
      const y = box.top + box.height * link.y / 100;
      assert(x >= 0 && x <= width && y >= 0 && y <= height);
    }
  }
});
test("manifest files match the actual extracted bytes and frame timestamps", () => {
  const manifest = JSON.parse(readFileSync(new URL("../content/scene-07.manifest.json", import.meta.url)));
  assert.equal(manifest.assets.length, 6);
  assert.equal(manifest.processing.generated, false);
  assert.equal(manifest.source.originalIncluded, false);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../${asset.path}`, import.meta.url));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
    const view = photoWalkViews.find(item => "public" + item.image === asset.path);
    assert(view);
    assert.equal(view.sourceTimeSeconds, asset.sourceTimeSeconds);
    assert.equal(asset.width, 1920);
    assert.equal(asset.height, 1080);
  }
});
test("new placements require a visible support description and a finite art angle", () => {
  const unsupported = structuredClone(photoWalkViews);
  unsupported[0].objects[0].support = " ";
  assert.throws(() => validatePhotoWalk(unsupported), /invalid support/);
  const invalidAngle = structuredClone(photoWalkViews);
  invalidAngle[0].objects[0].rotation = Number.NaN;
  assert.throws(() => validatePhotoWalk(invalidAngle), /invalid support/);
});

test("October manifest registers 28 full frames and light metadata-free map thumbnails", () => {
  const manifest = JSON.parse(readFileSync(new URL("../content/scene-08.manifest.json", import.meta.url)));
  const views = photoWalkViews.filter(view => view.id.startsWith("october-"));
  assert.equal(manifest.assets.length, 28);
  assert.equal(views.length, 28);
  assert.equal(manifest.source.originalIncluded, false);
  assert.equal(manifest.processing.generated, false);
  assert.equal(manifest.processing.audioIncluded, false);
  assert.equal(manifest.source.publicationPermission.date, "2026-10-03");
  assert.equal(new Set(manifest.assets.map(a => a.sha256)).size, 28);
  let previous = -1;
  for (const asset of manifest.assets) {
    const view = views.find(view => view.id === asset.id);
    assert.equal(view.sourceTimeSeconds, asset.sourceTimeSeconds);
    assert(asset.sourceTimeSeconds > previous);
    previous = asset.sourceTimeSeconds;
    assert.equal("public" + view.image, asset.path);
    assert.equal("public" + view.thumbnail, asset.thumbnail.path);
    for (const item of [asset, asset.thumbnail]) {
      const bytes = readFileSync(new URL(`../${item.path}`, import.meta.url));
      assert.equal(bytes.length, item.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256);
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      let dimensions;
      for (let offset = 12; offset < bytes.length;) {
        const tag = bytes.toString("ascii", offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
        assert(!["EXIF", "XMP ", "ICCP", "ANIM", "ANMF"].includes(tag), `${item.path}: unexpected ${tag}`);
        assert(offset + 8 + length <= bytes.length);
        if (tag === "VP8 ") dimensions = [bytes.readUInt16LE(offset + 14) & 0x3fff, bytes.readUInt16LE(offset + 16) & 0x3fff];
        offset += 8 + length + length % 2;
      }
      assert.deepEqual(dimensions, [item.width, item.height]);
    }
    assert.equal(asset.width, 1920); assert.equal(asset.height, 1080);
    assert.equal(asset.thumbnail.width, 320); assert.equal(asset.thumbnail.height, 180);
    assert(asset.thumbnail.bytes < 40000);
  }
});

test("October route has a reversible next/back path through all 28 captures", () => {
  const views = photoWalkViews.filter(view => view.id.startsWith("october-"));
  for (const [index, view] of views.entries()) {
    assert.equal(view.links.length, 2);
    assert.equal(view.links[0].to, index === 0 ? "video-old-stump" : views[index - 1].id);
    assert.equal(view.links[0].motion, "back");
    if (index < 27) assert.equal(view.links[1].to, views[index + 1].id);
    else assert.equal(view.links[1].to, "pine-01");
  }
  assert.equal(views.flatMap(view => view.objects).length, 8);
  assert.equal(photoWalkViews.filter(view => view.id.startsWith("video-")).flatMap(view => view.objects).length, 21);
});

// New recording is separate content; explicit counts catch accidental omissions.
import { pineWalkViews, buildPineWalk, PINE_WALK_ENTRY } from "../src/photo-walk-pine.ts";

test("Pine manifest preserves all 36 real source frames, thumbnails and the latest publication scope", () => {
  const manifest = JSON.parse(readFileSync(new URL("../content/scene-09.manifest.json", import.meta.url)));
  assert.equal(manifest.assets.length, 36);
  assert.equal(pineWalkViews.length, 36);
  assert.equal(manifest.source.originalIncluded, false);
  assert.equal(manifest.processing.generated, false);
  assert.equal(manifest.processing.retouching, false);
  assert.equal(manifest.processing.audioIncluded, false);
  assert.match(manifest.source.publicationPermission.scope, /people.*belongings/);
  assert.deepEqual(manifest.assets.filter(a => a.reviewTags.includes("person")).map(a => a.id), ["pine-34"]);
  assert.equal(new Set(manifest.assets.map(a => a.sha256)).size, 36);
  let prior = -1, total = 0;
  for (const [index, asset] of manifest.assets.entries()) {
    const view = pineWalkViews[index];
    assert.equal(view.id, asset.id);
    assert.equal(view.sourceTimeSeconds, asset.sourceTimeSeconds);
    assert.equal(Math.round(asset.sourcePTS / 90000 * 1e6) / 1e6, asset.sourceTimeSeconds);
    assert(asset.sourceFrame > prior); prior = asset.sourceFrame;
    assert.equal("public" + view.image, asset.path);
    assert.equal("public" + view.thumbnail, asset.thumbnail.path);
    for (const item of [asset, asset.thumbnail]) {
      const bytes = readFileSync(new URL(`../${item.path}`, import.meta.url));
      total += bytes.length;
      assert.equal(bytes.length, item.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256);
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
      let dimensions;
      for (let offset = 12; offset < bytes.length;) {
        const tag = bytes.toString("ascii", offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
        assert(!["EXIF", "XMP ", "ICCP", "ANIM", "ANMF"].includes(tag), `${item.path}: unexpected ${tag}`);
        assert(offset + 8 + length <= bytes.length);
        if (tag === "VP8 ") dimensions = [bytes.readUInt16LE(offset + 14) & 0x3fff, bytes.readUInt16LE(offset + 16) & 0x3fff];
        offset += 8 + length + length % 2;
      }
      assert.deepEqual(dimensions, [item.width, item.height]);
    }
    assert.equal(asset.width, 1920); assert.equal(asset.height, 1080);
    assert.equal(asset.thumbnail.width, 320); assert.equal(asset.thumbnail.height, 180);
    assert(asset.thumbnail.bytes < 40000);
  }
  assert(total < 30_000_000, "The 36 full frames plus previews stay below the authored download budget");
});

test("all 36 pine stops have reversible routes and six supported illustrated finds", () => {
  for (const [index, view] of pineWalkViews.entries()) {
    assert.equal(view.links.length, index === 35 ? 1 : 2);
    assert.equal(view.links[0].to, index === 0 ? "october-28" : pineWalkViews[index - 1].id);
    assert.equal(view.links[0].motion, "back");
    if (index < 35) assert.equal(view.links[1].to, pineWalkViews[index + 1].id);
  }
  assert.equal(pineWalkViews.flatMap(view => view.objects).length, 6);
  assert.equal(pineWalkViews.flatMap(view => view.objects).filter(item => item.kind === "myxomycete").length, 3);
  assert.equal(photoWalkViews.filter(view => !view.id.startsWith("pine-")).length, 34);
  assert.equal(photoWalkViews.filter(view => !view.id.startsWith("pine-")).flatMap(view => view.objects).length, 29);
});

test("later cleanup can omit nominated transit frames without renumbering or losing discoveries", () => {
  const omitted = ["pine-26", "pine-27", "pine-30", "pine-32", "pine-34", "pine-35", "pine-36"];
  const reduced = buildPineWalk(omitted);
  assert.equal(reduced.length, 29);
  assert.deepEqual(reduced.map(view => view.id), pineWalkViews.filter(view => !omitted.includes(view.id)).map(view => view.id));
  assert.deepEqual(reduced.flatMap(view => view.objects), pineWalkViews.flatMap(view => view.objects));
  assert.equal(reduced.at(-1).id, "pine-33");
  assert.equal(reduced.at(-1).links.length, 1);
  assert.equal(reduced.find(view => view.id === "pine-25").links[1].to, "pine-28");
  assert.equal(reduced.find(view => view.id === "pine-28").links[0].to, "pine-25");
  assert.doesNotThrow(() => validatePhotoWalk([...photoWalkViews.filter(view => !view.id.startsWith("pine-")), ...reduced]));
  assert.deepEqual(buildPineWalk(), pineWalkViews, "A preview omission must not mutate the published route");
});

test("cleanup rejects unknown frames, the stable entry and frames with discoveries", () => {
  assert.throws(() => buildPineWalk(["pine-99"]), /unknown/);
  assert.throws(() => buildPineWalk([PINE_WALK_ENTRY]), /entry/);
  assert.throws(() => buildPineWalk(["pine-33"]), /discoveries/);
});
