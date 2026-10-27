import React, { lazy, Suspense, useMemo, useState } from "react";
import { Search, LayoutGrid, List, X, BookOpen, Headphones } from "lucide-react";
import { all, findBook } from "../data/books";
import { go, useStore } from "../shared/store";
import { Rail, TitleCard, Poster, Select, marks, ago } from "./ui";
import { ContinueCard } from "./Home";

const Shelves = lazy(() => import("../library/Library"));

const formats = [
  ["all", "Все форматы"],
  ["Манга", "Манга"],
  ["Манхва", "Манхва"],
  ["Маньхуа", "Маньхуа"],
  ["Комикс", "Комиксы"],
  ["Книга", "Книги"],
  ["audio", "Аудио"],
];
const progressOpts = [
  ["any", "Любой прогресс"],
  ["new", "Не начато"],
  ["going", "В процессе"],
  ["done", "Дочитано"],
];
const sorts = [
  ["recent", "Недавно читал"],
  ["added", "Недавно добавил"],
  ["progress", "По прогрессу"],
  ["rating", "По оценке"],
  ["title", "По названию"],
];

function parse(q) {
  const p = new URLSearchParams(q);
  return {
    tab: p.get("tab") || "mine",
    q: p.get("q") || "",
    fmt: p.get("fmt") || "all",
    status: p.get("status") || "all",
    prog: p.get("prog") || "any",
    sort: p.get("sort") || "recent",
    view: p.get("view") || "grid",
  };
}
function build(f) {
  const p = new URLSearchParams();
  const d = { tab: "mine", q: "", fmt: "all", status: "all", prog: "any", sort: "recent", view: "grid" };
  Object.entries(f).forEach(([k, v]) => v !== d[k] && p.set(k, v));
  const s = p.toString();
  return "/library" + (s ? "?" + s : "");
}

export default function MyLibrary({ query }) {
  const f = parse(query);
  const set = (patch) => go(build({ ...f, ...patch }));
  const { state } = useStore();
  const bm = state.bookmarks || {};
  const progress = state.progress || {};
  const lastSeen = useMemo(() => {
    const m = {};
    (state.events || []).forEach((e) => (m[e.book] = Math.max(m[e.book] || 0, e.time)));
    return m;
  }, [state.events]);

  // Everything the reader has touched: saved, bookmarked or started.
  const mine = useMemo(() => {
    const ids = new Set([...(state.library || []), ...Object.keys(bm), ...Object.keys(progress)]);
    return [...ids].filter((id) => all.some((t) => t.id === id)).map(findBook);
  }, [state.library, state.bookmarks, state.progress]);

  const pct = (t) => progress[t.id]?.percent || 0;
  const stage = (t) => (!progress[t.id] ? "new" : pct(t) >= 100 || bm[t.id] === "done" ? "done" : "going");

  const list = useMemo(() => {
    const s = f.q.trim().toLowerCase();
    const out = mine.filter(
      (t) =>
        (!s || (t.title + " " + t.original + " " + t.author).toLowerCase().includes(s)) &&
        (f.fmt === "all" || (f.fmt === "audio" ? t.audio : t.type === f.fmt)) &&
        (f.status === "all" || (f.status === "none" ? !bm[t.id] : bm[t.id] === f.status)) &&
        (f.prog === "any" || stage(t) === f.prog),
    );
    const key = {
      recent: (t) => lastSeen[t.id] || 0,
      added: (t) => (state.library || []).indexOf(t.id),
      progress: pct,
      rating: (t) => state.ratings?.[t.id] || t.rating,
    }[f.sort];
    return f.sort === "title" ? out.sort((a, b) => a.title.localeCompare(b.title, "ru")) : out.sort((a, b) => key(b) - key(a));
  }, [query, mine, lastSeen]);

  const continuing = mine
    .filter((t) => progress[t.id] && stage(t) !== "done")
    .sort((a, b) => (lastSeen[b.id] || 0) - (lastSeen[a.id] || 0));

  const count = (fn) => mine.filter(fn).length;
  const filtersOn = f.q || f.fmt !== "all" || f.status !== "all" || f.prog !== "any";

  return (
    <div className="lx-page lx-lib">
      <div className="lx-lib-head">
        <h1 className="lx-h1">Библиотека</h1>
        <div className="lx-ptabs" role="tablist">
          <button role="tab" aria-selected={f.tab === "mine"} className={f.tab === "mine" ? "active" : ""} onClick={() => set({ tab: "mine" })}>
            Мои тайтлы <span className="lx-count">{mine.length}</span>
          </button>
          <button role="tab" aria-selected={f.tab === "shelves"} className={f.tab === "shelves" ? "active" : ""} onClick={() => set({ tab: "shelves" })}>
            Полки <span className="lx-count">{(state.shelves || []).length}</span>
          </button>
        </div>
      </div>

      {f.tab === "shelves" ? (
        <div className="lx-legacy lx-lib-shelves">
          <Suspense fallback={<div className="lx-loading" role="status">Загружаем полки…</div>}>
            <Shelves initialTab="Полки" />
          </Suspense>
        </div>
      ) : (
        <>
          {continuing.length > 0 && (
            <Rail
              id="lib-cont"
              title="Продолжить"
              items={continuing}
              render={(t) => <ContinueCard key={t.id} t={t} p={progress[t.id]} />}
            />
          )}

          <section className="lx-section lx-lib-all" aria-labelledby="lib-all">
            <div className="lx-section-head">
              <h2 id="lib-all">Все тайтлы</h2>
            </div>

            <div className="lx-lib-bar">
              <label className="lx-lib-search">
                <Search size={16} aria-hidden="true" />
                <input id="lx-lib-q" type="search" placeholder="Найти в библиотеке" aria-label="Найти в библиотеке" defaultValue={f.q} onChange={(e) => set({ q: e.target.value })} />
              </label>
              <Select id="lx-lib-prog" label="Прогресс" value={f.prog} options={progressOpts} onChange={(v) => set({ prog: v })} />
              <Select id="lx-lib-sort" label="Сортировка" value={f.sort} options={sorts} onChange={(v) => set({ sort: v })} />
              <div className="lx-segment lx-view" role="group" aria-label="Вид">
                <button aria-pressed={f.view === "grid"} className={f.view === "grid" ? "active" : ""} aria-label="Сеткой" onClick={() => set({ view: "grid" })}>
                  <LayoutGrid size={16} />
                </button>
                <button aria-pressed={f.view === "list"} className={f.view === "list" ? "active" : ""} aria-label="Списком" onClick={() => set({ view: "list" })}>
                  <List size={16} />
                </button>
              </div>
            </div>

            <div className="lx-lib-filters">
              <div className="lx-chips lx-chips-scroll" role="group" aria-label="Формат">
                {formats.map(([k, l]) => {
                  const n = k === "all" ? mine.length : count((t) => (k === "audio" ? t.audio : t.type === k));
                  return (
                    <button key={k} aria-pressed={f.fmt === k} className={f.fmt === k ? "active" : ""} disabled={k !== "all" && !n} onClick={() => set({ fmt: k })}>
                      {k === "audio" && <Headphones size={14} />}
                      {k === "Книга" && <BookOpen size={14} />}
                      {l} <i>{n}</i>
                    </button>
                  );
                })}
              </div>
              <div className="lx-chips lx-chips-scroll" role="group" aria-label="Статус">
                {[["all", "Любой статус"], ...marks, ["none", "Без закладки"]].map(([k, l]) => {
                  const n = k === "all" ? mine.length : k === "none" ? count((t) => !bm[t.id]) : count((t) => bm[t.id] === k);
                  return (
                    <button key={k} aria-pressed={f.status === k} className={f.status === k ? "active" : ""} onClick={() => set({ status: k })}>
                      {l} <i>{n}</i>
                    </button>
                  );
                })}
              </div>
            </div>

            {filtersOn && (
              <p className="lx-found">
                Найдено: {list.length}
                <button className="lx-link" onClick={() => go("/library")}>
                  <X size={14} /> Сбросить
                </button>
              </p>
            )}

            {!mine.length ? (
              <div className="lx-empty">
                <h2>Библиотека пока пустая</h2>
                <p>Откройте тайтл и нажмите «В закладки» или начните читать, и он появится здесь.</p>
                <button className="lx-btn lx-btn-auto" onClick={() => go("/catalog")}>
                  Открыть каталог
                </button>
              </div>
            ) : !list.length ? (
              <div className="lx-empty">
                <h2>Под эти фильтры ничего не подходит</h2>
                <p>Попробуйте другой формат или статус.</p>
                <button className="lx-btn lx-btn-auto" onClick={() => go("/library")}>
                  Сбросить фильтры
                </button>
              </div>
            ) : f.view === "grid" ? (
              <div className="lx-grid">
                {list.map((t) => (
                  <div key={t.id} className="lx-lib-cell">
                    <TitleCard t={t} sub={progress[t.id] ? `Глава ${(progress[t.id].chapter || 0) + 1} из ${t.chapterCount}` : `${t.type} ${t.year}`} />
                    <span className="lx-wide-bar"><i style={{ width: pct(t) + "%" }} /></span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="lx-lib-list">
                {list.map((t) => {
                  const p = progress[t.id];
                  const mark = marks.find((m) => m[0] === bm[t.id]);
                  return (
                    <li key={t.id}>
                      <button className="lx-lib-row" onClick={() => go("/title/" + t.id)}>
                        <Poster t={t} tag={false} className="lx-lib-cover" />
                        <span className="lx-lib-info">
                          <strong>{t.title}</strong>
                          <small>
                            {t.type} · {t.year}
                            {mark ? ` · ${mark[1]}` : ""}
                            {lastSeen[t.id] ? ` · открыт ${ago(lastSeen[t.id])}` : ""}
                          </small>
                          <span className="lx-wide-bar"><i style={{ width: pct(t) + "%" }} /></span>
                        </span>
                        <span className="lx-lib-pct">{p ? `${pct(t)}%` : "Не начато"}</span>
                      </button>
                      <button className="lx-btn lx-btn-sm" onClick={() => go(`/reader/${t.id}${p ? "" : "?chapter=0"}`)}>
                        {p ? "Продолжить" : "Читать"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
