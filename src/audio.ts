export type SfxId =
  | "ui-press"
  | "uncover"
  | "journal-open"
  | "lens-open"
  | "discovery"
  | "save-local";
export type SoundLevels = { music: number; nature: number; effects: number };
export const defaultSoundLevels: SoundLevels = { music: 12, nature: 45, effects: 18 };

type LoopId = "music" | "wind" | "birds" | "rain";
type SceneId = "forest" | "stump" | "leaves" | "roots" | "bark";
type SceneMix = Record<LoopId, number>;
type Loop = {
  id: LoopId;
  audio: HTMLAudioElement;
  channel: "music" | "nature";
  gain: number;
  pending?: Promise<void>;
};

const HOME: SceneMix = { music: 1, wind: 0.45, birds: 0.55, rain: 0 };
const SCENES: Record<SceneId, SceneMix> = {
  forest: { music: 1, wind: 1, birds: 1, rain: 0 },
  stump: { music: 1, wind: 0.7, birds: 0.55, rain: 0 },
  leaves: { music: 1, wind: 1, birds: 0.65, rain: 0 },
  roots: { music: 1, wind: 0.45, birds: 0.18, rain: 0.9 },
  bark: { music: 1, wind: 0.35, birds: 0.12, rain: 0.65 },
};

const TRACKS: Record<LoopId, { path: string; channel: "music" | "nature"; gain: number }> = {
  music: { path: "music/forest-acoustic-v2-long", channel: "music", gain: 0.45 },
  wind: { path: "ambience/dry-leaves-v2-long", channel: "nature", gain: 0.38 },
  birds: { path: "ambience/distant-birds-long", channel: "nature", gain: 0.25 },
  rain: { path: "ambience/canopy-rain-v2-loop", channel: "nature", gain: 0.32 },
};

class AudioManager {
  private loops = new Map<LoopId, Loop>();
  private sfx = new Map<SfxId, HTMLAudioElement>();
  private enabled = false;
  private muted = true;
  private pageHidden = false;
  private scene: SceneId | null = null;
  private levels: SoundLevels = { ...defaultSoundLevels };
  private lastPress = -Infinity;
  private lastSfx: SfxId | null = null;

  constructor() {
    document.addEventListener("visibilitychange", this.handleVisibility);
    window.addEventListener("pagehide", this.handlePageHide);
    window.addEventListener("pageshow", this.handlePageShow);
  }

  // The caller supplies the VISIBLE woodland, including behind a discovery
  // portrait. Modals do not call this API. Null/unknown means dry home ambience.
  setScene(id: string | null): void {
    const next = id && Object.hasOwn(SCENES, id) ? id as SceneId : null;
    if (next === this.scene) return;
    this.scene = next;
    this.applyVolumes();
    if (this.canPlay()) void this.playLoops();
  }

  async enable(): Promise<boolean> {
    this.enabled = true;
    this.muted = false;
    if (!this.canPlay()) return false;
    const results = await this.playLoops();
    if (!this.canPlay()) return false;
    const playing = results.length === 0 || results.some((r) => r.status === "fulfilled");
    if (!playing) this.muted = true;
    return playing;
  }

  disable(): void {
    this.enabled = false;
    this.pauseAll();
  }

  isMuted(): boolean { return this.muted; }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.pauseAll();
    else if (this.enabled) void this.playLoops();
  }

  setLevels(levels: SoundLevels): void {
    const bound = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    this.levels = {
      music: bound(levels.music), nature: bound(levels.nature), effects: bound(levels.effects),
    };
    this.applyVolumes();
    for (const [id, audio] of this.sfx) {
      audio.volume = this.effectVolume(id);
      if (this.levels.effects === 0) audio.pause();
    }
    if (this.canPlay()) void this.playLoops();
  }

  playSfx(id: SfxId): void {
    if (!this.canPlay() || this.levels.effects === 0) return;
    if (id === "ui-press") {
      if (performance.now() - this.lastPress < 120) return;
    }
    // Saving already has its own cue; its immediate navigation into the
    // journal must not add a second sound to the same click.
    if (id === "journal-open" && this.lastSfx === "save-local" && performance.now() - this.lastPress < 120) return;
    // A specific handler runs before the app's generic bubbling tap handler.
    // Stamp every accepted cue immediately, before play() settles, so that
    // generic ui-press cannot stack the same foley on lens/save/etc.
    this.lastPress = performance.now();
    this.lastSfx = id;
    let audio = this.sfx.get(id);
    if (!audio) {
      // Navigation, lens/stage changes and save use a later leaf/bark friction
      // excerpt, not the user-rejected wood contact or pitched reward cues.
      const file = id === "uncover" ? "uncover-mix"
        : id === "journal-open" ? "journal-open" : "leaf-friction-v3-mix";
      audio = new Audio("/assets/audio/sfx/" + file + ".mp3");
      this.sfx.set(id, audio);
    }
    audio.currentTime = 0;
    audio.volume = this.effectVolume(id);
    void audio.play().then(() => {
      if (!this.canPlay() || this.levels.effects === 0) audio.pause();
    }).catch(() => undefined);
  }

  private effectVolume(id: SfxId): number {
    return (this.levels.effects / 100) * (id === "uncover" ? 0.9 : id === "journal-open" ? 0.4 : 0.65);
  }

  private mix(): SceneMix { return this.scene ? SCENES[this.scene] : HOME; }
  private canPlay(): boolean {
    return this.enabled && !this.muted && !document.hidden && !this.pageHidden;
  }
  private wants(loop: Loop): boolean {
    return this.canPlay() && this.mix()[loop.id] > 0 && this.levels[loop.channel] > 0;
  }

  private applyVolumes(): void {
    for (const loop of this.loops.values()) {
      loop.audio.volume = (this.levels[loop.channel] / 100) * loop.gain * this.mix()[loop.id];
      // Rain stops immediately on leaving visible rain. Other active stems
      // keep their element and playback position across all scene changes.
      if (!this.wants(loop) && !loop.audio.paused) loop.audio.pause();
    }
  }

  private async playLoops(): Promise<PromiseSettledResult<void>[]> {
    if (!this.canPlay()) return [];
    const wanted = (Object.keys(TRACKS) as LoopId[]).filter((id) => this.mix()[id] > 0 && this.levels[TRACKS[id].channel] > 0);
    for (const id of wanted) {
      if (this.loops.has(id)) continue;
      const { path, channel, gain } = TRACKS[id];
      const audio = new Audio("/assets/audio/" + path + ".mp3");
      audio.loop = true;
      audio.preload = "metadata";
      this.loops.set(id, { id, audio, channel, gain });
    }
    this.applyVolumes();
    return Promise.allSettled(wanted.map((id) => {
      const loop = this.loops.get(id)!;
      if (loop.pending) return loop.pending;
      if (!loop.audio.paused) return Promise.resolve();
      let cancelled = false;
      loop.pending = loop.audio.play().then(() => {
        if (!this.wants(loop)) loop.audio.pause();
      }).catch((error: unknown) => {
        cancelled = error instanceof DOMException && error.name === "AbortError";
        throw error;
      }).finally(() => {
        loop.pending = undefined;
        // A rapid wet → dry → wet switch can cancel an in-flight play.
        // Resume the final requested state, never retry network/autoplay errors.
        if (cancelled && this.wants(loop) && loop.audio.paused) void this.playLoops();
      });
      return loop.pending;
    }));
  }

  private pauseAll = (): void => {
    for (const { audio } of this.loops.values()) audio.pause();
    for (const audio of this.sfx.values()) audio.pause();
  };

  private handleVisibility = (): void => {
    if (document.hidden) this.pauseAll();
    else void this.playLoops();
  };
  private handlePageHide = (): void => {
    this.pageHidden = true;
    this.pauseAll();
  };
  private handlePageShow = (): void => {
    this.pageHidden = false;
    void this.playLoops();
  };

  dispose(): void {
    this.enabled = false;
    this.pauseAll();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    window.removeEventListener("pagehide", this.handlePageHide);
    window.removeEventListener("pageshow", this.handlePageShow);
    for (const audio of [...this.loops.values()].map((l) => l.audio).concat([...this.sfx.values()])) {
      audio.removeAttribute("src");
      audio.load();
    }
    this.loops.clear();
    this.sfx.clear();
  }
}

export const audioManager = new AudioManager();
if (import.meta.hot) import.meta.hot.dispose(() => audioManager.dispose());
