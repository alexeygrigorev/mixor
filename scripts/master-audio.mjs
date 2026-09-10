import { spawnSync } from "node:child_process";
import { copyFileSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { analyzeAudio, decode, sha256 } from "./analyze-audio.mjs";
function cueShape(file) {
  const pcm = decode(file, 16000, 1), rate = 16000;
  const rms = (start, end) => {
    const samples = pcm.slice(Math.round(start * rate), Math.round(end * rate));
    return 10 * Math.log10(samples.reduce((sum, x) => sum + x * x, 0) / samples.length);
  };
  let periodicity = { correlation: 0, hz: 0 };
  for (let lag = 8; lag <= 160; lag++) {
    let cross = 0, a = 0, b = 0;
    for (let i = lag; i < pcm.length; i++) {
      cross += pcm[i] * pcm[i - lag]; a += pcm[i] ** 2; b += pcm[i - lag] ** 2;
    }
    const correlation = cross / Math.sqrt(a * b);
    if (correlation > periodicity.correlation) periodicity = { correlation, hz: rate / lag };
  }
  return {
    method: "Full-clip arithmetic stereo mean decoded at 16 kHz; normalized autocorrelation for integer lags 8–160 (100–2000 Hz). A periodicity indicator, not a pitch/timbre or subjective acceptance test.",
    first20msRmsDbfs: rms(0, 0.02), body80to280msRmsDbfs: rms(0.08, 0.28),
    last20msRmsDbfs: rms(pcm.length / rate - 0.02, pcm.length / rate), periodicity,
  };
}
const tracks = [
  [
    "sfx/leaf-friction-v3",
    "atrim=start_sample=16758:end_sample=35280,asetpts=PTS-STARTPTS,highpass=f=500:p=2,lowpass=f=3800:p=2,afade=t=in:d=0.08:curve=tri,afade=t=out:st=0.28:d=0.14:curve=tri",
    -14.5,
    "sfx/uncover",
  ],
  [
    "sfx/uncover",
    "highpass=f=140,lowpass=f=6500,afade=t=in:d=0.012,afade=t=out:st=0.95:d=0.25",
    -10,
  ],
];
const target = process.argv[2] ?? "all";
if (!["all", "sfx", "leaf-friction-v3", "uncover"].includes(target) || process.argv.length > 3)
  throw new Error("Choose all, sfx, leaf-friction-v3 or uncover; no force option.");
mkdirSync("tmp/audio-feedback", { recursive: true });
const scratch = mkdtempSync("tmp/audio-feedback/cue-");
const candidates = [];
for (const [file, filter, targetPeak, source = file] of tracks) {
  if (!["all", "sfx"].includes(target) && file !== `sfx/${target}`) continue;
  const sourcePath = `public/assets/audio/${source}.mp3`;
  const final = `public/assets/audio/${file}-mix.mp3`;
  const candidate = `${scratch}/${file.split("/").at(-1)}-mix.mp3`;
  const sourceHash = sha256(sourcePath), beforeHash = existsSync(final) ? sha256(final) : null;
  if (beforeHash) copyFileSync(final, `${candidate}.before.mp3`, constants.COPYFILE_EXCL);
  let appliedFilter = filter;
  let gainDb = 0;
  if (targetPeak !== undefined) {
    // Generated "soft" cues can already be nearly silent. Measure AFTER
    // filtering and use one fixed gain; don't stack arbitrary attenuation.
    const probe = spawnSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-i",
        sourcePath,
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
    gainDb = Number((targetPeak - peak).toFixed(2));
    appliedFilter = `${filter},volume=${gainDb.toFixed(2)}dB`;
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
      sourcePath,
      "-af",
      appliedFilter,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "128k",
      candidate,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  const measurements = analyzeAudio(candidate, { spectral: false });
  const shape = file === "sfx/leaf-friction-v3" ? cueShape(candidate) : null;
  if (measurements.truePeakDbfs === null || measurements.truePeakDbfs > -9 || measurements.rmsDbfs < -45)
    throw new Error(`Cue is outside digital level bounds: ${file}`);
  if (file === "sfx/leaf-friction-v3" && (Math.abs(measurements.decodedSeconds - 0.42) > 1 / 44100 || measurements.truePeakDbfs > -13.5))
    throw new Error("Rustle duration/peak validation failed");
  if (shape && (shape.first20msRmsDbfs > shape.body80to280msRmsDbfs - 10 || shape.periodicity.correlation > 0.25))
    throw new Error("Rustle onset/periodicity guard failed; listening still required if these pass");
  candidates.push({ file, sourcePath, sourceHash, final, candidate, beforeHash, appliedFilter, gainDb, measurements, shape });
}
for (const cue of candidates) {
  if (sha256(cue.sourcePath) !== cue.sourceHash || (existsSync(cue.final) ? sha256(cue.final) : null) !== cue.beforeHash)
    throw new Error(`Concurrent audio edit: ${cue.file}`);
}
for (const cue of candidates) {
  const staged = `${cue.candidate}.install.mp3`;
  copyFileSync(cue.candidate, staged, constants.COPYFILE_EXCL);
  renameSync(staged, cue.final);
  if (cue.file === "sfx/leaf-friction-v3") {
    const receipt = {
      schemaVersion: 1, id: "leaf-friction-v3", kind: "local-derived-foley", isGenerated: true,
      sourcePath: cue.sourcePath, sourceSha256: cue.sourceHash,
      sourceProvenance: { provider: "Existing ElevenLabs-generated bark/leaf uncover raw", promptDefinitionFile: "scripts/generate-mixor-audio.mjs", originalApiReceiptAvailable: false, newApiRequests: 0 },
      selection: { startSeconds: 0.38, endSeconds: 0.8, seconds: 0.42, reason: "Use the later friction/rustle section; exclude the strongest raw contact transient at 0.10–0.25 seconds." },
      recipe: { reproduce: "node scripts/master-audio.mjs leaf-friction-v3", filter: cue.appliedFilter, fixedGainDb: cue.gainDb, encoder: "libmp3lame", bitrate: "128k" },
      output: { ...cue.measurements, path: cue.final },
      signalComparison: { rejectedWood: cueShape("public/assets/audio/sfx/fingertip-wood-v2-mix.mp3"), replacement: cue.shape, defaultRuntimeGain: 0.36 * 0.65 * 0.3, defaultRmsDbfs: cue.measurements.rmsDbfs + 20 * Math.log10(0.36 * 0.65 * 0.3), defaultTruePeakDbfs: cue.measurements.truePeakDbfs + 20 * Math.log10(0.36 * 0.65 * 0.3) },
      feedback: { request: "U52", volumeRequest: "U58", speakerDefaultsRequest: "U60", defaultEffectsPercent: 36, runtimeMultiplierOfPrevious: 0.3, previousCue: "sfx/fingertip-wood-v2-mix.mp3", previousCueStatus: "user-rejected", acceptance: "pending user listening" },
      physicalAudition: false, userAccepted: false,
      limits: ["Numeric signal bounds do not establish natural timbre, absence of an audible impact/tone, or audibility on physical speakers.", "Derived from an existing generated raw, not a newly recorded field sound; no new API generation."],
    };
    writeFileSync("content/audio/leaf-friction-v3.derived.json", `${JSON.stringify(receipt, null, 2)}\n`);
    const reportPath = "content/audio-mastering-report.json";
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    report.retained = report.retained.filter((m) => !/sfx\/(fingertip-wood-v2-mix|leaf-friction-v3-mix)\.mp3$/.test(m.path));
    report.retained.push({ ...cue.measurements, path: cue.final });
    report.derivedCues = [receipt];
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(`mastered ${cue.file}: ${cue.measurements.decodedSeconds}s; ${cue.measurements.rmsDbfs} dBFS RMS; ${cue.measurements.truePeakDbfs} dBFS true peak`);
}
console.log(`Candidate measurements/backups: ${scratch}`);
