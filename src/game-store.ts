import type { TaxonId } from "./data";

export type Discovery = {
  id: string;
  taxonId: TaxonId;
  mediaId: string;
  question: string;
  answer: string;
  note: string;
  createdAt: string;
};
export type Journey = { visited: string[]; discoveries: Discovery[] };
export const emptyJourney: Journey = { visited: [], discoveries: [] };
const KEY = "mixor-journey-v2";

export function readJourney(): Journey {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!raw || typeof raw !== "object") return emptyJourney;
    const value = raw as Partial<Journey>;
    if (
      !Array.isArray(value.visited) ||
      !value.visited.every((x) => typeof x === "string") ||
      !Array.isArray(value.discoveries)
    )
      return emptyJourney;
    return {
      visited: value.visited,
      discoveries: value.discoveries.filter(
        (x) =>
          x &&
          [
            x.id,
            x.taxonId,
            x.mediaId,
            x.question,
            x.answer,
            x.note,
            x.createdAt,
          ].every((y) => typeof y === "string"),
      ),
    };
  } catch {
    return emptyJourney;
  }
}

export function writeJourney(journey: Journey): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(journey));
    return true;
  } catch {
    return false;
  }
}

export function makeId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
