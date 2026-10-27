import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Headphones, Clapperboard, Play, Plus, Check, Info, Star } from "lucide-react";
import { all, books, findBook, cover } from "../data/books";
import { makeBackdrop } from "../data/titles";
import { go, useStore } from "../shared/store";
import { Rail, TitleCard, Poster, ago } from "./ui";

// Streaming-style home. Layout: full-bleed billboard, section switcher, then rows.
// Formats carry their own colour (read / listen / watch) everywhere they appear.

const by = (k, list = all) => [...list].sort((a, b) => b[k] - a[k]);
const fmtOf = (t) => (t.type === "Книга" ? "book" : "comic");

export const collections = [
  { id: "classic", name: "Классика целиком", sub: "Книги в общественном достоянии", pick: (t) => t.type === "Книга" },
  { id: "short", name: "Прочитать за вечер", sub: "До 30 глав", pick: (t) => t.comic && t.chapterCount <= 30 },
  { id: "cozy", name: "Тёплая повседневность", sub: "Без спешки и злодеев", pick: (t) => t.genres.some((g) => ["Повседневность", "Комедия"].includes(g)) },
  { id: "done", name: "Уже завершены", sub: "Можно читать до конца", pick: (t) => t.status === "Завершён" },
  { id: "mystery", name: "Загадки и тайны", sub: "Детективы, мистика, триллеры", pick: (t) => t.genres.some((g) => ["Детектив", "Мистика", "Триллер", "Готика"].includes(g)) },
];

const sections = [
  ["all", "Всё"],
  ["read", "Читать", BookOpen],
  ["listen", "Слушать", Headphones],
  ["watch", "Смотреть", Clapperboard],
];

function hexHue(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 40;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}
// Every title gets a drawn wide backdrop; books take the hue of their cover colour.
export function backdrop(t) {
  return makeBackdrop(t.id, t.demo ? t.hue : hexHue(t.color || "#b4a07a"));
}
const DUR = 7000;
const reduceMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Billboard({ items }) {
  const { state, update, setToast } = useStore();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0); // ms shown of the current slide, kept across pauses
  const bars = useRef([]);
  const t = items[i];
  const show = (k) => {
    elapsed.current = 0;
    bars.current.forEach((b) => b && (b.style.width = "0%"));
    setI(k);
  };
  // One clock drives both the slide change and the progress bar, so they never drift.
  useEffect(() => {
    if (paused || reduceMotion()) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      elapsed.current += now - last;
      last = now;
      const bar = bars.current[i];
      if (bar) bar.style.width = Math.min(100, (elapsed.current / DUR) * 100) + "%";
      if (elapsed.current >= DUR) return show((i + 1) % items.length);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, paused, items.length]);
  const saved = !!state.bookmarks?.[t.id];
  const p = state.progress?.[t.id];
  return (
    <section
      className="lx-bill"
      aria-roledescription="карусель"
      aria-label="Выбор Luma"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
    >
      {items.map((x, k) => (
        <div key={x.id} className={`lx-bill-bg ${k === i ? "on" : ""}`} style={{ backgroundImage: `url("${backdrop(x)}")` }} aria-hidden="true" />
      ))}
      <div className="lx-bill-shade" aria-hidden="true" />
      <div className="lx-bill-in">
        <div className="lx-bill-text" key={t.id}>
          <span className={`lx-fmt lx-fmt-${fmtOf(t)}`}>
            {t.type === "Книга" ? <BookOpen size={14} /> : <BookOpen size={14} />}
            {t.type}
            {t.demo && <i>демо</i>}
          </span>
          <h1 className="lx-bill-title">{t.title}</h1>
          <p className="lx-bill-meta">
            <span className="lx-bill-score"><Star size={14} fill="currentColor" strokeWidth={0} /> {t.rating.toFixed(1)}</span>
            <span>{t.year}</span>
            <span>{t.genres.slice(0, 2).join(", ")}</span>
            <span>{t.chapterCount} глав</span>
          </p>
          <p className="lx-bill-desc">{t.description}</p>
          <div className="lx-bill-actions">
            <button className="lx-cta" onClick={() => go(`/reader/${t.id}${p ? "" : "?chapter=0"}`)}>
              <Play size={18} fill="currentColor" />
              <span className="lx-long">{p ? `Продолжить с главы ${(p.chapter || 0) + 1}` : "Начать читать"}</span>
              <span className="lx-short">{p ? `Глава ${(p.chapter || 0) + 1}` : "Читать"}</span>
            </button>
            <button
              className="lx-cta-ghost"
              aria-pressed={saved}
              onClick={() => {
                update((s) => {
                  const b = { ...s.bookmarks };
                  saved ? delete b[t.id] : (b[t.id] = "planned");
                  return { bookmarks: b };
                });
                setToast(saved ? "Убрано из закладок" : "Добавлено в «Буду читать»");
              }}
            >
              {saved ? <Check size={18} /> : <Plus size={18} />}
              {saved ? "В закладках" : "Буду читать"}
            </button>
            <button className="lx-cta-round" aria-label={`Подробнее о «${t.title}»`} onClick={() => go("/title/" + t.id)}>
              <Info size={20} />
            </button>
          </div>
        </div>
        <button className="lx-bill-cover" onClick={() => go("/title/" + t.id)} aria-label={`Открыть «${t.title}»`}>
          <Poster t={t} tag={false} />
        </button>
      </div>
      <div className="lx-bill-dots" role="tablist" aria-label="Слайды">
        {items.map((x, k) => (
          <button key={x.id} role="tab" aria-selected={k === i} aria-label={x.title} className={k === i ? "on" : ""} onClick={() => show(k)}>
            <span className="lx-dot-track">
              <i ref={(el) => (bars.current[k] = el)} style={{ width: k === i && reduceMotion() ? "100%" : undefined }} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Sections({ sec }) {
  return (
    <div className="lx-secs" role="tablist" aria-label="Разделы">
      {sections.map(([k, l, I]) => (
        <button key={k} role="tab" aria-selected={sec === k} className={`lx-sec lx-sec-${k} ${sec === k ? "active" : ""}`} onClick={() => go(k === "all" ? "/" : "/?s=" + k)}>
          {I && <I size={17} />}
          {l}
        </button>
      ))}
    </div>
  );
}

function ContinueCard({ t, p }) {
  return (
    <button className="lx-wide-card" onClick={() => go(`/reader/${t.id}`)}>
      <span className="lx-wide-art" style={{ backgroundImage: `url("${backdrop(t)}")` }}>
        <span className="lx-wide-play"><Play size={18} fill="currentColor" /></span>
      </span>
      <span className="lx-wide-text">
        <strong>{t.title}</strong>
        <small>Глава {(p.chapter || 0) + 1} из {t.chapterCount}</small>
      </span>
      <span className="lx-wide-bar"><i style={{ width: Math.max(4, p.percent || 0) + "%" }} /></span>
    </button>
  );
}

function Top10({ list }) {
  return (
    <Rail
      id="top10"
      title="Топ-10 недели"
      more="/top"
      items={list.slice(0, 10)}
      render={(t, i) => (
        <button key={t.id} className="lx-top10" onClick={() => go("/title/" + t.id)} aria-label={`${i + 1} место: ${t.title}`}>
          <span className="lx-top10-n" aria-hidden="true">{i + 1}</span>
          <Poster t={t} tag={false} />
        </button>
      )}
    />
  );
}

function Moods() {
  const moods = [
    ["Фэнтези", 268],
    ["Романтика", 340],
    ["Мистика", 220],
    ["Боевик", 8],
    ["Повседневность", 150],
    ["Детектив", 40],
    ["Комедия", 52],
    ["Фантастика", 196],
  ];
  return (
    <section className="lx-section" aria-labelledby="moods">
      <div className="lx-section-head">
        <h2 id="moods">Под настроение</h2>
      </div>
      <div className="lx-moods">
        {moods.map(([g, h]) => (
          <button key={g} className="lx-mood" style={{ "--h": h }} onClick={() => go("/catalog?genre=" + encodeURIComponent(g))}>
            <span>{g}</span>
            <small>{all.filter((t) => t.genres.includes(g)).length}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function Shelf({ c }) {
  const items = all.filter(c.pick).sort((a, b) => b.rating - a.rating);
  return (
    <button className="lx-shelf" onClick={() => go("/catalog?collection=" + c.id)}>
      <span className="lx-shelf-text">
        <strong>{c.name}</strong>
        <small>{c.sub} · {items.length}</small>
      </span>
      <span className="lx-shelf-stack" aria-hidden="true">
        {items.slice(0, 4).map((t, i) => (
          <Poster key={t.id} t={t} tag={false} className={`lx-stack-${i}`} />
        ))}
      </span>
    </button>
  );
}

function Listen() {
  const alice = findBook("alice");
  return (
    <>
      <section className="lx-section" aria-labelledby="listen-now">
        <div className="lx-section-head">
          <h2 id="listen-now">Слушать сейчас</h2>
        </div>
        <button className="lx-audio-hero" onClick={() => go("/audio")}>
          <Poster t={alice} tag={false} className="lx-audio-cover" />
          <span className="lx-audio-text">
            <span className="lx-fmt lx-fmt-listen"><Headphones size={14} /> Аудиокнига</span>
            <strong>{alice.title}</strong>
            <small>{alice.author} · первая глава в озвучке</small>
            <span className="lx-cta lx-cta-listen"><Play size={18} fill="currentColor" /> Слушать</span>
          </span>
        </button>
      </section>
      <Soon kind="listen" />
    </>
  );
}

function Soon({ kind }) {
  const text =
    kind === "watch"
      ? ["Смотреть — скоро", "Аниме, фильмы и сериалы появятся здесь из официальных источников: встроенные плееры правообладателей и бесплатные каталоги."]
      : ["Больше аудиокниг — скоро", "Озвучки классики и авторские аудиокниги будут собираться в этом разделе."];
  return (
    <section className={`lx-soon lx-soon-${kind}`}>
      <span className={`lx-fmt lx-fmt-${kind}`}>{kind === "watch" ? <Clapperboard size={14} /> : <Headphones size={14} />} Скоро</span>
      <h2>{text[0]}</h2>
      <p>{text[1]}</p>
    </section>
  );
}

export default function Home({ query = "" }) {
  const { state } = useStore();
  const sec = new URLSearchParams(query).get("s") || "all";
  const pool = sec === "read" ? all : all;
  const picks = useMemo(() => ["lighthouse", "teahouse", "alice", "dragoncook", "eclipse"].map(findBook), []);
  const continuing = Object.entries(state.progress || {})
    .filter(([id]) => all.some((t) => t.id === id))
    .map(([id, p]) => [findBook(id), p]);
  const lastRead = continuing.length ? continuing[continuing.length - 1][0] : null;
  const because = lastRead
    ? all.filter((x) => x.id !== lastRead.id && x.genres.some((g) => lastRead.genres.includes(g))).sort((a, b) => b.rating - a.rating).slice(0, 12)
    : [];
  const fresh = by("added", pool.filter((t) => t.comic)).slice(0, 14);
  const updates = by("updated", pool.filter((t) => t.comic)).slice(0, 14);
  const soon = all.filter((t) => t.status === "Анонс" || t.year >= 2026);
  return (
    <div className="lx-home2">
      <Billboard items={picks} />
      <div className="lx-page lx-home2-body">
        <Sections sec={sec} />
        {sec === "watch" ? (
          <Soon kind="watch" />
        ) : sec === "listen" ? (
          <Listen />
        ) : (
          <>
            {continuing.length > 0 && (
              <Rail id="cont" title="Продолжить" items={continuing.map(([t]) => t)} render={(t) => <ContinueCard key={t.id} t={t} p={state.progress[t.id]} />} />
            )}
            <Top10 list={by("views")} />
            {because.length > 0 && <Rail id="because" title={`Потому что вы читали «${lastRead.title}»`} items={because} />}
            <Rail id="fresh" title="Новинки" more="/catalog?sort=added" items={fresh} />
            <Moods />
            <section className="lx-section" aria-labelledby="shelves">
              <div className="lx-section-head">
                <h2 id="shelves">Подборки Luma</h2>
              </div>
              <div className="lx-shelves">
                {collections.map((c) => (
                  <Shelf key={c.id} c={c} />
                ))}
              </div>
            </section>
            <Rail
              id="upd"
              title="Вышли новые главы"
              more="/catalog?sort=updated"
              items={updates}
              render={(t) => <TitleCard key={t.id} t={t} sub={`Глава ${t.chapterCount} · ${ago(t.updated)}`} />}
            />
            <Rail id="books" title="Книги целиком" more="/catalog?type=Книга" items={books} />
            <Rail id="soon" title="Скоро и только что вышло" items={soon} />
            {sec === "all" && (
              <>
                <Listen />
                <Soon kind="watch" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
