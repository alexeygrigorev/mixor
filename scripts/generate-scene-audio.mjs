#!/usr/bin/env node
// Bounded feedback replacement batch. Never overwrites a raw generation.
// node --env-file=../red-stamp/.env scripts/generate-scene-audio.mjs feedback-v2
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requests = [
  {
    id: "forest-acoustic-v2", kind: "music", seconds: 180,
    prompt: "Three minutes of sparse, gentle acoustic chamber music for quiet woodland exploration. One real unamplified nylon-string guitar, individual softly finger-plucked mid-register notes with short natural decays. A few unhurried notes then several seconds of genuine silence between small irregular phrases. Minimal, understated, warm and intimate, small dry room, very little reverberation. No recurring tune or rhythmic pattern. No synthesizers, pads, electronic instruments, sustained chords, organ, bowed strings, bass drone, humming, buzzing, distortion, tape noise, vinyl noise, percussion, bells, chimes, vocals or nature recordings. Each acoustic note ends completely before the next little phrase. Start and finish with a few seconds of silence. Not continuous ambient or a sustained harmonic bed.",
  },
  {
    id: "dry-leaves-v2-a", kind: "ambience", seconds: 30,
    prompt: "Natural woodland foley: a light breeze briefly moves dry beech leaves. Soft irregular papery rustles with long quiet pauses, delicate leaf detail and rounded sound. Clean usable recording level for later quiet mixing. No constant wind roar, microphone rumble, hiss bed, insects, electrical buzz, hum, tones, music, birds, water, rain, drips, people or footsteps. Dry leaves moving in air only.",
  },
  {
    id: "dry-leaves-v2-b", kind: "ambience", seconds: 30,
    prompt: "Natural dry oak woodland foley. A little air moves loose dry oak leaves and papery bark edges: soft short irregular shuffles, fine leaf texture, long quiet pauses. Clean usable recording level for quiet mixing. No insects, whine, electrical hum, buzz, drone, constant wind blast, recording hiss, music, birds, water, rain, drips, voices or footsteps. Dry airy rustles only, no repeating rhythm.",
  },
  {
    id: "fingertip-wood-v2", kind: "sfx", seconds: 0.65,
    prompt: "One gentle bare fingertip touches unfinished dry wood, sliding a few millimeters across papery grain. Natural close dry foley: tiny muted contact and soft skin friction, rounded onset, quick decay. Starts immediately, usable recording level for quiet mixing. No electronic click, beep, pitched tone, ring, chime, string, music, metallic resonance, thud, buzz, hum or reverb. Not a digital interface sound.",
  },
  {
    id: "canopy-rain-v2", kind: "ambience", seconds: 30, loop: true,
    prompt: "Gentle rain on a leafy woodland canopy. Soft scattered droplets touch broad leaves and damp leaf litter, fine irregular patter and quiet diffuse air. Light rain, clean usable recording level for quiet mixing. No thunder, stream, river, pouring water, bubbling, large splashes, gutters, roof drumming, insects, tonal hiss, electrical hum, buzz, music, drones, birds or voices. Soft leaf rain, seamless loop.",
  },
  {
    id: "canopy-rain-v2-b", kind: "ambience", seconds: 30,
    prompt: "Gentle woodland rain on broad beech leaves, heard from beneath a low canopy. Fine irregular soft taps on living leaves with small quieter intervals. Natural diffuse outdoor perspective, clean recording for quiet mixing. Only light leaf rain. No insects, cicadas, birds, tones, hum, buzz, electronic noise, music, voices, thunder, wind roar, streams, rivers, running water, gutters, puddle splashes or roof drumming.",
  },
  {
    id: "canopy-rain-v2-c", kind: "ambience", seconds: 30,
    prompt: "Soft light rain touching oak leaves and damp fallen leaves in a sheltered forest. Scattered delicate papery patters vary gently and irregularly; quiet natural outdoor detail. Clean recording for subtle mixing. Only leaf rain, no other water sounds. No insects, cicadas, birds, tones, hum, buzz, electronic noise, music, voices, thunder, strong wind, streams, rivers, flowing water, gutters, large droplets or splashes.",
  },
  {
    id: "canopy-rain-v2-d", kind: "ambience", seconds: 30,
    prompt: "Light woodland rain under a birch canopy: very soft scattered taps on small leaves, fine diffuse patter slightly farther away, gently uneven density and quiet gaps. Natural clean outdoor recording for quiet mixing. Leaf rain only. No insects, cicadas, birds, tones, hum, buzz, electronic noise, music, voices, thunder, wind roar, streams, rivers, running water, gutters, puddles, heavy drips or roof drumming.",
  },
  {
    id: "canopy-rain-v2-e", kind: "ambience", seconds: 30,
    prompt: "Gentle rain landing on fern fronds and low woodland leaves. Delicate irregular fine patter with softly changing density, small quiet lulls, rounded tiny leaf contacts. Natural clean recording for subtle mixing. Only light leaf rain. No insects, cicadas, birds, tones, hum, buzz, electronic noise, music, voices, thunder, gusts, streams, rivers, flowing water, gutters, puddle splashes, loud drips or roof drumming.",
  },
];

const selected = process.argv[2];
// The rejected wood contact remains available by exact legacy ID only.
// Active generic cues are derived locally from the preserved uncover raw.
const batch = selected === "feedback-v2" ? requests.filter((r) => r.id !== "fingertip-wood-v2")
  : selected === "rain-extension-v2" ? requests.filter((r) => /^canopy-rain-v2-[b-e]$/.test(r.id))
  : requests.filter((r) => r.id === selected);
if (!batch.length || process.argv.length !== 3) throw new Error("Choose feedback-v2, rain-extension-v2 or one exact asset ID; no force/overwrite option.");
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("ELEVENLABS_API_KEY is required for asset generation only.");
mkdirSync(path.join(root, "content/audio"), { recursive: true });
for (const item of batch) {
  if (item.kind !== "music" && item.prompt.length > 450) throw new Error(`SFX prompt exceeds 450 characters: ${item.id}`);
  const relativePath = `public/assets/audio/${item.kind}/${item.id}.mp3`;
  const destination = path.join(root, relativePath);
  const receipt = path.join(root, `content/audio/${item.id}.source.json`);
  if (existsSync(destination)) {
    if (!existsSync(receipt)) throw new Error(`Existing raw has no receipt: ${item.id}`);
    console.log(`preserved ${item.id}`);
    continue;
  }
  const endpoint = item.kind === "music" ? "https://api.elevenlabs.io/v1/music" : "https://api.elevenlabs.io/v1/sound-generation";
  const body = item.kind === "music"
    ? { prompt: item.prompt, music_length_ms: item.seconds * 1000, force_instrumental: true, model_id: "music_v2" }
    : { text: item.prompt, duration_seconds: item.seconds, prompt_influence: 0.65, model_id: "eleven_text_to_sound_v2", loop: item.loop ?? false };
  console.log(`request ${item.id} (${item.seconds}s)`);
  // No automatic paid retries after ambiguous timeouts or server responses.
  const response = await fetch(`${endpoint}?output_format=mp3_44100_128`, {
    method: "POST", headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify(body), signal: AbortSignal.timeout(600000),
  });
  if (!response.ok) {
    const detail = (await response.text()).replaceAll(key, "[redacted]").slice(0, 700);
    throw new Error(`${item.id}: ElevenLabs HTTP ${response.status}; no automatic retry. ${detail}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`${item.id}: response too small for audio`);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, bytes, { flag: "wx" });
  writeFileSync(receipt, `${JSON.stringify({
    schemaVersion: 1, id: item.id, kind: item.kind, isGenerated: true,
    sourcePath: relativePath, provider: "ElevenLabs", endpoint, request: body,
    outputFormat: "mp3_44100_128", requestedAt: new Date().toISOString(),
    bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
    physicalAudition: false, userAccepted: false,
    rights: { licenseReview: "Verify the active ElevenLabs account terms before public distribution; no exclusive-rights claim." },
  }, null, 2)}\n`, { flag: "wx" });
  console.log(`saved ${item.id}; ${bytes.length} bytes; receipt ${path.relative(root, receipt)}`);
}
