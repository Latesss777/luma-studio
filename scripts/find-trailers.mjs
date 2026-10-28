// Поиск официальных трейлеров. Ничего не скачивает: собирает ID роликов на YouTube
// и пишет кандидатов в scripts/trailer-candidates.json. Кандидаты попадают в приложение
// только после того, как в них поставлено status: "approved" и запущен режим --publish.
//
// Использование:
//   node scripts/find-trailers.mjs            поиск кандидатов
//   node scripts/find-trailers.mjs --publish  записать подтверждённые в frontend/src/data/trailers.json
//
// Переменные окружения:
//   TMDB_API_KEY  необязательно; без него экранизации в кино и сериалах не ищутся
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { books } from "../frontend/src/data/books.js";

const UA = "LumaStudio-trailer-finder/0.1 (https://github.com/Latesss777/luma-studio)";
const CANDIDATES = "scripts/trailer-candidates.json";
const PUBLISHED = "frontend/src/data/trailers.json";

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...init.headers } });
  if (!res.ok) throw new Error(`${res.status} ${url.slice(0, 80)}`);
  return res.json();
}

// Wikidata: находим экранизации книги (свойство P144 «основано на»)
// и их идентификаторы TMDB (P4947 — фильм, P4983 — сериал).
export function adaptationsFromSparql(json) {
  return (json.results?.bindings || []).map((b) => ({
    label: b.label?.value || "",
    wikidata: b.work.value.split("/").pop(),
    tmdbMovie: b.tmdbMovie?.value || null,
    tmdbTv: b.tmdbTv?.value || null,
  }));
}

export async function findAdaptations(book) {
  const search = "https://www.wikidata.org/w/api.php?" + new URLSearchParams({
    action: "wbsearchentities", search: book.original, language: "en", type: "item", format: "json", limit: "5",
  });
  const found = await getJson(search);
  const work = (found.search || []).find((s) => /novel|book|novella|short story|play|epic/i.test(s.description || ""));
  if (!work) return [];
  const query = `SELECT ?work ?label ?tmdbMovie ?tmdbTv WHERE {
    ?work wdt:P144 wd:${work.id}.
    OPTIONAL { ?work wdt:P4947 ?tmdbMovie. }
    OPTIONAL { ?work wdt:P4983 ?tmdbTv. }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ?work rdfs:label ?label. }
  }`;
  const sparql = await getJson(
    "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query),
    { headers: { Accept: "application/sparql-results+json" } },
  );
  return adaptationsFromSparql(sparql);
}

// TMDB: официальный трейлер на YouTube, самый новый.
export function pickTmdbTrailer(json) {
  const list = (json.results || []).filter(
    (v) => v.site === "YouTube" && v.type === "Trailer" && v.official === true,
  );
  list.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
  return list[0] || null;
}

async function tmdbTrailer(kind, id, key) {
  const json = await getJson(`https://api.themoviedb.org/3/${kind}/${id}/videos?api_key=${key}&language=en-US`);
  const v = pickTmdbTrailer(json);
  return v ? { videoId: v.key, title: v.name } : null;
}

// YouTube oEmbed: 200 — ролик доступен, 401/404 — удалён или закрыт.
export async function youtubeAvailable(videoId) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`,
    { headers: { "User-Agent": UA } },
  );
  return res.ok;
}

async function findFor(book, tmdbKey) {
  const out = [];
  let adaptations = [];
  try {
    adaptations = await findAdaptations(book);
  } catch (e) {
    console.warn(`${book.id}: Wikidata недоступна: ${e.message}`);
  }
  for (const a of adaptations) {
    if (!tmdbKey) break;
    for (const [kind, id] of [["movie", a.tmdbMovie], ["tv", a.tmdbTv]]) {
      if (!id) continue;
      const t = await tmdbTrailer(kind, id, tmdbKey).catch((e) => {
        console.warn(`${book.id}: TMDB ${kind}/${id}: ${e.message}`);
        return null;
      });
      if (t) out.push({ id: book.id, source: `${a.label} (TMDB ${kind})`, platform: "youtube", ...t });
    }
  }
  return out;
}

async function find() {
  const tmdbKey = process.env.TMDB_API_KEY || "";
  const previous = existsSync(CANDIDATES) ? JSON.parse(readFileSync(CANDIDATES, "utf8")) : [];
  const approved = new Set(previous.filter((c) => c.status === "approved").map((c) => c.videoId));
  const found = [];
  for (const book of books) {
    for (const c of await findFor(book, tmdbKey)) {
      if (!(await youtubeAvailable(c.videoId).catch(() => false))) continue;
      found.push({
        ...c,
        url: `https://www.youtube.com/watch?v=${c.videoId}`,
        status: approved.has(c.videoId) ? "approved" : "pending",
        checkedAt: new Date().toISOString().slice(0, 10),
      });
    }
  }
  // Сохраняем уже подтверждённых кандидатов, даже если сегодня их не нашли
  const keep = previous.filter((p) => p.status === "approved" && !found.some((f) => f.videoId === p.videoId));
  const merged = [...keep, ...found];
  writeFileSync(CANDIDATES, JSON.stringify(merged, null, 2) + "\n");
  console.log(`найдено кандидатов: ${found.length}, подтверждено ранее: ${keep.length}`);
}

function publish() {
  if (!existsSync(CANDIDATES)) throw new Error("нет " + CANDIDATES);
  const list = JSON.parse(readFileSync(CANDIDATES, "utf8")).filter((c) => c.status === "approved");
  const out = {};
  for (const c of list) {
    out[c.id] = { title: c.source, kind: "Трейлер фильма", url: c.url };
  }
  writeFileSync(PUBLISHED, JSON.stringify(out, null, 2) + "\n");
  console.log(`опубликовано: ${Object.keys(out).length} → ${PUBLISHED}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--publish")) publish();
  else await find();
}
