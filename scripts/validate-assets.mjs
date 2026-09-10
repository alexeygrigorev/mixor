import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "content/assets.manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];
const photos = manifest.assets.filter((asset) => asset.kind === "reference_photo");
const publishedPhotoIds = new Set();
const checksums = new Set();

for (const asset of manifest.assets) {
  if (!asset.id || !asset.path || !asset.status) errors.push(`${asset.id || "unknown"}: missing id/path/status`);
  if (asset.path && !fs.existsSync(path.join(root, asset.path))) errors.push(`${asset.id}: missing file ${asset.path}`);
  if (publishedPhotoIds.has(asset.id)) errors.push(`${asset.id}: duplicate asset id`);
  publishedPhotoIds.add(asset.id);
  const serialized = JSON.stringify(asset);
  if (/example\.invalid|REPLACE_WITH|placeholder/i.test(serialized)) errors.push(`${asset.id}: placeholder metadata`);
  if (asset.kind === "reference_photo") {
    if (!asset.source?.pageUrl || !asset.rights?.author || !asset.rights?.licenseId || !asset.rights?.licenseUrl) {
      errors.push(`${asset.id}: photo needs source page, author and license`);
    }
    if (asset.science?.determinationLevel === "unreviewed") errors.push(`${asset.id}: unreviewed photo cannot ship`);
    if (asset.focalPoint && (asset.focalPoint.x < 0 || asset.focalPoint.x > 1 || asset.focalPoint.y < 0 || asset.focalPoint.y > 1)) errors.push(`${asset.id}: focal point out of range`);
  }
  if (asset.checksum) {
    if (fs.existsSync(path.join(root, asset.path)) && createHash("sha256").update(fs.readFileSync(path.join(root, asset.path))).digest("hex") !== asset.checksum) errors.push(`${asset.id}: checksum mismatch`);
    if (checksums.has(asset.checksum)) errors.push(`${asset.id}: duplicate checksum`);
    checksums.add(asset.checksum);
  }
}

if (photos.length < 20) errors.push(`demo needs at least 20 unique reference photos, found ${photos.length}`);
if (new Set(photos.map((asset) => asset.taxonId)).size < 8) errors.push("demo needs at least 8 prepared taxa");
const art = JSON.parse(fs.readFileSync(path.join(root, "content/generated-art.manifest.json"), "utf8"));
for (const asset of art.assets) {
  if (!asset.prompt || !fs.existsSync(path.join(root, asset.runtimePath)) || !fs.existsSync(path.join(root, asset.sourcePath))) errors.push(`${asset.id}: generated artwork missing prompt/source/runtime file`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`assets valid: ${photos.length} reference photos / 8 taxa, ${art.assets.length} generated plates, ${manifest.assets.length - photos.length} local audio assets`);
