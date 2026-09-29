import { createHash, createPublicKey, verify } from "node:crypto";
import { readPluginFolders } from "./plugin-catalog.mjs";

const prefix = Buffer.from("302a300506032b6570032100", "hex");
for (const { metadata, versions } of await readPluginFolders()) {
  const key = createPublicKey({ key: Buffer.concat([prefix, Buffer.from(metadata.publicKey, "base64")]), format: "der", type: "spki" });
  for (const release of versions) {
    for (const asset of release.assets) {
      const label = `${metadata.id}@${release.version}/${asset.abi}`;
      const response = await fetch(asset.url, { signal: AbortSignal.timeout(90_000) });
      if (!response.ok || !response.body) throw new Error(`${label}: download failed (HTTP ${response.status}); restore the fixed release asset before merging`);
      const chunks = [];
      let size = 0;
      const hash = createHash("sha256");
      for await (const chunk of response.body) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > asset.size || size > 250 * 1024 * 1024) throw new Error(`${label}: asset is larger than declared`);
        chunks.push(bytes);
        hash.update(bytes);
      }
      if (size !== asset.size) throw new Error(`${label}: size mismatch (declared ${asset.size}, actual ${size})`);
      if (hash.digest("hex") !== asset.sha256) throw new Error(`${label}: SHA-256 mismatch`);
      if (!verify(null, Buffer.concat(chunks), key, Buffer.from(asset.signature, "base64"))) throw new Error(`${label}: Ed25519 signature mismatch`);
      console.log(`Verified ${label} (${size} bytes)`);
    }
  }
}
