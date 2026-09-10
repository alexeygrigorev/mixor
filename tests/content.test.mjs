import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { taxa, media } from "../src/data.ts";
import { lifeCycles, stageSequence } from "../src/life-data.ts";
import { taxonomyTree, scientificNames } from "../src/taxonomy.ts";
import { woodlands, readFinds, writeFinds } from "../src/search-data.ts";

test("each taxon has its own eight-panel early-development original and runtime plate", () => {
  const manifest = JSON.parse(readFileSync(new URL("../content/generated-art.manifest.json", import.meta.url)));
  const originals = new Set();
  const runtimes = new Set();
  for (const taxon of taxa) {
    const asset = manifest.assets.find((a) => a.id === `early-${taxon.id}-v3`);
    assert(asset, `${taxon.id}: separate early plate`);
    assert.equal(asset.taxonId, taxon.id);
    assert.equal(asset.tool, "built-in image_gen");
    assert.deepEqual(asset.stageIds, stageSequence.slice(0, 8));
    assert.equal(asset.layout.columns, 4);
    assert.equal(asset.layout.rows, 2);
    assert.equal(asset.layout.tileAspect, 1);
    assert.deepEqual(asset.inputImages, []);
    assert.match(asset.scope, /group-level/);
    assert.match(asset.prompt, /FOUR columns by TWO rows/);
    assert(asset.sourceRefs.includes("https://pubmed.ncbi.nlm.nih.gov/2398347/"));
    for (const [pathKey, digestKey, seen] of [
      ["sourcePath", "sourceSha256", originals],
      ["runtimePath", "runtimeSha256", runtimes],
    ]) {
      const bytes = readFileSync(new URL(`../${asset[pathKey]}`, import.meta.url));
      const digest = createHash("sha256").update(bytes).digest("hex");
      assert.equal(digest, asset[digestKey], `${taxon.id}: ${pathKey} checksum`);
      assert(!seen.has(digest), `${taxon.id}: not a reused plate`);
      seen.add(digest);
    }
    assert.equal(asset.dimensions.width / asset.dimensions.height, 2);
  }
  assert.equal(originals.size, 8);
  assert.equal(runtimes.size, 8);
});

test("all eight organisms have eleven distinct sequenced stages and valid photo associations", () => {
  assert.equal(taxa.length, 8);
  assert.deepEqual(
    [...stageSequence],
    [
      "spore",
      "cells",
      "fusion",
      "zygote",
      "division",
      "young",
      "spreading",
      "veins",
      "network",
      "forming",
      "fruit",
    ],
  );
  for (const t of taxa) {
    assert.equal(t.latinName, scientificNames[t.id].name);
    assert.equal(t.commonName, t.latinName);
    const c = lifeCycles[t.id];
    assert.deepEqual(
      c.stages.filter((s) => s.id !== "rest").map((s) => s.id),
      [...stageSequence],
    );
    assert.equal(new Set(c.stages.map((s) => s.id)).size, c.stages.length);
    for (const s of c.stages) {
      assert(s.sourceUrls.length > 0);
      if (s.kind === "photo")
        assert.equal(media.find((p) => p.id === s.photoId)?.taxonId, t.id);
    }
    const main = c.transitions.filter((t) => !t.optional);
    assert.equal(main.length, 11);
    assert.deepEqual(
      main.filter((t) => ["young", "spreading", "veins"].includes(t.from))
        .map((t) => [t.from, t.to]),
      [["young", "spreading"], ["spreading", "veins"], ["veins", "network"]],
    );
    for (const id of ["spreading", "veins"]) {
      const stage = c.stages.find((s) => s.id === id);
      assert.equal(stage.kind, "diagram");
      assert(stage.sourceUrls.includes("https://www.jstage.jst.go.jp/article/biophysico/22/1/22_e220002/_pdf"));
      assert.match(stage.description, /Physarum/);
    }
    assert.equal(main.at(-1).to, "spore");
    assert(!main.some((t) => t.to === "rest"));
  }
});
test("classification has species leaves under real intermediate groups", () => {
  const paths = new Map();
  function visit(node, path = []) {
    if (node.taxon) paths.set(node.taxon, [...path, node.name]);
    for (const child of node.children ?? []) visit(child, [...path, node.name]);
  }
  visit(taxonomyTree);
  assert.equal(paths.size, 8);
  assert(paths.get("physarum").includes("Physaraceae"));
  assert(paths.get("fuligo").includes("Physaraceae"));
  assert(paths.get("trichia").includes("Hemitrichiaceae"));
  assert(paths.get("trichia").includes("Hemitrichia"));
  assert(paths.get("tubifera").includes("Reticulariales"));
  assert(paths.get("lycogala").includes("Reticulariaceae"));
  assert(paths.get("didymium").includes("Didymiaceae"));
  assert(paths.get("stemonitis").includes("Stemonitidales"));
  assert.equal(scientificNames.stemonitis.genusProvisional, true);
  assert.match(scientificNames.stemonitis.placementNote, /incertae sedis/);
});
test("five unique environments cover all taxa; corrupted search data is contained", () => {
  assert.equal(woodlands.length, 5);
  assert.equal(new Set(woodlands.map((w) => w.image)).size, 5);
  const spots = woodlands.flatMap((w) => w.spots);
  assert.equal(new Set(spots.map((s) => s.id)).size, 15);
  assert.equal(new Set(spots.map((s) => s.taxon)).size, 8);
  let value = "bad json";
  globalThis.localStorage = {
    getItem: () => value,
    setItem: (_key, v) => {
      value = v;
    },
  };
  assert.deepEqual(readFinds(), []);
  value = JSON.stringify([spots[0].id, spots[0].id, "unknown", null]);
  assert.deepEqual(readFinds(), [spots[0].id]);
  assert.equal(writeFinds([spots[0].id, spots[0].id]), true);
  assert.deepEqual(readFinds(), [spots[0].id]);
  localStorage.setItem = () => {
    throw new Error("quota");
  };
  assert.equal(writeFinds([spots[1].id]), false);
});

test("weather is scene-specific, with rain only at roots and birch", () => {
  assert.deepEqual(
    Object.fromEntries(woodlands.map((w) => [w.id, w.weather])),
    { forest: "clear", stump: "overcast", leaves: "overcast", roots: "rain", bark: "rain" },
  );
});
