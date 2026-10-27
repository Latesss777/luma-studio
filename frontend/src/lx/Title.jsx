import React, { useMemo, useState } from "react";
import { Play, Eye, Heart, Bookmark, Star, ArrowDownUp, Check, Headphones } from "lucide-react";
import chapters from "../data/chapters.json";
import { all, findBook } from "../data/books";
import { chapterList } from "../data/titles";
import { go, useStore } from "../shared/store";
import { Community } from "../shared/ui";
import { Poster, Score, BookmarkButton, Rail, TitleCard, num, ago } from "./ui";

function RateBox({ id }) {
  const { state, update, setToast } = useStore();
  const mine = state.ratings?.[id];
  return (
    <div className="lx-rate" role="group" aria-label="Ваша оценка">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          aria-label={`Оценка ${n}`}
          aria-pressed={mine === n}
          className={mine >= n ? "on" : ""}
          onClick={() => {
            update((s) => ({ ratings: { ...(s.ratings || {}), [id]: n } }));
            setToast(`Ваша оценка: ${n}`);
          }}
        >
          <Star size={18} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
      <span>{mine ? `Ваша оценка ${mine}` : "Оцените"}</span>
    </div>
  );
}

function Chapters({ t }) {
  const { state, update } = useStore();
  const [asc, setAsc] = useState(false);
  const read = state.readChapters?.[t.id] || [];
  const list = t.comic
    ? chapterList(t)
    : (chapters[t.id] || []).map((c, i) => ({ n: i + 1, title: c.title, date: t.updated }));
  const rows = asc ? list : [...list].reverse();
  return (
    <div className="lx-chapters">
      <div className="lx-chapters-head">
        <span>{list.length} глав</span>
        <button className="lx-pill" onClick={() => setAsc(!asc)}>
          <ArrowDownUp size={16} />
          {asc ? "Сначала первые" : "Сначала новые"}
        </button>
      </div>
      <ul>
        {rows.map((c) => {
          const done = read.includes(c.n - 1);
          return (
            <li key={c.n} className={done ? "read" : ""}>
              <button className="lx-chapter" onClick={() => go(`/reader/${t.id}?chapter=${c.n - 1}`)}>
                <strong>Глава {c.n}</strong>
                {c.title && <span className="lx-chapter-name">{c.title}</span>}
                <small>{t.comic ? ago(c.date) : "Standard Ebooks"}</small>
              </button>
              <button
                className={`lx-icon ${done ? "lx-icon-on" : ""}`}
                aria-label={done ? `Глава ${c.n}: снять отметку` : `Глава ${c.n}: отметить прочитанной`}
                aria-pressed={done}
                onClick={() =>
                  update((s) => {
                    const cur = s.readChapters?.[t.id] || [];
                    const next = cur.includes(c.n - 1) ? cur.filter((x) => x !== c.n - 1) : [...cur, c.n - 1];
                    return { readChapters: { ...(s.readChapters || {}), [t.id]: next } };
                  })
                }
              >
                <Check size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Title({ id, query }) {
  const t = findBook(id);
  const { state } = useStore();
  const tab = new URLSearchParams(query).get("tab") || "main";
  const setTab = (k) => go(`/title/${t.id}${k === "main" ? "" : "?tab=" + k}`);
  const p = state.progress?.[t.id];
  const similar = useMemo(
    () =>
      all
        .filter((x) => x.id !== t.id && x.genres.some((g) => t.genres.includes(g)))
        .sort((a, b) => b.genres.filter((g) => t.genres.includes(g)).length - a.genres.filter((g) => t.genres.includes(g)).length || b.rating - a.rating)
        .concat(all.filter((x) => x.id !== t.id && x.type === t.type).sort((a, b) => b.rating - a.rating))
        .filter((x, i, arr) => arr.indexOf(x) === i)
        .slice(0, 12),
    [t.id],
  );
  const reviews = (state.reviews?.[t.id] || []).length;
  const tabs = [
    ["main", "Главная"],
    ["chapters", `Главы (${t.chapterCount})`],
    ["talk", `Обсуждения${reviews ? ` (${reviews})` : ""}`],
  ];
  return (
    <div className="lx-page lx-title" style={{ "--hue": t.hue ?? 40 }}>
      <div className="lx-title-glow" aria-hidden="true" />
      <div className="lx-title-grid">
        <aside className="lx-title-side">
          <Poster t={t} className="lx-title-cover" />
          <button className="lx-btn lx-btn-big" onClick={() => go(`/reader/${t.id}${p ? "" : "?chapter=0"}`)}>
            <Play size={18} fill="currentColor" />
            {p ? `Продолжить · глава ${(p.chapter || 0) + 1}` : "Начать читать"}
          </button>
          <BookmarkButton id={t.id} />
          {t.id === "alice" && (
            <button className="lx-btn lx-btn-ghost" onClick={() => go("/audio")}>
              <Headphones size={17} /> Слушать аудио
            </button>
          )}
        </aside>
        <div className="lx-title-main">
          <div className="lx-title-type">
            {t.type} {t.year} · {t.status} · {t.age}
            {t.demo && <span className="lx-demo-inline">демо-тайтл</span>}
          </div>
          <h1>{t.title}</h1>
          {t.original !== t.title && <p className="lx-title-alt">{t.original}</p>}
          <div className="lx-title-stats">
            <span className="lx-big-score"><Star size={20} fill="currentColor" strokeWidth={0} /> {t.rating.toFixed(1)}</span>
            <span><Eye size={16} aria-hidden="true" /> {num(t.views)}</span>
            <span><Heart size={16} aria-hidden="true" /> {num(t.likes)}</span>
            <span><Bookmark size={16} aria-hidden="true" /> {num(t.bookmarks)}</span>
          </div>
          <div className="lx-tabs" role="tablist">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>
          {tab === "main" && (
            <div className="lx-title-about">
              <p className="lx-desc">{t.description}</p>
              <div className="lx-chips lx-chips-wrap">
                {t.genres.map((g) => (
                  <button key={g} onClick={() => go("/catalog?genre=" + encodeURIComponent(g))}>
                    {g}
                  </button>
                ))}
              </div>
              <dl className="lx-facts">
                <div><dt>Тип</dt><dd>{t.type}</dd></div>
                <div><dt>Автор</dt><dd>{t.author}</dd></div>
                <div><dt>Выпуск</dt><dd>{t.year}</dd></div>
                <div><dt>Статус</dt><dd>{t.status}</dd></div>
                <div><dt>Глав</dt><dd>{t.chapterCount}</dd></div>
                <div><dt>Обновлено</dt><dd>{ago(t.updated)}</dd></div>
              </dl>
              <RateBox id={t.id} />
              {t.demo && (
                <p className="lx-note">
                  Это демо-тайтл Luma: название, описание и обложка придуманы для показа интерфейса, главы состоят из
                  демо-страниц.
                </p>
              )}
              {!t.demo && (
                <p className="lx-note">
                  Текст на английском из Standard Ebooks, произведение в общественном достоянии. Русского издания пока нет.
                </p>
              )}
            </div>
          )}
          {tab === "chapters" && <Chapters t={t} />}
          {tab === "talk" && <Community id={t.id} />}
        </div>
      </div>
      {tab === "main" && <Rail id="similar" title="Похожие тайтлы" items={similar} />}
    </div>
  );
}
