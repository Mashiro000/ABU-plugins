import { writeFile } from "node:fs/promises";
import { mergedVersion, readPluginFolders, renderPluginReadme } from "./plugin-catalog.mjs";

const folders = await readPluginFolders();
const latestPlugins = [];
for (const plugin of folders) {
  if (plugin.versions.length === 0) throw new Error(`${plugin.folder}: no versions found`);
  latestPlugins.push(mergedVersion(plugin.metadata, plugin.versions[0]));

  await writeFile(`plugins/${plugin.folder}/README.md`, renderPluginReadme(plugin));
}

await writeFile("plugins.json", `${JSON.stringify({ schemaVersion: 1, plugins: latestPlugins }, null, 2)}\n`);
console.log(`Generated latest index and history pages for ${folders.length} plugin(s).`);
