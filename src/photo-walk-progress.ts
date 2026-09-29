import type { PhotoWalkView } from "./photo-walk-data.ts";

export type PhotoWalkCamera = { x: number; y: number; zoom: number };
export type PhotoWalkProgress = {
  version: 1;
  visited: string[];
  found: string[];
  cameras: Record<string, PhotoWalkCamera>;
};
export interface PhotoWalkStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Game discoveries only; never read or write the family's observation storage.
export const PHOTO_WALK_PROGRESS_KEY = "mixor-photo-walk-v1";

const emptyProgress = (): PhotoWalkProgress => ({ version: 1, visited: [], found: [], cameras: {} });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function browserStorage(): PhotoWalkStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function validateProgress(value: unknown, views: readonly PhotoWalkView[]): PhotoWalkProgress {
  if (!isRecord(value) || value.version !== 1) return emptyProgress();
  const viewIds = new Set(views.map(view => view.id));
  const objectIds = new Set(views.flatMap(view => view.objects.map(object => object.id)));
  const knownIds = (ids: unknown, allowed: Set<string>): string[] => Array.isArray(ids)
    ? [...new Set(ids.filter((id): id is string => typeof id === "string" && allowed.has(id)))]
    : [];
  const cameras: [string, PhotoWalkCamera][] = [];
  if (isRecord(value.cameras)) {
    for (const [id, camera] of Object.entries(value.cameras)) {
      if (!viewIds.has(id) || !isRecord(camera)) continue;
      const { x, y, zoom } = camera;
      if (typeof x !== "number" || typeof y !== "number" || typeof zoom !== "number"
        || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom)) continue;
      cameras.push([id, { x: clamp(x, 0, 1), y: clamp(y, 0, 1), zoom: clamp(zoom, 1, 2.5) }]);
    }
  }
  return {
    version: 1,
    visited: knownIds(value.visited, viewIds),
    found: knownIds(value.found, objectIds),
    cameras: Object.fromEntries(cameras),
  };
}

function parseProgress(raw: string | null, views: readonly PhotoWalkView[]): PhotoWalkProgress {
  try {
    return validateProgress(raw === null ? null : JSON.parse(raw), views);
  } catch {
    return emptyProgress();
  }
}

export function readPhotoWalkProgress(
  views: readonly PhotoWalkView[],
  storage: PhotoWalkStorage | null = browserStorage(),
): PhotoWalkProgress {
  try {
    return parseProgress(storage?.getItem(PHOTO_WALK_PROGRESS_KEY) ?? null, views);
  } catch {
    return emptyProgress();
  }
}

export function writePhotoWalkProgress(
  progress: PhotoWalkProgress,
  views: readonly PhotoWalkView[],
  storage: PhotoWalkStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    // Re-read before writing so a stale scene/tab does not erase prior discoveries.
    // localStorage has no cross-tab transaction; this is a best-effort merge.
    const saved = parseProgress(storage.getItem(PHOTO_WALK_PROGRESS_KEY), views);
    const next = validateProgress(progress, views);
    const merged: PhotoWalkProgress = {
      version: 1,
      visited: [...new Set([...saved.visited, ...next.visited])],
      found: [...new Set([...saved.found, ...next.found])],
      cameras: { ...saved.cameras, ...next.cameras },
    };
    storage.setItem(PHOTO_WALK_PROGRESS_KEY, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

/** Explicit replay action: clear only this game's progress, bypassing the merge. */
export function resetPhotoWalkProgress(
  views: readonly PhotoWalkView[],
  storage: PhotoWalkStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PHOTO_WALK_PROGRESS_KEY, JSON.stringify(validateProgress(emptyProgress(), views)));
    return true;
  } catch {
    return false;
  }
}
