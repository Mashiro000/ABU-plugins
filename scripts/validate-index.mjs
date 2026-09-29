import { readFile } from "node:fs/promises";
import { mergedVersion, readPluginFolders, renderPluginReadme, versionPattern } from "./plugin-catalog.mjs";

const fail = (message) => { throw new Error(message); };
const isBase64Bytes = (value, bytes) => {
  try { return typeof value === "string" && Buffer.from(value, "base64").length === bytes; }
  catch { return false; }
};
const folders = await readPluginFolders();
const index = JSON.parse(await readFile("plugins.json", "utf8"));
const ids = new Set();
const expectedLatest = [];

for (const { folder, metadata, versions } of folders) {
  if (folder !== metadata.id) fail(`${folder}: folder name must equal plugin id ${metadata.id}`);
  if (!/^[a-zA-Z0-9._-]{3,100}$/.test(metadata.id ?? "")) fail(`${folder}: invalid plugin id`);
  if (ids.has(metadata.id)) fail(`Duplicate plugin id: ${metadata.id}`);
  ids.add(metadata.id);
  if (!metadata.name || !metadata.author || !metadata.description || !metadata.homepage || !metadata.source) fail(`${metadata.id}: incomplete plugin metadata`);
  if (!["ui", "data_source", "subtitle", "system", "player"].includes(metadata.kind)) fail(`${metadata.id}: invalid kind`);
  if (!isBase64Bytes(metadata.publicKey, 32)) fail(`${metadata.id}: publicKey must decode to 32 bytes`);
  if (!Array.isArray(metadata.permissions)) fail(`${metadata.id}: permissions must be an array`);
  if (versions.length === 0) fail(`${metadata.id}: at least one version is required`);

  const versionNames = new Set();
  for (const release of versions) {
    if (!versionPattern.test(release.version ?? "")) fail(`${metadata.id}: invalid version ${release.version}`);
    if (release.file !== `${release.version}.json`) fail(`${metadata.id}: ${release.file} must match version ${release.version}`);
    if (versionNames.has(release.version)) fail(`${metadata.id}: duplicate version ${release.version}`);
    versionNames.add(release.version);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(release.releasedAt ?? "")) fail(`${metadata.id}@${release.version}: releasedAt must be YYYY-MM-DD`);
    if (!Array.isArray(release.assets) || release.assets.length === 0) fail(`${metadata.id}@${release.version}: assets are required`);
    for (const asset of release.assets) {
      let url;
      try { url = new URL(asset.url); } catch { fail(`${metadata.id}@${release.version}: invalid asset URL`); }
      if (url.protocol !== "https:") fail(`${metadata.id}@${release.version}: asset URL must use HTTPS`);
      if (!Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > 250 * 1024 * 1024) fail(`${metadata.id}@${release.version}: invalid asset size`);
      if (!/^[0-9a-f]{64}$/.test(asset.sha256 ?? "")) fail(`${metadata.id}@${release.version}: invalid SHA-256`);
      if (!isBase64Bytes(asset.signature, 64)) fail(`${metadata.id}@${release.version}: signature must decode to 64 bytes`);
    }
  }
  const readme = await readFile(`plugins/${folder}/README.md`, "utf8");
  if (readme !== renderPluginReadme({ folder, metadata, versions })) fail(`${metadata.id}: README.md is stale; run npm run build:index`);
  expectedLatest.push(mergedVersion(metadata, versions[0]));
}

if (index.schemaVersion !== 1) fail("plugins.json schemaVersion must be 1");
if (JSON.stringify(index.plugins) !== JSON.stringify(expectedLatest)) fail("plugins.json is stale; run npm run build:index");
console.log(`Validated ${folders.length} plugin folder(s) and ${folders.reduce((sum, item) => sum + item.versions.length, 0)} version(s).`);
