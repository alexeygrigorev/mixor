import test from "node:test";
import assert from "node:assert/strict";
import { photoWalkViews } from "../src/photo-walk-data.ts";
import {
  PHOTO_WALK_PROGRESS_KEY, readPhotoWalkProgress, writePhotoWalkProgress, resetPhotoWalkProgress,
} from "../src/photo-walk-progress.ts";

const empty = () => ({ version: 1, visited: [], found: [], cameras: {} });
const [first, second] = photoWalkViews;
const storageWith = (value = null) => {
  const data = new Map(value === null ? [] : [[PHOTO_WALK_PROGRESS_KEY, value]]);
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, raw) => data.set(key, raw) };
};

test("absent, corrupt and unsupported progress safely starts empty", () => {
  for (const raw of [null, "{", "null", "[]", "42", '{"version":2,"visited":["video-forest"]}']) {
    assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storageWith(raw)), empty());
  }
});

test("progress accepts only known unique view and object IDs", () => {
  const storage = storageWith(JSON.stringify({
    version: 1,
    visited: [first.id, "removed-scene", first.id, 1, null, second.id],
    found: [first.objects[0].id, first.id, first.details[0].id, "unknown", first.objects[0].id],
    cameras: { unknown: { x: .5, y: .5, zoom: 1 } },
  }));
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage), {
    version: 1, visited: [first.id, second.id], found: [first.objects[0].id], cameras: {},
  });
});

test("camera positions are bounded and malformed coordinates are discarded", () => {
  for (const camera of [null, [], { x: "0.5", y: .5, zoom: 1 }, { x: .5, y: .5 },
    { x: NaN, y: .5, zoom: 1 }, { x: .5, y: Infinity, zoom: 1 }, { x: .5, y: .5, zoom: -Infinity }]) {
    const storage = storageWith();
    assert.equal(writePhotoWalkProgress({ ...empty(), cameras: { [first.id]: camera } }, photoWalkViews, storage), true);
    assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage).cameras, {});
  }
  const storage = storageWith(JSON.stringify({ ...empty(), cameras: {
    [first.id]: { x: -3, y: 4, zoom: 20 }, [second.id]: { x: .3, y: .7, zoom: 0 },
  } }));
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage).cameras, {
    [first.id]: { x: 0, y: 1, zoom: 2.5 }, [second.id]: { x: .3, y: .7, zoom: 1 },
  });
});

test("stale writes preserve saved discoveries and other views' cameras", () => {
  const storage = storageWith();
  storage.data.set("family-observations", "untouched");
  const stale = readPhotoWalkProgress(photoWalkViews, storage);
  assert.equal(writePhotoWalkProgress({ ...empty(), visited: [first.id], found: [first.objects[0].id], cameras: {
    [first.id]: { x: .2, y: .5, zoom: 1.5 }, [second.id]: { x: .7, y: .4, zoom: 2 },
  } }, photoWalkViews, storage), true);
  stale.visited.push(second.id);
  stale.found.push(second.objects[0].id);
  stale.cameras[first.id] = { x: .6, y: .3, zoom: 2.5 };
  assert.equal(writePhotoWalkProgress(stale, photoWalkViews, storage), true);
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage), {
    version: 1, visited: [first.id, second.id], found: [first.objects[0].id, second.objects[0].id], cameras: {
      [first.id]: { x: .6, y: .3, zoom: 2.5 }, [second.id]: { x: .7, y: .4, zoom: 2 },
    },
  });
  assert.equal(storage.data.get("family-observations"), "untouched");
  assert.deepEqual([...storage.data.keys()].sort(), [PHOTO_WALK_PROGRESS_KEY, "family-observations"].sort());
});

test("unavailable, denied or full storage never crashes or reports a successful save", () => {
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, null), empty());
  assert.equal(writePhotoWalkProgress(empty(), photoWalkViews, null), false);
  let attemptedWrite = false;
  const denied = {
    getItem() { throw new Error("denied"); },
    setItem() { attemptedWrite = true; },
  };
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, denied), empty());
  assert.equal(writePhotoWalkProgress(empty(), photoWalkViews, denied), false);
  assert.equal(attemptedWrite, false, "a failed read must not overwrite unseen progress");
  const full = { getItem: () => null, setItem() { throw new Error("quota"); } };
  assert.equal(writePhotoWalkProgress(empty(), photoWalkViews, full), false);
});

test("blocked browser localStorage getter is caught when using the default storage", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("SecurityError"); } });
  try {
    assert.deepEqual(readPhotoWalkProgress(photoWalkViews), empty());
    assert.equal(writePhotoWalkProgress(empty(), photoWalkViews), false);
    assert.equal(resetPhotoWalkProgress(photoWalkViews), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
});

test("explicit replay clears only the game and later writes do not restore old discoveries", () => {
  const storage = storageWith();
  storage.data.set("family-observations", "originals-and-notes");
  storage.data.set("other-game-progress", "preserved");
  assert.equal(writePhotoWalkProgress({ ...empty(), visited: [first.id], found: [first.objects[0].id], cameras: {
    [first.id]: { x: .2, y: .6, zoom: 2 },
  } }, photoWalkViews, storage), true);
  assert.equal(resetPhotoWalkProgress(photoWalkViews, storage), true);
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage), empty());
  const restarted = { ...empty(), visited: [second.id], found: [second.objects[0].id] };
  assert.equal(writePhotoWalkProgress(restarted, photoWalkViews, storage), true);
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage), restarted);
  assert.equal(storage.data.get("family-observations"), "originals-and-notes");
  assert.equal(storage.data.get("other-game-progress"), "preserved");
});

test("failed replay leaves saved game progress intact", () => {
  const saved = JSON.stringify({ ...empty(), found: [first.objects[0].id] });
  const storage = { getItem: () => saved, setItem() { throw new Error("quota"); } };
  assert.equal(resetPhotoWalkProgress(photoWalkViews, storage), false);
  assert.deepEqual(readPhotoWalkProgress(photoWalkViews, storage).found, [first.objects[0].id]);
  assert.equal(resetPhotoWalkProgress(photoWalkViews, null), false);
});


test("adding the October walk retains all original visits, finds and cameras", () => {
  const original = photoWalkViews.filter(view => view.woodlandId === "video-forest");
  const oldSave = {
    version: 1, visited: original.map(view => view.id),
    found: original.flatMap(view => view.objects.map(object => object.id)),
    cameras: { "video-forest": { x: .3, y: .6, zoom: 1.5 } },
  };
  const storage = storageWith(JSON.stringify(oldSave));
  storage.data.set("family-observations", "untouched");
  const next = readPhotoWalkProgress(photoWalkViews, storage);
  assert.deepEqual(next, oldSave);
  next.visited.push("october-01");
  assert.equal(writePhotoWalkProgress(next, photoWalkViews, storage), true);
  assert.equal(readPhotoWalkProgress(photoWalkViews, storage).found.length, 21);
  assert.equal(storage.data.get("family-observations"), "untouched");
});
