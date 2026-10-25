import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { EnvHttpProxyAgent } from "undici";
const dispatcher =
  process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    ? new EnvHttpProxyAgent()
    : undefined;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await fs.readFile(new URL("./asset-manifest.json", import.meta.url), "utf8"),
);
const sha = (data) => createHash("sha256").update(data).digest("hex");
for (let i = 0; i < manifest.length; i += 4) {
  const results = await Promise.allSettled(
    manifest.slice(i, i + 4).map(async (asset) => {
      const destination = path.join(root, asset.path);
      try {
        if (sha(await fs.readFile(destination)) === asset.sha256) return;
      } catch {}
      const response = await fetch(asset.url, {
        signal: AbortSignal.timeout(60000),
        dispatcher,
      });
      if (!response.ok)
        throw Error(`Asset HTTP ${response.status}: ${asset.url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (sha(bytes) !== asset.sha256)
        throw Error(
          `Source changed: ${asset.url}. Review the source before updating its checksum.`,
        );
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, bytes);
      console.log("Downloaded and verified", asset.path);
    }),
  );
  for (const result of results)
    if (result.status === "rejected") throw result.reason;
}
console.log("All public-source images verified.");

await dispatcher?.close();
