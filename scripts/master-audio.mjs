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
  ["sfx/ui-press-soft", "volume=0.1"],
];
for (const [file, filter] of tracks) {
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
      filter,
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
