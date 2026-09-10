import test from "node:test";
import assert from "node:assert/strict";
import { readJourney, writeJourney, makeId } from "../src/game-store.ts";
let stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
};
test("empty, corrupt and invalid journey data do not crash", () => {
  assert.deepEqual(readJourney(), { visited: [], discoveries: [] });
  stored.set("mixor-journey-v2", "{bad json");
  assert.deepEqual(readJourney(), { visited: [], discoveries: [] });
  stored.set(
    "mixor-journey-v2",
    JSON.stringify({ visited: [5], discoveries: [] }),
  );
  assert.deepEqual(readJourney(), { visited: [], discoveries: [] });
});
test("real journey round trip and storage denial is not success", () => {
  const journey = { visited: ["physarum/spore"], discoveries: [] };
  assert.equal(writeJourney(journey), true);
  assert.deepEqual(readJourney(), journey);
  const save = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("denied");
  };
  assert.equal(writeJourney(journey), false);
  localStorage.setItem = save;
});
test("IDs do not require secure-context-only randomUUID", () => {
  const ids = new Set(Array.from({ length: 100 }, makeId));
  assert.equal(ids.size, 100);
  assert.match([...ids][0], /^[a-f0-9]{32}$/);
});
