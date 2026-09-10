export type SoundLevels = { music: number; nature: number; effects: number };
export const defaultSoundLevels: SoundLevels = { music: 36, nature: 90, effects: 36 };
export const soundPreferencesKey = "mixor-sound-settings-v3";
export type SoundPreferences = {
  version: 3;
  sound: "on" | "off";
  soundOrigin: "default" | "explicit" | "legacy";
  levelsMode: "default" | "custom";
  levels: SoundLevels;
};

const validLevels = (value: unknown): value is SoundLevels => {
  if (!value || typeof value !== "object") return false;
  const levels = value as SoundLevels;
  return (["music", "nature", "effects"] as const).every((key) =>
    typeof levels[key] === "number" && Number.isFinite(levels[key]) && levels[key] >= 0 && levels[key] <= 100);
};

export function migrateSoundPreferences(current: unknown, legacyLevels: unknown, legacyMuted: unknown): SoundPreferences {
  if (current && typeof current === "object") {
    const saved = current as Partial<SoundPreferences>;
    if (saved.version === 3 && (saved.sound === "on" || saved.sound === "off") &&
        ["default", "explicit", "legacy"].includes(saved.soundOrigin ?? "") &&
        (saved.levelsMode === "default" || saved.levelsMode === "custom") && validLevels(saved.levels)) {
      return { version: 3, sound: saved.sound, soundOrigin: saved.soundOrigin!, levelsMode: saved.levelsMode,
        levels: { ...(saved.levelsMode === "custom" ? saved.levels : defaultSoundLevels) } };
    }
  }
  const legacyDefault = validLevels(legacyLevels) && legacyLevels.music === 12 && legacyLevels.nature === 45 && legacyLevels.effects === 18;
  const custom = validLevels(legacyLevels) && !legacyDefault;
  // Approved legacy assumptions: v2 auto-saved levels on mount; an exact
  // default tuple cannot be distinguished from a deliberately matching choice.
  // Legacy true could mean explicit mute OR autoplay failure: preserve off.
  // Old "start quietly" without a stored key cannot be reconstructed.
  return { version: 3, sound: legacyMuted === true ? "off" : "on",
    soundOrigin: typeof legacyMuted === "boolean" ? "legacy" : "default",
    levelsMode: custom ? "custom" : "default", levels: { ...(custom ? legacyLevels : defaultSoundLevels) } };
}

export function readSoundPreferences(): SoundPreferences {
  const read = (key: string): unknown => {
    try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
  };
  return migrateSoundPreferences(read(soundPreferencesKey), read("mixor-sound-levels-v2"), read("mixor-muted"));
}

export function writeSoundPreferences(preferences: SoundPreferences): boolean {
  try {
    localStorage.setItem(soundPreferencesKey, JSON.stringify(preferences));
    // Leave legacy keys intact for rollback; only v3 is authoritative now.
    return true;
  } catch { return false; }
}
