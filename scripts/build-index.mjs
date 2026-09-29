import { readdir, readFile, writeFile } from "node:fs/promises";

const files = (await readdir("catalog"))
  .filter((name) => name.endsWith(".json"))
  .sort();
const plugins = [];
for (const file of files) {
  plugins.push(JSON.parse(await readFile(`catalog/${file}`, "utf8")));
}
await writeFile("plugins.json", `${JSON.stringify({ schemaVersion: 1, plugins }, null, 2)}\n`);
console.log(`Generated plugins.json with ${plugins.length} plugin(s).`);
