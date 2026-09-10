#!/usr/bin/env node
// Generates the small local Mixor audio pack with the ElevenLabs Sound Effects
// and Music APIs. The API key is supplied by the caller, never committed.
//
// Usage from this repository:
//   node --env-file=../red-stamp/.env scripts/generate-mixor-audio.mjs all

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audioRoot = path.join(root, "public/assets/audio");
const musicDir = path.join(audioRoot, "music");
const ambienceDir = path.join(audioRoot, "ambience");
const sfxDir = path.join(audioRoot, "sfx");

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error(
    "Missing ELEVENLABS_API_KEY. Use --env-file=../red-stamp/.env.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const target = args.find((arg) => !arg.startsWith("--")) || "all";

const MUSIC = [
  {
    file: "forest-stillness.mp3",
    prompt:
      "Three minutes of extremely quiet, almost imperceptible forest exploration ambient underscore. A sparse warm low sustained harmonic bed, diffuse felt-soft timbre and very slow organically changing harmony across the whole piece. No identifiable melody, no repeating tune, no pulse, no beat, no bright instruments, no piano, no plucks, no mallets, no chimes, no bells, no vocals. Restrained even dynamics without swells or a climax. No nature recordings, no rain, no water, no flowing or bubbling sounds. Barely present background music, leaving lots of auditory space for distant birds. Similar soft energy and tonal center at start and end for a seamless loop.",
    lengthMs: 180000,
  },
  {
    file: "forest-understory.mp3",
    prompt:
      "Extremely understated ambient underscore for quiet forest exploration. Almost still, warm low sustained airy tones, soft diffuse texture, very slow harmonic change with long silences, no recognizable melody or theme, no mallets, no bells, no piano, no plucks, no percussion, no beat, no vocals, no dramatic swells, no bright high notes. Background should disappear behind natural birds and wind. Intimate soft even dynamics, seamless-friendly beginning and end.",
    lengthMs: 90000,
  },
];

const AMBIENCE = [
  ...["canopy", "beech", "oak", "shelter"].map((setting, index) => ({
    file: `dry-wind-${index + 1}.mp3`,
    text: `Extremely quiet dry woodland air, ${setting} leaves barely moving in a gentle distant breeze. Natural field recording, slow irregular soft leaf rustles and long nearly still passages. Absolutely no water, no stream, no river, no rain, no droplets, no bubbling, no splashing, no birds, no music, no voices, no strong wind gusts. Very soft diffuse even texture, seamless loop.`,
    duration: 30,
    loop: true,
  })),
  ...[
    "one distant blackbird phrase",
    "a few faraway soft songbird calls",
    "a distant woodland robin, sparse short calls",
  ].map((detail, index) => ({
    file: `distant-birds-${index + 1}.mp3`,
    text: `Very quiet distant woodland birds: ${detail}, with long quiet intervals, gentle natural outdoor recording. Far away and soft, no piercing close chirps. Almost silent dry forest air behind. Absolutely no water, no river, no stream, no drops, no rain, no bubbling, no music, no wind gusts, no people.`,
    duration: 30,
    loop: true,
  })),
  {
    file: "woodland-air.mp3",
    text: "Continuous peaceful real woodland ambience: gentle wind softly passing through a leafy canopy, delicate rustling leaves and distant forest air, a little quiet insect texture far away, very subtle occasional leaf movement on the forest floor. Soft steady natural recording, no music, no voices, no loud gusts, no dramatic sounds, no close animals, no silence at ends. Seamless loop.",
    duration: 30,
  },
  {
    file: "birds-canopy.mp3",
    text: "Quiet distant European woodland birds in a peaceful forest canopy, a few soft natural songbird chirps and short varied phrases separated by long quiet pauses, spatially distant birds, very soft air behind them, no crow calls, no loud squawks, no close high-pitched piercing calls, no music, no people. Understated field recording for a gentle seamless nature ambience loop.",
    duration: 30,
  },
  {
    file: "forest-floor.mp3",
    text: "Subtle quiet forest floor ambience for an educational nature game: soft distant air, occasional delicate leaves, one or two very gentle drops, wide and calm, no birds, no insects close to the microphone, no voices, no music, no sudden loud sounds, designed to loop",
    duration: 30,
  },
];

const SFX = [
  {
    file: "uncover.mp3",
    text: "One short natural foley of gently lifting loose dry tree bark from leaf litter. Soft woody rub and delicate papery leaf rustle, then stillness. Audible tactile detail, rounded gentle attack. No click, crack, snap, thump, electronic sound, music, chime, water, buzz, hum or voices. Clean isolated recording. Start the movement immediately, no long lead-in, dry and intimate.",
    duration: 1.2,
  },
  {
    file: "ui-press-soft.mp3",
    text: "One barely audible very soft fingertip brush on a felt-covered field notebook, a tiny muffled papery touch, extremely understated, short rounded transient with no sharp attack, no click, no snap, no tone, no musical note, no reverb.",
    duration: 0.5,
  },
  {
    file: "ui-press.mp3",
    text: "A tiny soft tactile click of a wooden field notebook tool being pressed, warm and delicate, very short, no electronic beep",
    duration: 0.5,
  },
  {
    file: "journal-open.mp3",
    text: "A gentle close-up paper journal opening on a wooden naturalist desk, one soft page movement, quiet and warm, no loud rustle",
    duration: 1.1,
  },
  {
    file: "lens-open.mp3",
    text: "A small glass magnifying lens being picked up and adjusted, delicate glass and wood foley, calm, short, no harsh click",
    duration: 0.8,
  },
  {
    file: "discovery.mp3",
    text: "A small warm discovery accent for a child-friendly nature exploration game, soft glass harmonics and one gentle wooden tone, curious and reassuring, not a fanfare, no sharp high frequencies",
    duration: 1.3,
  },
  {
    file: "save-local.mp3",
    text: "A quiet reassuring confirmation sound for a field note saved locally, soft paper tap and subtle warm tone, neutral and calm, not a success jingle",
    duration: 0.9,
  },
];

async function requestAudio(url, body, attempt = 0) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 5000 * 2 ** attempt));
      return requestAudio(url, body, attempt + 1);
    }
    const detail = await response.text().catch(() => "");
    throw new Error(
      `${response.status} ${response.statusText}: ${detail.slice(0, 500)}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateMusic(item) {
  const dest = path.join(musicDir, item.file);
  if (fs.existsSync(dest) && !force)
    return console.log(`skip music/${item.file}`);
  console.log(`gen  music/${item.file}`);
  const audio = await requestAudio("https://api.elevenlabs.io/v1/music", {
    prompt: item.prompt,
    music_length_ms: item.lengthMs,
    force_instrumental: true,
  });
  fs.writeFileSync(dest, audio);
}

async function generateSound(item, directory, kind) {
  const dest = path.join(directory, item.file);
  if (fs.existsSync(dest) && !force)
    return console.log(`skip ${kind}/${item.file}`);
  console.log(`gen  ${kind}/${item.file}`);
  const audio = await requestAudio(
    "https://api.elevenlabs.io/v1/sound-generation",
    {
      text: item.text,
      duration_seconds: item.duration,
      prompt_influence: 0.55,
      ...(item.loop ? { loop: true, model_id: "eleven_text_to_sound_v2" } : {}),
    },
  );
  fs.writeFileSync(dest, audio);
}

async function main() {
  fs.mkdirSync(musicDir, { recursive: true });
  fs.mkdirSync(ambienceDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });

  if (target === "music" || target === "all") {
    for (const item of MUSIC) await generateMusic(item);
  }
  if (target === "ambience" || target === "all") {
    for (const item of AMBIENCE)
      await generateSound(item, ambienceDir, "ambience");
  }
  if (target === "sfx" || target === "all") {
    for (const item of SFX) await generateSound(item, sfxDir, "sfx");
  }
  console.log("Mixor audio generation complete.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
