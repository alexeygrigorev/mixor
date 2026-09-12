import { copyFileSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const rawBase = process.env.BASE_URL ?? "/";
const base = rawBase === "/" ? "/" : rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const publicPath = (file) => `${base}${file.replace(/^\//, "")}`;
const distPath = (urlPath) =>
  join("dist", urlPath.startsWith(base) ? urlPath.slice(base.length) : urlPath.replace(/^\//, ""));

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
].map(publicPath);
for (const entry of readdirSync("dist/assets", { withFileTypes: true })) {
  if (entry.isFile() && /\.(js|css|woff2)$/.test(entry.name))
    files.push(publicPath("/assets/" + entry.name));
}
for (const photo of photoManifest.assets.filter(
  (a) => a.kind === "reference_photo",
))
  files.push(publicPath("/" + photo.path.replace(/^public\//, "")));
const artwork = JSON.parse(
  readFileSync("content/generated-art.manifest.json", "utf8"),
);
files.push(
  ...artwork.assets.map((asset) =>
    publicPath("/" + asset.runtimePath.replace(/^public\//, "")),
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
  ].map((name) => publicPath(`/assets/audio/${name}.mp3`)),
);
const unique = [...new Set(files)];
const hash = createHash("sha256");
for (const file of unique) hash.update(readFileSync(distPath(file)));
const cacheName = "mixor-public-" + hash.digest("hex").slice(0, 16);
const worker = readFileSync("public/sw.js", "utf8")
  .replace("/* MIXOR_PRECACHE */ []", JSON.stringify(unique))
  .replace('/* MIXOR_CACHE */ "mixor-public-v2"', JSON.stringify(cacheName))
  .replace('/* MIXOR_BASE */ "/"', JSON.stringify(base));
writeFileSync("dist/sw.js", worker);
copyFileSync("dist/index.html", "dist/404.html");
writeFileSync("dist/.nojekyll", "");
console.log(`Offline shell: ${unique.length} public assets, ${cacheName}`);

