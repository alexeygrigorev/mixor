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
  "/assets/art/search-wetland-v1.webp",
];
for (const entry of readdirSync("dist/assets", { withFileTypes: true })) {
  if (entry.isFile() && /\.(js|css|woff2)$/.test(entry.name))
    files.push("/assets/" + entry.name);
}
for (const photo of photoManifest.assets.filter(
  (a) => a.kind === "reference_photo",
))
  files.push("/" + photo.path.replace(/^public\//, ""));
const artwork = JSON.parse(
  readFileSync("content/generated-art.manifest.json", "utf8"),
);
files.push(
  ...artwork.assets.map(
    (asset) => "/" + asset.runtimePath.replace(/^public\//, ""),
  ),
);
files.push(
  ...[
    "music/forest-acoustic-v2-long",
    "ambience/dry-leaves-v2-long",
    "ambience/distant-birds-long",
    "ambience/canopy-rain-v2-loop",
    "sfx/leaf-friction-v3-mix",
    "sfx/uncover-mix",
    "sfx/journal-open",
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
