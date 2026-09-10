#!/usr/bin/env node
// Offline measurements, not an audition or semantic identification of sounds.
// node scripts/analyze-audio.mjs --out tmp/audio-feedback/before.json FILE...
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { maxBuffer: 256 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0)
    throw new Error(`${command}: ${result.error?.message ?? result.stderr?.toString().slice(-3000)}`);
  return result;
}
export const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
export const db = (power) => 10 * Math.log10(Math.max(power, 1e-16));
const round = (value) => Math.round(value * 1000) / 1000;
const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
};
export function probe(file) {
  return JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { encoding: "utf8" }).stdout);
}
export function decode(file, rate = 44100, channels = 2) {
  const mono = channels === 1 ? ["-af", "aformat=channel_layouts=stereo,pan=mono|c0=0.5*c0+0.5*c1"] : [];
  const bytes = run("ffmpeg", ["-v", "error", "-i", file, "-map", "0:a:0", ...mono, "-ar", String(rate), "-ac", String(channels), "-f", "f32le", "-acodec", "pcm_f32le", "pipe:1"]).stdout;
  // Copy to an aligned buffer; f32le is explicitly decoded, independent of host endian.
  const samples = new Float32Array(bytes.length / 4);
  for (let i = 0; i < samples.length; i++) samples[i] = bytes.readFloatLE(i * 4);
  return samples;
}
export function loudness(file) {
  const log = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const summary = log.slice(log.lastIndexOf("Summary:"));
  const number = (pattern) => {
    const value = Number(summary.match(pattern)?.[1]);
    return Number.isFinite(value) ? value : null;
  };
  return {
    integratedLufs: number(/I:\s+([\d.+-]+) LUFS/),
    loudnessRangeLu: number(/LRA:\s+([\d.+-]+) LU/),
    truePeakDbfs: number(/Peak:\s+([\d.+-]+) dBFS/),
  };
}

// Iterative radix-2 FFT with Hann-windowed, energy-normalized periodograms.
function fft(real, imag) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let size = 2; size <= n; size *= 2) {
    const angle = -2 * Math.PI / size;
    const stepR = Math.cos(angle), stepI = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let wr = 1, wi = 0;
      for (let j = 0; j < size / 2; j++) {
        const a = start + j, b = a + size / 2;
        const br = wr * real[b] - wi * imag[b], bi = wr * imag[b] + wi * real[b];
        real[b] = real[a] - br; imag[b] = imag[a] - bi;
        real[a] += br; imag[a] += bi;
        const nextR = wr * stepR - wi * stepI;
        wi = wr * stepI + wi * stepR; wr = nextR;
      }
    }
  }
}

function spectrum(samples) {
  const rate = 16000, size = 16384, hop = 8000, bins = size / 2 + 1;
  const window = Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1)));
  const denominator = size * window.reduce((sum, x) => sum + x * x, 0);
  const frames = [], mean = new Float64Array(bins);
  for (let start = 0; start + size <= samples.length; start += hop) {
    const real = Float64Array.from(window, (w, i) => w * samples[start + i]);
    const imag = new Float64Array(size), powers = new Float64Array(bins);
    fft(real, imag);
    for (let k = 0; k < bins; k++) {
      powers[k] = (k === 0 || k === bins - 1 ? 1 : 2) * (real[k] ** 2 + imag[k] ** 2) / denominator;
      mean[k] += powers[k];
    }
    frames.push(powers);
  }
  if (!frames.length) throw new Error("Spectrum requires at least 1.024 seconds");
  for (let k = 0; k < bins; k++) mean[k] /= frames.length;
  const bands = [[20, 80], [80, 180], [180, 400], [400, 1000], [1000, 2500], [2500, 6500], [6500, 8000]];
  const bandMeasurements = bands.map(([low, high]) => {
    const first = Math.ceil(low * size / rate), last = Math.ceil(high * size / rate);
    const powers = frames.map((frame) => frame.slice(first, last).reduce((sum, p) => sum + p, 0));
    return { hz: [low, high], meanDbfs: round(db(powers.reduce((a, b) => a + b, 0) / powers.length)), p20Dbfs: round(db(quantile(powers, 0.2))), p90Dbfs: round(db(quantile(powers, 0.9))) };
  });
  const peaks = [];
  for (let k = 22; k < bins - 45; k++) {
    if (mean[k] <= mean[k - 1] || mean[k] <= mean[k + 1]) continue;
    const neighbors = [...mean.slice(k - 20, k - 4), ...mean.slice(k + 5, k + 21)];
    const prominence = db(mean[k] / quantile(neighbors, 0.5));
    if (prominence < 7) continue;
    const powers = frames.map((frame) => frame[k - 1] + frame[k] + frame[k + 1]);
    peaks.push({ hz: round(k * rate / size), meanDbfs: round(db(mean[k - 1] + mean[k] + mean[k + 1])), prominenceDb: round(prominence), p20Dbfs: round(db(quantile(powers, 0.2))), p90Dbfs: round(db(quantile(powers, 0.9))) });
  }
  peaks.sort((a, b) => b.p20Dbfs - a.p20Dbfs);
  return { method: "Arithmetic stereo mean at 16 kHz; Hann 16384 samples; 0.5 s hop; one-sided power/bin, not dB/Hz. Peaks are candidates, not proof of unwanted hum.", frameCount: frames.length, binWidthHz: rate / size, bands: bandMeasurements, persistentPeakCandidates: peaks.slice(0, 30), meanPowerDbfs: Array.from(mean, (p) => round(db(p))) };
}

export function analyzeAudio(file, { spectral = true } = {}) {
  const info = probe(file), pcm = decode(file), rate = 44100, channels = 2;
  let sum = 0, peak = 0, dc = 0, differencePower = 0, maxDifference = 0;
  const seconds = [], tenthSeconds = [];
  const block = rate * channels / 10;
  for (let start = 0; start < pcm.length; start += block) {
    let power = 0, count = 0;
    for (let i = start; i < Math.min(pcm.length, start + block); i++) {
      const x = pcm[i];
      if (!Number.isFinite(x)) throw new Error(`Non-finite sample in ${file}`);
      peak = Math.max(peak, Math.abs(x)); dc += x; power += x * x; count++;
      if (i >= channels) {
        const delta = x - pcm[i - channels];
        differencePower += delta * delta; maxDifference = Math.max(maxDifference, Math.abs(delta));
      }
    }
    sum += power;
    tenthSeconds.push(power / count);
  }
  for (let i = 0; i < tenthSeconds.length; i += 10) {
    const group = tenthSeconds.slice(i, i + 10);
    seconds.push(round(db(group.reduce((a, b) => a + b, 0) / group.length)));
  }
  const sampleCount = pcm.length / channels;
  const boundaryJump = Math.max(...Array.from({ length: channels }, (_, c) => Math.abs(pcm[c] - pcm[pcm.length - channels + c])));
  const edgePower = (start) => pcm.slice(start, start + rate * channels / 10).reduce((a, b) => a + b * b, 0) / (rate * channels / 10);
  return {
    path: file, sha256: sha256(file), bytes: Number(info.format.size), codec: info.streams[0].codec_name,
    sampleRate: Number(info.streams[0].sample_rate), channels: info.streams[0].channels,
    containerSeconds: Number(info.format.duration), decodedSeconds: sampleCount / rate,
    ...loudness(file), rmsDbfs: round(db(sum / pcm.length)), samplePeakDbfs: round(20 * Math.log10(Math.max(peak, 1e-8))), dcOffset: dc / pcm.length,
    level: { windowSeconds: 1, rmsDbfs: seconds, p10Dbfs: quantile(seconds, 0.1), p50Dbfs: quantile(seconds, 0.5), p90Dbfs: quantile(seconds, 0.9), fraction100msBelowMinus60Dbfs: tenthSeconds.filter((p) => db(p) < -60).length / tenthSeconds.length },
    seam: { boundaryJumpDbfs: round(20 * Math.log10(Math.max(boundaryJump, 1e-8))), adjacentDifferenceRmsDbfs: round(db(differencePower / (pcm.length - channels))), largestInternalJumpDbfs: round(20 * Math.log10(Math.max(maxDifference, 1e-8))), head100msRmsDbfs: round(db(edgePower(0))), tail100msRmsDbfs: round(db(edgePower(pcm.length - rate * channels / 10))) },
    ...(spectral ? { spectrum: spectrum(decode(file, 16000, 1)) } : {}),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), outIndex = args.indexOf("--out");
  if (outIndex < 0 || !args[outIndex + 1]) throw new Error("Usage: analyze-audio.mjs --out REPORT.json FILE...");
  const output = args.splice(outIndex, 2)[1];
  if (!args.length) throw new Error("At least one audio file is required");
  const report = { schemaVersion: 1, ffmpeg: run("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0], physicalAudition: false, files: [] };
  for (const file of args) {
    const analysis = analyzeAudio(file);
    report.files.push(analysis);
    console.log(`${file}: ${analysis.decodedSeconds.toFixed(3)}s; ${analysis.integratedLufs} LUFS; RMS ${analysis.rmsDbfs} dBFS; true peak ${analysis.truePeakDbfs} dBFS`);
    console.log(JSON.stringify({ bands: analysis.spectrum.bands, peaks: analysis.spectrum.persistentPeakCandidates.slice(0, 8), levels: { p10: analysis.level.p10Dbfs, p90: analysis.level.p90Dbfs } }));
  }
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
