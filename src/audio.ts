export type SfxId =
  | "ui-press"
  | "uncover"
  | "journal-open"
  | "lens-open"
  | "discovery"
  | "save-local";
export type SoundLevels = { music: number; nature: number; effects: number };
export const defaultSoundLevels: SoundLevels = {
  music: 12,
  nature: 45,
  effects: 18,
};

class AudioManager {
  private loops: {
    audio: HTMLAudioElement;
    channel: "music" | "nature";
    gain: number;
  }[] = [];
  private sfx = new Map<SfxId, HTMLAudioElement>();
  private enabled = false;
  private muted = true;
  private levels: SoundLevels = { ...defaultSoundLevels };
  private lastPress = 0;

  constructor() {
    document.addEventListener("visibilitychange", this.handleVisibility);
    window.addEventListener("pagehide", this.pauseAll);
  }

  async enable(): Promise<boolean> {
    this.enabled = true;
    this.muted = false;
    this.ensureLoops();
    const results = await this.playLoops();
    const playing = results.some((result) => result.status === "fulfilled");
    if (!playing) this.muted = true;
    return playing;
  }

  disable(): void {
    this.enabled = false;
    this.pauseAll();
  }
  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.pauseAll();
    else if (this.enabled) void this.playLoops();
  }

  setLevels(levels: SoundLevels): void {
    this.levels = {
      music: Math.max(0, Math.min(100, levels.music)),
      nature: Math.max(0, Math.min(100, levels.nature)),
      effects: Math.max(0, Math.min(100, levels.effects)),
    };
    for (const loop of this.loops)
      loop.audio.volume = (this.levels[loop.channel] / 100) * loop.gain;
    for (const [id, audio] of this.sfx) audio.volume = this.effectVolume(id);
  }

  playSfx(id: SfxId): void {
    if (
      !this.enabled ||
      this.muted ||
      document.hidden ||
      this.levels.effects === 0
    )
      return;
    if (id === "ui-press" && performance.now() - this.lastPress < 120) return;
    this.lastPress = performance.now();
    let audio = this.sfx.get(id);
    if (!audio) {
      audio = new Audio(
        `/assets/audio/sfx/${id === "ui-press" ? "ui-press-soft-mix" : id === "uncover" ? "uncover-mix" : id}.mp3`,
      );
      this.sfx.set(id, audio);
    }
    audio.currentTime = 0;
    audio.volume = this.effectVolume(id);
    void audio.play().catch(() => undefined);
  }

  private effectVolume(id: SfxId): number {
    // Masters already have softened transients. Do not attenuate taps twice
    // into silence; uncovering is a distinct, slightly more present foley cue.
    return (
      (this.levels.effects / 100) *
      (id === "uncover" ? 0.9 : id === "ui-press" ? 0.65 : 0.4)
    );
  }

  private ensureLoops(): void {
    if (this.loops.length) return;
    this.loops = [
      {
        path: "music/forest-stillness-long",
        channel: "music" as const,
        gain: 0.45,
      },
      {
        path: "ambience/dry-canopy-long",
        channel: "nature" as const,
        gain: 0.38,
      },
      {
        path: "ambience/distant-birds-long",
        channel: "nature" as const,
        gain: 0.25,
      },
    ].map(({ path, channel, gain }) => {
      const audio = new Audio(`/assets/audio/${path}.mp3`);
      audio.loop = true;
      audio.preload = "metadata";
      audio.volume = (this.levels[channel] / 100) * gain;
      return { audio, channel, gain };
    });
  }

  private async playLoops(): Promise<PromiseSettledResult<void>[]> {
    if (!this.enabled || this.muted || document.hidden) return [];
    this.ensureLoops();
    return Promise.allSettled(this.loops.map(({ audio }) => audio.play()));
  }

  private pauseAll = (): void => {
    for (const { audio } of this.loops) audio.pause();
    for (const audio of this.sfx.values()) audio.pause();
  };

  private handleVisibility = (): void => {
    if (document.hidden) this.pauseAll();
    else void this.playLoops();
  };

  dispose(): void {
    this.pauseAll();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    window.removeEventListener("pagehide", this.pauseAll);
    this.loops = [];
    this.sfx.clear();
  }
}

export const audioManager = new AudioManager();
if (import.meta.hot) import.meta.hot.dispose(() => audioManager.dispose());
