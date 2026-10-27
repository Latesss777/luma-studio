import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, List, MessageSquare, Heart, Settings2, Maximize, ArrowUp, X, Check } from "lucide-react";
import chapters from "../data/chapters.json";
import { findBook } from "../data/books";
import { go, useStore } from "../shared/store";
import { BrandArt } from "../shared/ui";
import { chaptersOf } from "./Title";
import Comments from "./Comments";

function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Abstract demo pages: skies, ridges, skylines and light in the title's palette. No characters.
function page(hue, seed, n, ch) {
  const r = rng(seed);
  const h = 1000 + Math.round(r() * 400);
  const top = `hsl(${(hue + r() * 60) % 360} 50% ${12 + r() * 20}%)`;
  const bottom = `hsl(${(hue + 120 + r() * 80) % 360} 45% ${30 + r() * 25}%)`;
  let shapes = "";
  const kind = Math.floor(r() * 3);
  if (kind === 0) {
    for (let i = 0; i < 4; i++) {
      let d = `M0 ${h * (0.55 + i * 0.1)} `;
      for (let x = 0; x <= 800; x += 80) d += `L${x} ${(h * (0.5 + i * 0.1) - r() * 120).toFixed(0)} `;
      shapes += `<path d="${d} L800 ${h} L0 ${h} Z" fill="hsl(${hue} 35% ${8 + i * 6}% / .85)"/>`;
    }
  } else if (kind === 1) {
    for (let i = 0; i < 18; i++) {
      const w = 30 + r() * 70;
      const x = r() * 800;
      const hh = h * (0.2 + r() * 0.5);
      shapes += `<rect x="${x.toFixed(0)}" y="${(h - hh).toFixed(0)}" width="${w.toFixed(0)}" height="${hh.toFixed(0)}" fill="hsl(${hue} 30% ${6 + r() * 10}%)"/>`;
      for (let k = 0; k < 6; k++)
        if (r() > 0.6) shapes += `<rect x="${(x + 6 + r() * (w - 14)).toFixed(0)}" y="${(h - hh + 12 + r() * (hh - 30)).toFixed(0)}" width="5" height="7" fill="hsl(45 90% 75% / .8)"/>`;
    }
  } else {
    for (let i = 0; i < 9; i++)
      shapes += `<circle cx="${(r() * 800).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(20 + r() * 140).toFixed(0)}" fill="hsl(${(hue + i * 25) % 360} 70% 70% / ${(0.08 + r() * 0.2).toFixed(2)})"/>`;
  }
  const moon = `<circle cx="${(100 + r() * 600).toFixed(0)}" cy="${(80 + r() * 200).toFixed(0)}" r="${(30 + r() * 50).toFixed(0)}" fill="hsl(${(hue + 180) % 360} 70% 85%)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="800" height="${h}" fill="url(#g)"/>${moon}${shapes}<text x="40" y="${h - 36}" font-family="Arial, sans-serif" font-size="20" fill="#fff" opacity=".55">Luma · демо-страница · глава ${ch + 1} · стр. ${n + 1}</text></svg>`;
  return { src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), h };
}

const defaults = { mode: "scroll", width: 760, gap: false, bg: "dark", font: 19 };

export default function ComicReader({ id, query }) {
  const t = findBook(id);
  const { state, update, event } = useStore();
  const list = chaptersOf(t);
  const asked = new URLSearchParams(query).get("chapter");
  const ch = Math.min(list.length - 1, Math.max(0, asked === null ? state.progress?.[t.id]?.chapter || 0 : Number(asked) || 0));
  const c = list[ch];
  const s = { ...defaults, ...(state.readerSettings || {}) };
  const setS = (patch) => update((st) => ({ readerSettings: { ...defaults, ...(st.readerSettings || {}), ...patch } }));
  const [drawer, setDrawer] = useState(null);
  const [pick, setPick] = useState(false);
  const [pct, setPct] = useState(0);
  const [pageNo, setPageNo] = useState(0);
  const pages = useMemo(() => (t.comic ? Array.from({ length: 7 }, (_, i) => page(t.hue, (ch + 1) * 97 + i * 13 + t.id.length, i, ch)) : []), [t.id, ch]);
  const text = !t.comic ? chapters[t.id]?.[ch]?.paragraphs || [] : [];
  const likeKey = `${t.id}:${ch}`;
  const liked = !!state.chapterLikes?.[likeKey];
  const thread = `${t.id}:ch${ch}`;
  const commentCount = (state.comments?.[thread] || []).reduce((n, x) => n + 1 + x.replies.length, 0);
  const open = (n) => go(`/reader/${t.id}?chapter=${n}`);
  useEffect(() => {
    setPageNo(0);
    window.scrollTo(0, 0);
    update((st) => ({
      library: [...new Set([...st.library, t.id])],
      progress: { ...st.progress, [t.id]: { chapter: ch, page: 0, percent: Math.round(((ch + 1) / list.length) * 100) } },
      readChapters: { ...(st.readChapters || {}), [t.id]: [...new Set([...(st.readChapters?.[t.id] || []), ch])] },
    }));
    event("reading", t.id, { chapter: ch });
  }, [t.id, ch]);
  useEffect(() => {
    const f = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setPct(max > 0 ? Math.min(100, Math.round((scrollY / max) * 100)) : 100);
    };
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    const k = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (s.mode === "pages" && t.comic) {
        if (e.key === "ArrowRight") turn(1);
        if (e.key === "ArrowLeft") turn(-1);
      } else {
        if (e.key === "ArrowRight" && ch < list.length - 1) open(ch + 1);
        if (e.key === "ArrowLeft" && ch > 0) open(ch - 1);
      }
      if (e.key === "Escape") setDrawer(null);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  const turn = (d) => {
    const n = pageNo + d;
    if (n < 0) return ch > 0 && open(ch - 1);
    if (n >= pages.length) return ch < list.length - 1 ? open(ch + 1) : setPageNo(pages.length);
    setPageNo(n);
    window.scrollTo(0, 0);
  };
  const like = () => update((st) => ({ chapterLikes: { ...(st.chapterLikes || {}), [likeKey]: !liked } }));
  const full = () => {
    try {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } catch {}
  };
  const toggleDrawer = (k) => setDrawer(drawer === k ? null : k);
  const tools = [
    ["chapters", "Главы", List],
    ["comments", "Комментарии", MessageSquare, commentCount],
  ];
  const ended = s.mode === "pages" && t.comic && pageNo >= pages.length;
  return (
    <div className={`lx-rd lx-rd-${s.bg}`} style={{ "--rd-w": s.width + "px", "--rd-font": s.font + "px" }}>
      <header className="lx-rd-head">
        <button className="lx-rd-logo" aria-label="Luma — главная" onClick={() => go("/")}>
          <BrandArt mark />
        </button>
        <button className="lx-rd-back" onClick={() => go("/title/" + t.id)}>
          <ChevronLeft size={18} />
          <span>{t.title}</span>
        </button>
        <div className="lx-rd-nav">
          <button className="lx-icon" aria-label="Предыдущая глава" disabled={ch === 0} onClick={() => open(ch - 1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="lx-menu-wrap">
            <button className="lx-rd-pick" aria-expanded={pick} onClick={() => setPick(!pick)}>
              {c.vol} - {c.n} <ChevronDown size={15} />
            </button>
            {pick && (
              <div className="lx-pop lx-rd-picker">
                {[...list].reverse().map((x) => (
                  <button
                    key={x.n}
                    className={x.n - 1 === ch ? "active" : ""}
                    onClick={() => {
                      setPick(false);
                      open(x.n - 1);
                    }}
                  >
                    Том {x.vol} · Глава {x.n}
                    {(state.readChapters?.[t.id] || []).includes(x.n - 1) && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="lx-icon" aria-label="Следующая глава" disabled={ch === list.length - 1} onClick={() => open(ch + 1)}>
            <ChevronRight size={20} />
          </button>
        </div>
        <button className="lx-icon lx-rd-gear" aria-label="Настройки читалки" onClick={() => toggleDrawer("settings")}>
          <Settings2 size={19} />
        </button>
        <span className="lx-rd-progress" style={{ "--p": pct + "%" }} />
      </header>

      <nav className={`lx-rd-tools ${drawer ? "shift" : ""}`} aria-label="Инструменты читалки">
        {tools.map(([k, l, I, n]) => (
          <button key={k} className={drawer === k ? "active" : ""} aria-label={l} title={l} onClick={() => toggleDrawer(k)}>
            <I size={19} />
            {n > 0 && <i>{n}</i>}
          </button>
        ))}
        <button className={liked ? "liked" : ""} aria-label={liked ? "Убрать лайк главы" : "Лайк главе"} title="Нравится" aria-pressed={liked} onClick={like}>
          <Heart size={19} fill={liked ? "currentColor" : "none"} />
        </button>
        <span className="lx-rd-sep" />
        <button className={drawer === "settings" ? "active" : ""} aria-label="Настройки" title="Настройки" onClick={() => toggleDrawer("settings")}>
          <Settings2 size={19} />
        </button>
        <button aria-label="На весь экран" title="На весь экран" onClick={full}>
          <Maximize size={19} />
        </button>
        <button aria-label="Наверх" title="Наверх" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp size={19} />
        </button>
      </nav>

      {drawer && (
        <aside className="lx-rd-drawer" aria-label={drawer === "chapters" ? "Главы" : drawer === "comments" ? "Комментарии" : "Настройки"}>
          <div className="lx-rd-drawer-head">
            <h2>{drawer === "chapters" ? "Главы" : drawer === "comments" ? `Глава ${c.n}` : "Настройки"}</h2>
            <button className="lx-icon" aria-label="Закрыть панель" onClick={() => setDrawer(null)}>
              <X size={18} />
            </button>
          </div>
          {drawer === "chapters" && (
            <ul className="lx-rd-chlist">
              {[...list].reverse().map((x) => {
                const read = (state.readChapters?.[t.id] || []).includes(x.n - 1);
                return (
                  <li key={x.n}>
                    <button className={x.n - 1 === ch ? "active" : read ? "read" : ""} onClick={() => open(x.n - 1)}>
                      <span>Том {x.vol} · Глава {x.n}</span>
                      {x.title && <small>{x.title}</small>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {drawer === "comments" && <Comments thread={thread} title="Комментарии к главе" />}
          {drawer === "settings" && (
            <div className="lx-rd-settings">
              {t.comic && (
                <fieldset>
                  <legend>Режим чтения</legend>
                  <div className="lx-segment">
                    {[["scroll", "Лента"], ["pages", "По страницам"]].map(([k, l]) => (
                      <button key={k} className={s.mode === k ? "active" : ""} aria-pressed={s.mode === k} onClick={() => setS({ mode: k })}>
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <fieldset>
                <legend>Ширина {t.comic ? "страниц" : "текста"}: {s.width}px</legend>
                <input id="lx-rd-width" type="range" min="480" max="1100" step="20" value={s.width} onChange={(e) => setS({ width: Number(e.target.value) })} />
              </fieldset>
              {t.comic ? (
                <label className="lx-switch">
                  <input type="checkbox" checked={s.gap} onChange={(e) => setS({ gap: e.target.checked })} />
                  <span>Отступ между страницами</span>
                </label>
              ) : (
                <fieldset>
                  <legend>Размер шрифта: {s.font}px</legend>
                  <input id="lx-rd-font" type="range" min="15" max="28" value={s.font} onChange={(e) => setS({ font: Number(e.target.value) })} />
                </fieldset>
              )}
              <fieldset>
                <legend>Фон</legend>
                <div className="lx-segment">
                  {[["dark", "Тёмный"], ["black", "Чёрный"], ["light", "Светлый"]].map(([k, l]) => (
                    <button key={k} className={s.bg === k ? "active" : ""} aria-pressed={s.bg === k} onClick={() => setS({ bg: k })}>
                      {l}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </aside>
      )}

      <main className="lx-rd-main">
        <h1 className="lx-rd-title">
          Том {c.vol} · Глава {c.n}
          {c.title ? ` — ${c.title}` : ""}
        </h1>
        {t.comic ? (
          <>
            <p className="lx-rd-note">Демо-страницы нарисованы кодом, чтобы показать работу читалки.</p>
            {s.mode === "scroll" ? (
              <div className={`lx-rd-strip ${s.gap ? "gap" : ""}`}>
                {pages.map((p, i) => (
                  <img key={i} src={p.src} alt={`Страница ${i + 1}`} width="800" height={p.h} loading={i > 1 ? "lazy" : "eager"} />
                ))}
              </div>
            ) : !ended ? (
              <div className="lx-rd-paged">
                <img src={pages[pageNo].src} alt={`Страница ${pageNo + 1}`} width="800" height={pages[pageNo].h} />
                <button className="lx-rd-zone lx-rd-zone-l" aria-label="Предыдущая страница" onClick={() => turn(-1)} />
                <button className="lx-rd-zone lx-rd-zone-r" aria-label="Следующая страница" onClick={() => turn(1)} />
                <div className="lx-rd-pageno">
                  {pageNo + 1} / {pages.length}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <article className="lx-rd-text" lang="en">
            {text.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
        )}
        {(s.mode === "scroll" || !t.comic || ended) && (
          <div className="lx-rd-end">
            <button className={`lx-rd-like ${liked ? "on" : ""}`} aria-pressed={liked} onClick={like}>
              <Heart size={20} fill={liked ? "currentColor" : "none"} />
              {liked ? "Вам понравилось" : "Понравилась глава"}
            </button>
            {ch < list.length - 1 ? (
              <button className="lx-btn lx-btn-read" onClick={() => open(ch + 1)}>
                Следующая глава <ChevronRight size={18} />
              </button>
            ) : (
              <p className="lx-muted">Это последняя глава. Добавьте тайтл в закладки, чтобы узнать о новых.</p>
            )}
            <button className="lx-btn lx-btn-flat" onClick={() => go(`/title/${t.id}?tab=chapters`)}>
              К списку глав
            </button>
            <Comments thread={thread} title="Комментарии к главе" />
          </div>
        )}
      </main>
    </div>
  );
}
