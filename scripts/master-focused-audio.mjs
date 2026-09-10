#!/usr/bin/env node
// Local-only, deterministic mastering of the existing generated raw MP3s.
// Preview: node scripts/master-focused-audio.mjs [all|music|wind|rain]
// Install after ALL selected candidates pass: add --install.
// Exact graphs, measurements, hashes and previous masters stay in tmp/audio-feedback.
// No loudnorm, compressor, automatic makeup, adaptive noise tracking or paid APIs.
import { copyFileSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAudio, decode, run, sha256 } from "./analyze-audio.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--")) ?? "all";
if (!["all", "music", "wind", "rain"].includes(target) || args.some((arg) => arg.startsWith("--") && arg !== "--install"))
  throw new Error("Usage: master-focused-audio.mjs [all|music|wind|rain] [--install]");
const install = args.includes("--install"), rate = 44100;
mkdirSync("tmp/audio-feedback", { recursive: true });
const scratch = mkdtempSync("tmp/audio-feedback/master-");
const report = {
  schemaVersion: 3, ffmpeg: run("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0],
  scratch, installed: false, physicalAudition: false,
  limits: ["User rejected the previous drone source; new source timbre and subjective buzz removal remain unaccepted until listening.", "Spectral measurements and digital level bounds are not a physical audition or acoustic loudness guarantee.", "Wind arrangement repeats two generated 30-second sources twice; rain uses five distinct 30-second sources once each, with five 4-second overlaps yielding 130 seconds.", "MP3 decoded seams are checked numerically; device gapless playback and the combined scene mix still require listening."],
  sources: {}, commands: [], tracks: [],
};
function ffmpeg(args) {
  const command = ["-y", "-hide_banner", "-loglevel", "error", "-threads", "1", "-filter_threads", "1", "-filter_complex_threads", "1", ...args];
  run("ffmpeg", command);
  report.commands.push({ executable: "ffmpeg", args: command });
}
const format = "aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS";
const waveArgs = ["-ar", "44100", "-ac", "2", "-c:a", "pcm_f32le", "-map_metadata", "-1"];
function source(file) {
  report.sources[file] = sha256(file);
  return file;
}
function filter(input, output, graph) {
  ffmpeg(["-i", input, "-af", `${format},${graph}`, ...waveArgs, output]);
}
function frameCount(file) { return decode(file).length / 2; }
const compact = (m) => ({ ...m, spectrum: m.spectrum ? { ...m.spectrum, meanPowerDbfs: undefined } : undefined });

// Fit one constant gain using whole-source RMS/true peak, including very quiet
// sources below the EBU absolute gate. Never chase instantaneous loudness.
function fixedGain(input, output, targetRms, peakCeiling) {
  const measured = analyzeAudio(input, { spectral: false });
  const gainDb = Math.floor(1000 * Math.min(targetRms - measured.rmsDbfs, peakCeiling - measured.truePeakDbfs)) / 1000;
  if (!Number.isFinite(gainDb) || Math.abs(gainDb) > 50) throw new Error(`Unreasonable fixed gain for ${input}`);
  filter(input, output, `volume=${gainDb}dB:precision=double`);
  return { input, targetRmsDbfs: targetRms, peakCeilingDbfs: peakCeiling, gainDb, measured };
}

function circular(input, output, seamSeconds = 6) {
  const frames = frameCount(input), seam = seamSeconds * rate, end = frames - seam;
  if (frames < 3 * seam) throw new Error("Loop is too short");
  // Exact sample trims avoid MP3 container padding. FFmpeg 6.1 acrossfade
  // dropped the entire join for two inputs exactly as long as its fade;
  // explicit complementary fades and an unnormalized sum preserve all samples.
  const graph = `[0:a]asplit=3[m][t][h];[m]atrim=start_sample=${seam}:end_sample=${end},asetpts=PTS-STARTPTS[mid];[t]atrim=start_sample=${end}:end_sample=${frames},asetpts=PTS-STARTPTS,afade=t=out:ss=0:ns=${seam}:curve=tri[tail];[h]atrim=end_sample=${seam},asetpts=PTS-STARTPTS,afade=t=in:ss=0:ns=${seam}:curve=tri[head];[tail][head]amix=inputs=2:normalize=0:duration=longest:dropout_transition=0[join];[mid][join]concat=n=2:v=0:a=1[out]`;
  ffmpeg(["-i", input, "-filter_complex", graph, "-map", "[out]", ...waveArgs, output]);
  if (frameCount(output) !== frames - seam) throw new Error("Circular crossfade lost samples");
  return { seamSeconds, inputFrames: frames, outputFrames: frames - seam, graph };
}

const selected = target === "all" ? ["music", "wind", "rain"] : [target];
for (const kind of selected) {
  const name = { music: "music/forest-acoustic-v2-long.mp3", wind: "ambience/dry-leaves-v2-long.mp3", rain: "ambience/canopy-rain-v2-loop.mp3" }[kind];
  const final = `public/assets/audio/${name}`, candidate = `${scratch}/${path.basename(name)}`;
  const beforeHash = existsSync(final) ? sha256(final) : null;
  if (beforeHash) copyFileSync(final, `${scratch}/before-${path.basename(name)}`, constants.COPYFILE_EXCL);
  const track = { kind, final, candidate, beforeHash, processing: [] };
  let assembled;
  if (kind === "music") {
    const input = source("public/assets/audio/music/forest-acoustic-v2.mp3");
    // The rejected sustained music source is replaced, not notched again.
    // Gentle EQ removes subsonic recording energy and softens high transients.
    const eq = "highpass=f=90:p=2,lowpass=f=5200:p=2";
    const filtered = `${scratch}/${kind}-filtered.wav`;
    filter(input, filtered, eq);
    assembled = `${scratch}/${kind}-gain.wav`;
    track.processing.push({ source: input, eq, level: fixedGain(filtered, assembled, -38, -20) });
  } else if (kind === "rain") {
    const files = [], ids = ["canopy-rain-v2", "canopy-rain-v2-b", "canopy-rain-v2-c", "canopy-rain-v2-d", "canopy-rain-v2-e"];
    const seconds = 30, overlap = 4, frames = seconds * rate, fadeFrames = overlap * rate;
    for (const [i, id] of ids.entries()) {
      const input = source(`public/assets/audio/ambience/${id}.mp3`);
      const sourceMeasurements = analyzeAudio(input);
      if (sourceMeasurements.decodedSeconds * rate < frames) throw new Error(`${id}: needs 30 seconds of source material`);
      const stem = `${scratch}/rain-${i + 1}`;
      const eq = "highpass=f=350:p=2,highpass=f=350:p=2,lowpass=f=5000:p=2,lowpass=f=5000:p=2";
      filter(input, `${stem}-eq.wav`, `atrim=end_sample=${frames},${eq}`);
      // Match the previous quiet rain's measured mean, with a fixed peak cap.
      // One constant gain per complete source; no dynamic normalization.
      const level = fixedGain(`${stem}-eq.wav`, `${stem}-gain.wav`, -53, -22);
      files.push(`${stem}-gain.wav`);
      track.processing.push({ source: input, sourceMeasurements: compact(sourceMeasurements), eq, level });
    }
    if (new Set(track.processing.map((p) => report.sources[p.source])).size !== 5) throw new Error("Rain needs five distinct raw files, not duplicated sources");
    assembled = `${scratch}/rain-assembled.wav`;
    const offsets = files.map((_, i) => i * (frames - fadeFrames));
    const graph = files.map((_, i) => `[${i}:a]${i > 0 ? `afade=t=in:ss=0:ns=${fadeFrames}:curve=tri,` : ""}${i < files.length - 1 ? `afade=t=out:ss=${frames - fadeFrames}:ns=${fadeFrames}:curve=tri,` : ""}adelay=${offsets[i]}S:all=1,asetpts=PTS-STARTPTS[s${i}]`).join(";")
      + `;${files.map((_, i) => `[s${i}]`).join("")}amix=inputs=5:normalize=0:duration=longest:dropout_transition=0[out]`;
    ffmpeg([...files.flatMap((file) => ["-i", file]), "-filter_complex", graph, "-map", "[out]", ...waveArgs, assembled]);
    if (frameCount(assembled) !== frames * 5 - fadeFrames * 4) throw new Error("Rain crossfades lost source samples");
    track.arrangement = { sourceOrder: ids, sourceSecondsEach: seconds, uniqueSourceSeconds: seconds * 5, repetitionsPerSource: 1, overlapSeconds: overlap, offsetsSamples: offsets, graph };
  } else {
    const files = [];
    for (let i = 0; i < 2; i++) {
      const input = source(`public/assets/audio/ambience/dry-leaves-v2-${i === 0 ? "a" : "b"}.mp3`);
      const stem = `${scratch}/${kind}-${i + 1}`;
      const eq = "highpass=f=350:p=2,highpass=f=350:p=2,lowpass=f=6000:p=2,lowpass=f=6000:p=2";
      filter(input, `${stem}-eq.wav`, `atrim=end_sample=${30 * rate},${eq}`);
      const level = fixedGain(`${stem}-eq.wav`, `${stem}-gain.wav`, -44, -25);
      files.push(`${stem}-gain.wav`);
      track.processing.push({ source: input, eq, level });
    }
    assembled = `${scratch}/${kind}-assembled.wav`;
    const arranged = [...files, ...files];
    const lengths = [38, 45, 41, 49], delays = [1, 4, 2, 6];
    const graph = arranged.map((_, i) => `[${i}:a]afade=t=in:d=4,afade=t=out:st=24:d=6,adelay=${delays[i] * rate}S:all=1,apad=whole_len=${lengths[i] * rate},atrim=end_sample=${lengths[i] * rate},asetpts=PTS-STARTPTS[s${i}]`).join(";")
      + `;${arranged.map((_, i) => `[s${i}]`).join("")}concat=n=4:v=0:a=1[out]`;
    ffmpeg([...arranged.flatMap((file) => ["-i", file]), "-filter_complex", graph, "-map", "[out]", ...waveArgs, assembled]);
    track.arrangement = { uniqueSourceSeconds: 60, repetitionsPerSource: 2, lengthsSeconds: lengths, delaysSeconds: delays, graph };
  }
  const loop = `${scratch}/${kind}-loop.wav`;
  track.loop = circular(assembled, loop, kind === "rain" ? 4 : 6);
  ffmpeg(["-i", loop, "-map_metadata", "-1", "-ar", "44100", "-ac", "2", "-codec:a", "libmp3lame", "-b:a", "128k", "-write_xing", "1", "-id3v2_version", "0", candidate]);
  track.measurements = analyzeAudio(candidate);
  const m = track.measurements;
  if (Math.abs(m.decodedSeconds * rate - track.loop.outputFrames) > 1) throw new Error(`${kind}: encoded duration differs from PCM loop`);
  if (m.decodedSeconds <= (kind === "wind" ? 150 : 120)) throw new Error(`${kind}: duration is too short`);
  if (m.truePeakDbfs === null || m.truePeakDbfs > -18) throw new Error(`${kind}: unexpected peak`);
  if (m.rmsDbfs < -58 || m.level.p90Dbfs < -56) throw new Error(`${kind}: useful content is too quiet`);
  if (m.seam.boundaryJumpDbfs > -48) throw new Error(`${kind}: discontinuity at decoded loop boundary`);
  report.tracks.push(track);
  console.log(`${kind} candidate: ${candidate}; ${m.decodedSeconds.toFixed(6)}s decoded, ${m.integratedLufs} LUFS, ${m.rmsDbfs} dBFS RMS, ${m.truePeakDbfs} dBFS true peak, boundary ${m.seam.boundaryJumpDbfs} dBFS`);
}

// Validate every candidate and guard against concurrent source/final changes
// before the first replacement. Each final replaces atomically via rename.
for (const [file, hash] of Object.entries(report.sources))
  if (sha256(file) !== hash) throw new Error(`Raw source changed during mastering: ${file}`);
const previous = install && target !== "all" ? JSON.parse(readFileSync("content/audio-mastering-report.json", "utf8")) : null;
const unchangedTracks = previous?.tracks.filter((track) => !selected.includes(track.kind)) ?? [];
if (previous) {
  for (const track of unchangedTracks)
    if (sha256(track.path) !== track.measurements.sha256) throw new Error(`Unselected master changed: ${track.path}`);
  for (const retained of previous.retained)
    if (sha256(retained.path) !== retained.sha256) throw new Error(`Retained audio changed: ${retained.path}`);
  for (const [file, hash] of Object.entries(previous.sources))
    if (sha256(file) !== hash) throw new Error(`Previously recorded raw changed: ${file}`);
}
if (install) {
  for (const track of report.tracks)
    if ((existsSync(track.final) ? sha256(track.final) : null) !== track.beforeHash) throw new Error(`Concurrent master edit: ${track.final}`);
  for (const track of report.tracks) {
    const staged = `${track.candidate}.install.mp3`;
    copyFileSync(track.candidate, staged, constants.COPYFILE_EXCL);
    renameSync(staged, track.final);
  }
  report.installed = true;
}
const reportFile = `${scratch}/report.json`;
writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
if (install) {
  // Keep a compact durable report; full spectral bins/commands remain in scratch.
  const retained = previous?.retained ?? ["ambience/distant-birds-long", "sfx/fingertip-wood-v2-mix", "sfx/uncover-mix", "sfx/journal-open"].map((name) => compact(analyzeAudio(`public/assets/audio/${name}.mp3`, { spectral: !name.startsWith("sfx/") })));
  const provenance = ["forest-acoustic-v2", "dry-leaves-v2-a", "dry-leaves-v2-b", "fingertip-wood-v2", "canopy-rain-v2", "canopy-rain-v2-b", "canopy-rain-v2-c", "canopy-rain-v2-d", "canopy-rain-v2-e"].map((id) => JSON.parse(readFileSync(`content/audio/${id}.source.json`, "utf8")));
  writeFileSync("content/audio-mastering-report.json", `${JSON.stringify({
    schemaVersion: 3, ffmpeg: report.ffmpeg, physicalAudition: false, userAccepted: false, limits: report.limits,
    reproduce: "npm run audio:master", sources: { ...previous?.sources, ...report.sources }, provenance,
    tracks: [...unchangedTracks, ...report.tracks.map((track) => ({ kind: track.kind, path: track.final, processing: track.processing, arrangement: track.arrangement, loop: track.loop, measurements: { ...compact(track.measurements), path: track.final } }))],
    retained, sceneWeather: { forest: "clear", stump: "overcast", leaves: "overcast", roots: "rain", bark: "rain" },
  }, null, 2)}\n`);
}
console.log(`${install ? "Installed" : "Preview only"}; report: ${reportFile}`);
