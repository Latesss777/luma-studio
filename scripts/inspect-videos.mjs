import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const output = path.resolve(process.env.LUMA_OUTPUT || "output");
const review = path.resolve("work/video-review");
await fs.mkdir(review, { recursive: true });
const checks = [];
for (const [name, width, height] of [
  ["Desktop", 1920, 1080],
  ["Mobile", 1080, 1920],
]) {
  const file = path.join(output, `Luma_Studios_${name}.mp4`);
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
    { encoding: "utf8" },
  );
  assert.equal(probe.status, 0, probe.stderr);
  const meta = JSON.parse(probe.stdout);
  const stream = meta.streams.find((s) => s.codec_type === "video");
  assert.equal(stream.codec_name, "h264");
  assert.equal(stream.pix_fmt, "yuv420p");
  assert.equal(stream.width, width);
  assert.equal(stream.height, height);
  assert.equal(stream.r_frame_rate, "30/1");
  assert.equal(stream.avg_frame_rate, "30/1");
  const duration = Number(meta.format.duration);
  assert(duration > 60 && duration < 900);
  const bytes = await fs.readFile(file);
  let offset = 0;
  const atoms = [];
  while (offset + 8 <= bytes.length) {
    let size = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (size === 1) size = Number(bytes.readBigUInt64BE(offset + 8));
    if (size === 0) size = bytes.length - offset;
    assert(size >= 8);
    atoms.push(type);
    offset += size;
  }
  assert(
    atoms.indexOf("moov") >= 0 && atoms.indexOf("moov") < atoms.indexOf("mdat"),
    "faststart moov must precede mdat",
  );
  const decode = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", file, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  assert.equal(decode.status, 0, decode.stderr);
  assert.equal(decode.stderr.trim(), "");
  for (const [label, t] of [
    ["start", 0.15],
    ["middle", duration / 2],
    ["end", duration - 0.15],
  ]) {
    const frame = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-v",
        "error",
        "-ss",
        String(t),
        "-i",
        file,
        "-frames:v",
        "1",
        path.join(review, `${name}-${label}.png`),
      ],
      { encoding: "utf8" },
    );
    assert.equal(frame.status, 0, frame.stderr);
  }
  const timeline = JSON.parse(
    await fs.readFile(
      `work/record-${name.toLowerCase()}/timeline.json`,
      "utf8",
    ),
  );
  assert.deepEqual(timeline.errors, []);
  checks.push({
    name,
    file: path.basename(file),
    width,
    height,
    codec: stream.codec_name,
    pixelFormat: stream.pix_fmt,
    fps: stream.avg_frame_rate,
    duration,
    size: Number(meta.format.size),
    faststart: true,
    fullyDecoded: true,
    seekFramesExtracted: true,
    capturedFrames: timeline.frames,
    captureMethod: timeline.captureMethod,
    timeline: timeline.timeline,
  });
  console.log(
    name,
    `${width}x${height}`,
    duration + "s",
    "H.264 yuv420p 30fps; faststart; decode OK",
  );
}
await fs.writeFile(
  path.join(output, "video-checks.json"),
  JSON.stringify({ date: new Date().toISOString(), checks }, null, 2),
);
