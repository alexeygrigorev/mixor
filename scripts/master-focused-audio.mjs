#!/usr/bin/env node
// Local-only, deterministic mastering of the existing generated raw MP3s.
// Preview: node scripts/master-focused-audio.mjs [all|music|wind|birds]
// Install after ALL selected candidates pass: add --install.
// Exact graphs, measurements, hashes and previous masters stay in tmp/audio-feedback.
// No loudnorm, compressor, automatic makeup, adaptive noise tracking or paid APIs.
import { copyFileSync, constants, existsSync, mkdirSync, mkdtempSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAudio, decode, run, sha256 } from "./analyze-audio.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--")) ?? "all";
if (!["all", "music", "wind", "birds"].includes(target) || args.some((arg) => arg.startsWith("--") && arg !== "--install"))
  throw new Error("Usage: master-focused-audio.mjs [all|music|wind|birds] [--install]");
const install = args.includes("--install"), rate = 44100;
mkdirSync("tmp/audio-feedback", { recursive: true });
const scratch = mkdtempSync("tmp/audio-feedback/master-");
const report = {
  schemaVersion: 2, ffmpeg: run("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0],
  scratch, installed: false, physicalAudition: false,
  limits: ["Spectral and level measurements do not prove subjective comfort or absence of water-like artifacts in generated sources.", "Music is a tonal composition: suppressing its low drone does not remove every sustained musical tone.", "MP3 decoded seams are checked numerically; browser/device gapless playback and acoustic quality still require audition."],
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

// Fit one constant gain using whole-source RMS/true peak, including very quiet
// sources below the EBU absolute gate. Never chase instantaneous loudness.
function fixedGain(input, output, targetRms, peakCeiling) {
  const measured = analyzeAudio(input, { spectral: false });
  const gainDb = Math.floor(1000 * Math.min(targetRms - measured.rmsDbfs, peakCeiling - measured.truePeakDbfs)) / 1000;
  if (!Number.isFinite(gainDb) || Math.abs(gainDb) > 50) throw new Error(`Unreasonable fixed gain for ${input}`);
  filter(input, output, `volume=${gainDb}dB:precision=double`);
  return { input, targetRmsDbfs: targetRms, peakCeilingDbfs: peakCeiling, gainDb, measured };
}

function quietStart(file, duration = 2) {
  const pcm = decode(file), count = rate * 2 * duration, hop = rate;
  let bestPower = Infinity, bestStart = 0;
  for (let start = 0; start + count <= pcm.length; start += hop) {
    let power = 0;
    for (let i = start; i < start + count; i++) power += pcm[i] ** 2;
    if (power < bestPower) { bestPower = power; bestStart = start / 2; }
  }
  return bestStart;
}

function denoise(input, output, reduction) {
  // Learn a fixed spectral profile from the quietest two seconds AFTER EQ.
  // Prepending the sample lets the SAME profile process the entire real clip.
  // Tracking remains off, and gain smoothing limits musical-noise artifacts.
  const noiseStart = quietStart(input), prefix = 2 * rate, frames = frameCount(input);
  const graph = `[0:a]asplit=2[n][s];[n]atrim=start_sample=${noiseStart}:end_sample=${noiseStart + prefix},asetpts=PTS-STARTPTS[n0];[s]asetpts=PTS-STARTPTS[s0];[n0][s0]concat=n=2:v=0:a=1,asendcmd=c='0.0 afftdn sn start;2.0 afftdn sn stop',afftdn=nr=${reduction}:nf=-45:tn=0:tr=0:ad=0.9:gs=12,atrim=start_sample=${prefix}:end_sample=${prefix + frames},asetpts=PTS-STARTPTS[out]`;
  ffmpeg(["-i", input, "-filter_complex", graph, "-map", "[out]", ...waveArgs, output]);
  if (frameCount(output) !== frames) throw new Error("Denoising changed sample count");
  return { noiseProfileStartSeconds: noiseStart / rate, noiseProfileSeconds: 2, reductionDb: reduction, graph };
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

const selected = target === "all" ? ["music", "wind", "birds"] : [target];
for (const kind of selected) {
  const name = { music: "music/forest-stillness-long.mp3", wind: "ambience/dry-canopy-long.mp3", birds: "ambience/distant-birds-long.mp3" }[kind];
  const final = `public/assets/audio/${name}`, candidate = `${scratch}/${path.basename(name)}`;
  const beforeHash = existsSync(final) ? sha256(final) : null;
  if (beforeHash) copyFileSync(final, `${scratch}/before-${path.basename(name)}`, constants.COPYFILE_EXCL);
  const track = { kind, final, candidate, beforeHash, processing: [] };
  let assembled;
  if (kind === "music") {
    const input = source("public/assets/audio/music/forest-stillness.mp3");
    const eq = "highpass=f=220:p=2,highpass=f=220:p=2,equalizer=f=233.08:t=h:w=14:g=-18,equalizer=f=466.16:t=h:w=20:g=-9,lowpass=f=1100:p=2";
    const filtered = `${scratch}/music-filtered.wav`;
    filter(input, filtered, eq);
    assembled = `${scratch}/music-gain.wav`;
    track.processing.push({ source: input, eq, level: fixedGain(filtered, assembled, -43, -22) });
  } else {
    const count = kind === "wind" ? 4 : 3, files = [];
    for (let i = 0; i < count; i++) {
      const input = source(`public/assets/audio/ambience/${kind === "wind" ? "dry-wind" : "distant-birds"}-${i + 1}.mp3`);
      const stem = `${scratch}/${kind}-${i + 1}`;
      // These stationary frequencies recur across independent raw sources.
      // Narrow cuts spare adjacent rustle/bird energy; HP removes low hum.
      const notches = (kind === "wind" ? [200, 400, 600, 1000, 1400, 1800, 1950, 2400, 2450, 3500, 4350, 4400, 5800] : [1400, 1800, 1950, 2450, 3500, 4350, 4400, 5800])
        .map((hz) => `equalizer=f=${hz}:t=h:w=12:g=-18`).join(",");
      const eq = kind === "wind"
        ? `volume=40dB:precision=double,highpass=f=320:p=2,highpass=f=320:p=2,${notches},lowpass=f=4500:p=2,lowpass=f=4500:p=2`
        : `volume=30dB:precision=double,highpass=f=1700:p=2,highpass=f=1700:p=2,${notches},lowpass=f=7200:p=2`;
      filter(input, `${stem}-eq.wav`, `atrim=end_sample=${30 * rate},${eq}`);
      const noise = denoise(`${stem}-eq.wav`, `${stem}-clean.wav`, kind === "wind" ? 10 : 12);
      const level = fixedGain(`${stem}-clean.wav`, `${stem}-gain.wav`, kind === "wind" ? -45 : -43, kind === "wind" ? -28 : -20);
      files.push(`${stem}-gain.wav`);
      track.processing.push({ source: input, eq, noise, level });
    }
    assembled = `${scratch}/${kind}-assembled.wav`;
    const lengths = kind === "wind" ? [38, 45, 41, 49] : [59, 71, 67];
    const delays = kind === "wind" ? [1, 4, 2, 6] : [5, 14, 9];
    const graph = files.map((_, i) => `[${i}:a]afade=t=in:d=${kind === "wind" ? 4 : 0.8},afade=t=out:st=${kind === "wind" ? 24 : 28}:d=${kind === "wind" ? 6 : 2},adelay=${delays[i] * rate}S:all=1,apad=whole_len=${lengths[i] * rate},atrim=end_sample=${lengths[i] * rate},asetpts=PTS-STARTPTS[s${i}]`).join(";")
      + `;${files.map((_, i) => `[s${i}]`).join("")}concat=n=${count}:v=0:a=1[out]`;
    ffmpeg([...files.flatMap((file) => ["-i", file]), "-filter_complex", graph, "-map", "[out]", ...waveArgs, assembled]);
    track.arrangement = { lengthsSeconds: lengths, delaysSeconds: delays, graph };
  }
  const loop = `${scratch}/${kind}-loop.wav`;
  track.loop = circular(assembled, loop);
  ffmpeg(["-i", loop, "-map_metadata", "-1", "-ar", "44100", "-ac", "2", "-codec:a", "libmp3lame", "-b:a", "128k", "-write_xing", "1", "-id3v2_version", "0", candidate]);
  track.measurements = analyzeAudio(candidate);
  const m = track.measurements;
  if (Math.abs(m.decodedSeconds * rate - track.loop.outputFrames) > 1) throw new Error(`${kind}: encoded duration differs from PCM loop`);
  if (m.decodedSeconds <= (kind === "music" ? 120 : 150)) throw new Error(`${kind}: duration is too short`);
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
console.log(`${install ? "Installed" : "Preview only"}; report: ${reportFile}`);
