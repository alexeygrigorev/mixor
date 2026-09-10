import test from "node:test";
import assert from "node:assert/strict";
import { taxa, media } from "../src/data.ts";
import { lifeCycles, stageSequence } from "../src/life-data.ts";
import { taxonomyTree, scientificNames } from "../src/taxonomy.ts";
import { woodlands, readFinds, writeFinds } from "../src/search-data.ts";

test("all eight organisms have nine distinct sequenced stages and valid photo associations", () => {
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
    assert.equal(main.length, 9);
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
