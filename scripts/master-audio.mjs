import { spawnSync } from "node:child_process";
const tracks = [
  ["music/forest-understory", "loudnorm=I=-32:TP=-9:LRA=5"],
  [
    "ambience/woodland-air",
    "loudnorm=I=-26:TP=-9:LRA=6,afade=t=in:d=0.4,afade=t=out:st=29.4:d=0.6",
  ],
  [
    "ambience/birds-canopy",
    "loudnorm=I=-28:TP=-9:LRA=6,afade=t=in:d=0.4,afade=t=out:st=29.4:d=0.6",
  ],
  [
    "sfx/ui-press-soft",
    "highpass=f=120,lowpass=f=5500,afade=t=in:d=0.012,afade=t=out:st=0.35:d=0.15",
    -14,
  ],
  [
    "sfx/uncover",
    "highpass=f=140,lowpass=f=6500,afade=t=in:d=0.012,afade=t=out:st=0.95:d=0.25",
    -10,
  ],
];
const target = process.argv[2] ?? "all";
for (const [file, filter, targetPeak] of tracks) {
  if (target === "sfx" && !file.startsWith("sfx/")) continue;
  let appliedFilter = filter;
  if (targetPeak !== undefined) {
    // Generated "soft" cues can already be nearly silent. Measure AFTER
    // filtering and use one fixed gain; don't stack arbitrary attenuation.
    const probe = spawnSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-i",
        `public/assets/audio/${file}.mp3`,
        "-af",
        `${filter},volumedetect`,
        "-f",
        "null",
        "-",
      ],
      { encoding: "utf8" },
    );
    const match = probe.stderr.match(/max_volume:\s*(-?[\d.]+) dB/);
    if (probe.status !== 0 || !match) throw new Error(`Cannot measure ${file}`);
    const peak = Number(match[1]);
    if (!Number.isFinite(peak) || peak < -80)
      throw new Error(`Silent cue: ${file}`);
    appliedFilter = `${filter},volume=${(targetPeak - peak).toFixed(2)}dB`;
    console.log(
      `${file}: filtered peak ${peak} dBFS -> ${targetPeak} dBFS before playback slider`,
    );
  }
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      `public/assets/audio/${file}.mp3`,
      "-af",
      appliedFilter,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "128k",
      `public/assets/audio/${file}-mix.mp3`,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`mastered ${file}`);
}
