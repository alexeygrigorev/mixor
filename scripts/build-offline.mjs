import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
const photoManifest = JSON.parse(
  readFileSync("content/assets.manifest.json", "utf8"),
);
const files = [
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];
for (const entry of readdirSync("dist/assets", { withFileTypes: true })) {
  if (entry.isFile() && /\.(js|css|woff2)$/.test(entry.name))
    files.push("/assets/" + entry.name);
}
for (const photo of photoManifest.assets.filter(
  (a) => a.kind === "reference_photo",
))
  files.push("/" + photo.path.replace(/^public\//, ""));
files.push(
  ...["forest-world", "organisms-v2", "life-stages-v2", "arcyria-network"].map(
    (name) => `/assets/art/${name}.webp`,
  ),
);
files.push(
  ...[
    "music/forest-understory-mix",
    "ambience/woodland-air-mix",
    "ambience/birds-canopy-mix",
    "sfx/ui-press-soft-mix",
    "sfx/journal-open",
    "sfx/lens-open",
    "sfx/discovery",
    "sfx/save-local",
  ].map((name) => `/assets/audio/${name}.mp3`),
);
const unique = [...new Set(files)];
const hash = createHash("sha256");
for (const file of unique) hash.update(readFileSync(join("dist", file)));
const cacheName = "mixor-public-" + hash.digest("hex").slice(0, 16);
const worker = readFileSync("public/sw.js", "utf8")
  .replace("/* MIXOR_PRECACHE */ []", JSON.stringify(unique))
  .replace('/* MIXOR_CACHE */ "mixor-public-v2"', JSON.stringify(cacheName));
writeFileSync("dist/sw.js", worker);
console.log(`Offline shell: ${unique.length} public assets, ${cacheName}`);
