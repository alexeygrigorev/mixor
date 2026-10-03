import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { photoWalkViews, validatePhotoWalk, getPhotoWalkView, PHOTO_WALK_ENTRY } from "../src/photo-walk-data.ts";
import { fitPhoto } from "../src/photo-walk-core.ts";

test("both walks have 34 different real frames and searchable forest details", () => {
  assert.equal(photoWalkViews.length, 34);
  assert.equal(new Set(photoWalkViews.map(view => view.image)).size, 34);
  const objects = photoWalkViews.flatMap(view => view.objects);
  assert.equal(objects.length, 29);
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
  assert.equal(photoWalkViews.reduce((count, view) => count + view.links.length, 0), 66);
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
    assert.equal(view.links.length, index === 27 ? 1 : 2);
    assert.equal(view.links[0].to, index === 0 ? "video-old-stump" : views[index - 1].id);
    assert.equal(view.links[0].motion, "back");
    if (index < 27) assert.equal(view.links[1].to, views[index + 1].id);
  }
  assert.equal(views.flatMap(view => view.objects).length, 8);
  assert.equal(photoWalkViews.filter(view => !view.id.startsWith("october-")).flatMap(view => view.objects).length, 21);
});
