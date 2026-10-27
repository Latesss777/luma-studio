import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, List, X } from "lucide-react";
import { findBook } from "../data/books";
import { chapterList } from "../data/titles";
import { go, useStore } from "../shared/store";

function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Abstract demo pages: landscapes, skies and shapes in the title's palette. No characters, no text from any real work.
function page(hue, seed, n, ch) {
  const r = rng(seed);
  const h = 900 + Math.round(r() * 500);
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
  const panels = r() > 0.5 ? `<rect x="24" y="24" width="752" height="${h - 48}" fill="none" stroke="#000" stroke-width="10"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="800" height="${h}" fill="url(#g)"/>${moon}${shapes}${panels}<text x="40" y="${h - 36}" font-family="Arial, sans-serif" font-size="20" fill="#fff" opacity=".55">Luma · демо-страница · глава ${ch + 1} · стр. ${n + 1}</text></svg>`;
  return { src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), h };
}

export default function ComicReader({ id, query }) {
  const t = findBook(id);
  const { state, update, event } = useStore();
  const list = chapterList(t);
  const asked = new URLSearchParams(query).get("chapter");
  const ch = Math.min(list.length - 1, Math.max(0, asked === null ? state.progress?.[t.id]?.chapter || 0 : Number(asked) || 0));
  const [toc, setToc] = useState(false);
  const [bar, setBar] = useState(true);
  const [pct, setPct] = useState(0);
  const pages = useMemo(() => Array.from({ length: 7 }, (_, i) => page(t.hue, (ch + 1) * 97 + i * 13 + t.id.length, i, ch)), [t.id, ch]);
  const open = (n) => go(`/reader/${t.id}?chapter=${n}`);
  useEffect(() => {
    update((s) => ({
      library: [...new Set([...s.library, t.id])],
      progress: { ...s.progress, [t.id]: { chapter: ch, page: 0, percent: Math.round(((ch + 1) / list.length) * 100) } },
      readChapters: { ...(s.readChapters || {}), [t.id]: [...new Set([...(s.readChapters?.[t.id] || []), ch])] },
    }));
    event("reading", t.id, { chapter: ch });
  }, [t.id, ch]);
  useEffect(() => {
    let last = scrollY;
    const f = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setPct(max > 0 ? Math.min(100, Math.round((scrollY / max) * 100)) : 100);
      setBar(scrollY < last || scrollY < 80);
      last = scrollY;
    };
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    const k = (e) => {
      if (e.key === "ArrowRight" && ch < list.length - 1) open(ch + 1);
      if (e.key === "ArrowLeft" && ch > 0) open(ch - 1);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [ch]);
  return (
    <div className="lx-reader" style={{ "--hue": t.hue }}>
      <header className={`lx-reader-bar ${bar ? "" : "hidden"}`}>
        <button className="lx-icon" aria-label="Вернуться к тайтлу" onClick={() => go("/title/" + t.id)}>
          <ArrowLeft size={20} />
        </button>
        <div className="lx-reader-title">
          <strong>{t.title}</strong>
          <small>Глава {ch + 1} из {list.length}</small>
        </div>
        <button className="lx-icon" aria-label="Предыдущая глава" disabled={ch === 0} onClick={() => open(ch - 1)}>
          <ChevronLeft size={20} />
        </button>
        <button className="lx-pill" aria-expanded={toc} onClick={() => setToc(!toc)}>
          <List size={17} /> Главы
        </button>
        <button className="lx-icon" aria-label="Следующая глава" disabled={ch === list.length - 1} onClick={() => open(ch + 1)}>
          <ChevronRight size={20} />
        </button>
        <span className="lx-reader-progress" style={{ "--p": pct + "%" }} />
      </header>
      {toc && (
        <nav className="lx-reader-toc" aria-label="Главы">
          <div className="lx-filters-head">
            <h2>Главы</h2>
            <button className="lx-icon" aria-label="Закрыть список глав" onClick={() => setToc(false)}>
              <X size={18} />
            </button>
          </div>
          <ul>
            {[...list].reverse().map((c) => (
              <li key={c.n}>
                <button
                  className={c.n - 1 === ch ? "active" : (state.readChapters?.[t.id] || []).includes(c.n - 1) ? "read" : ""}
                  onClick={() => {
                    setToc(false);
                    open(c.n - 1);
                  }}
                >
                  Глава {c.n}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <p className="lx-reader-note">Демо-страницы: изображения нарисованы кодом, чтобы показать ленточную читалку.</p>
      <div className="lx-strip" onClick={() => setBar((b) => !b)}>
        {pages.map((p, i) => (
          <img key={i} src={p.src} alt={`Страница ${i + 1}`} width="800" height={p.h} loading={i > 1 ? "lazy" : "eager"} />
        ))}
      </div>
      <div className="lx-reader-end">
        <p>Конец главы {ch + 1}</p>
        {ch < list.length - 1 ? (
          <button className="lx-btn lx-btn-big" onClick={() => open(ch + 1)}>
            Глава {ch + 2} <ChevronRight size={18} />
          </button>
        ) : (
          <p className="lx-note">Это последняя глава. Новые появятся в уведомлениях, если тайтл в закладках.</p>
        )}
        <button className="lx-btn lx-btn-ghost" onClick={() => go("/title/" + t.id + "?tab=chapters")}>
          Ко всем главам
        </button>
      </div>
    </div>
  );
}
