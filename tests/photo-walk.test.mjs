import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { photoWalkViews, validatePhotoWalk, getPhotoWalkView, PHOTO_WALK_ENTRY } from "../src/photo-walk-data.ts";
import { fitPhoto } from "../src/photo-walk-core.ts";

test("scene 07 has six different real frames and no invented organisms", () => {
  assert.equal(photoWalkViews.length, 6);
  assert.equal(new Set(photoWalkViews.map(view => view.image)).size, 6);
  assert(photoWalkViews.every(view => view.objects.length === 0));
  assert.equal(getPhotoWalkView(PHOTO_WALK_ENTRY)?.woodlandId, "video-forest");
  assert.equal(getPhotoWalkView("not-a-scene"), undefined);
});
test("all scene 07 routes are reachable and reversible", () => {
  assert.doesNotThrow(() => validatePhotoWalk(photoWalkViews));
  assert.equal(photoWalkViews.reduce((count, view) => count + view.links.length, 0), 10);
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
