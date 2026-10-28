// Превью при наведении: 12 секунд, 320×480 (480p по высоте), без звука, ≈1–3 МБ на ролик.
// Источник — обложка произведения из public-assets (публичный домен, Standard Ebooks).
// Видео с YouTube, Rutube или VK Видео здесь не скачиваются: они только встраиваются по ссылке.
// Запуск: node scripts/make-previews.mjs   (нужен ffmpeg с librsvg)
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { books } from "../frontend/src/data/books.js";

const outDir = "frontend/public/assets/previews";
const work = "work/previews";
mkdirSync(work, { recursive: true });
mkdirSync(outDir, { recursive: true });

const ids = [...books.map((b) => b.id)];
for (const id of ids) {
  const svg = `frontend/public/assets/${id}-cover.svg`;
  if (!existsSync(svg)) {
    console.warn(`пропуск ${id}: нет ${svg} (запусти npm ci)`);
    continue;
  }
  const png = join(work, `${id}.png`);
  // ffmpeg читает SVG через librsvg; обложка 1400×2100 уменьшается до 640×960
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", svg, "-vf", "scale=640:960", "-frames:v", "1", png]);
  const out = join(outDir, `${id}.mp4`);
  execFileSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-loop", "1", "-i", png,
    "-vf", "zoompan=z='min(zoom+0.0006,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=320x480:fps=30,format=yuv420p",
    "-t", "12", "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-maxrate", "1200k", "-bufsize", "2400k",
    "-movflags", "+faststart", out,
  ]);
  console.log(`${out}  ${(statSync(out).size / 1048576).toFixed(2)} МБ`);
}
