import { readdir, readFile } from "node:fs/promises";

const fail = (message) => { throw new Error(message); };
const isBase64Bytes = (value, bytes) => {
  try { return typeof value === "string" && Buffer.from(value, "base64").length === bytes; }
  catch { return false; }
};
const catalogFiles = (await readdir("catalog")).filter((name) => name.endsWith(".json")).sort();
const catalog = await Promise.all(catalogFiles.map(async (file) => JSON.parse(await readFile(`catalog/${file}`, "utf8"))));
const index = JSON.parse(await readFile("plugins.json", "utf8"));

if (index.schemaVersion !== 1) fail("plugins.json schemaVersion must be 1");
if (JSON.stringify(index.plugins) !== JSON.stringify(catalog)) fail("plugins.json is stale; run npm run build:index");

const ids = new Set();
for (const plugin of catalog) {
  if (!/^[a-zA-Z0-9._-]{3,100}$/.test(plugin.id ?? "")) fail(`Invalid plugin id: ${plugin.id}`);
  if (ids.has(plugin.id)) fail(`Duplicate plugin id: ${plugin.id}`);
  ids.add(plugin.id);
  if (!plugin.name || !plugin.author || !plugin.description) fail(`${plugin.id}: name, author and description are required`);
  if (!/^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$/.test(plugin.version ?? "")) fail(`${plugin.id}: invalid version`);
  if (!["ui", "data_source", "subtitle", "system", "player"].includes(plugin.kind)) fail(`${plugin.id}: invalid kind`);
  if (!isBase64Bytes(plugin.publicKey, 32)) fail(`${plugin.id}: publicKey must decode to 32 bytes`);
  if (!Array.isArray(plugin.permissions) || !Array.isArray(plugin.assets) || plugin.assets.length === 0) fail(`${plugin.id}: permissions/assets are required arrays`);
  for (const asset of plugin.assets) {
    let url;
    try { url = new URL(asset.url); } catch { fail(`${plugin.id}: invalid asset URL`); }
    if (url.protocol !== "https:") fail(`${plugin.id}: asset URL must use HTTPS`);
    if (!Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > 250 * 1024 * 1024) fail(`${plugin.id}: invalid asset size`);
    if (!/^[0-9a-f]{64}$/.test(asset.sha256 ?? "")) fail(`${plugin.id}: invalid SHA-256`);
    if (!isBase64Bytes(asset.signature, 64)) fail(`${plugin.id}: signature must decode to 64 bytes`);
  }
}
console.log(`Validated ${catalog.length} plugin(s) from ${catalogFiles.length} catalog file(s).`);
