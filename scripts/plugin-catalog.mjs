import { readdir, readFile } from "node:fs/promises";

export const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function comparePrerelease(left, right) {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  const a = left.split(".");
  const b = right.split(".");
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    if (a[index] === undefined) return -1;
    if (b[index] === undefined) return 1;
    if (a[index] === b[index]) continue;
    const aNumber = /^\d+$/.test(a[index]);
    const bNumber = /^\d+$/.test(b[index]);
    if (aNumber && bNumber) return Number(a[index]) - Number(b[index]);
    if (aNumber !== bNumber) return aNumber ? -1 : 1;
    return a[index].localeCompare(b[index]);
  }
  return 0;
}

function compareAscending(left, right) {
  const parse = (value) => {
    const [withoutBuild] = value.split("+");
    const [core, prerelease = ""] = withoutBuild.split("-");
    return { core: core.split(".").map(Number), prerelease };
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index++) {
    if (a.core[index] !== b.core[index]) return a.core[index] - b.core[index];
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

export const versionCompareNewestFirst = (left, right) => compareAscending(right, left);

export async function readPluginFolders() {
  const entries = await readdir("plugins", { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory() && entry.name !== "plugin-template").map((entry) => entry.name).sort();
  return Promise.all(folders.map(async (folder) => {
    const metadata = JSON.parse(await readFile(`plugins/${folder}/plugin.json`, "utf8"));
    const versionFiles = (await readdir(`plugins/${folder}/versions`))
      .filter((name) => name.endsWith(".json"))
      .sort();
    const versions = await Promise.all(versionFiles.map(async (file) => ({
      file,
      ...JSON.parse(await readFile(`plugins/${folder}/versions/${file}`, "utf8")),
    })));
    versions.sort((a, b) => versionCompareNewestFirst(a.version, b.version));
    return { folder, metadata, versions };
  }));
}

export function mergedVersion(metadata, version) {
  const { file: _file, ...release } = version;
  return { ...metadata, ...release };
}

export function renderPluginReadme(plugin) {
  const rows = plugin.versions.map((release) => {
    const assets = release.assets.map((asset) => `[${asset.abi}](${asset.url})`).join(" · ");
    return `| ${release.version} | ${release.releasedAt ?? "—"} | ${assets} |`;
  });
  return `# ${plugin.metadata.name}\n\n${plugin.metadata.description}\n\n- 插件 ID：\`${plugin.metadata.id}\`\n- 作者：${plugin.metadata.author}\n- 项目主页：${plugin.metadata.homepage}\n- 源码：${plugin.metadata.source}\n\n## 所有版本（新 → 旧）\n\n| 版本 | 发布日期 | 下载 |\n| --- | --- | --- |\n${rows.join("\n")}\n`;
}
