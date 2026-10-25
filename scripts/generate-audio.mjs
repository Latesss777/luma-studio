import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "flite=textfile=scripts/audio-source.txt:voice=slt",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "4",
    "frontend/public/assets/alice-audio.mp3",
  ],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0)
  throw Error("FFmpeg with the flite filter is required.");
const probe = spawnSync(
  "ffprobe",
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size",
    "-of",
    "json",
    "frontend/public/assets/alice-audio.mp3",
  ],
  { cwd: root, encoding: "utf8" },
);
if (probe.status !== 0) throw Error("ffprobe failed");
await fs.writeFile(
  path.join(root, "frontend/src/data/audio-meta.json"),
  probe.stdout,
);
console.log("Generated public-domain reading, Flite SLT.");
