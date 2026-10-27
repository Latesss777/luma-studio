import React, { useMemo, useState } from "react";
import { SlidersHorizontal, X, ArrowDownWideNarrow } from "lucide-react";
import { all, types, allGenres } from "../data/books";
import { go } from "../shared/store";
import { TitleCard } from "./ui";
import { collections } from "./Home";

const sorts = [
  ["views", "По популярности"],
  ["rating", "По рейтингу"],
  ["new", "По новизне"],
  ["updated", "По обновлениям"],
  ["likes", "По лайкам"],
  ["chapters", "По числу глав"],
];
const statuses = ["Продолжается", "Завершён", "Анонс"];

function parse(query) {
  const p = new URLSearchParams(query);
  return {
    q: p.get("q") || "",
    sort: p.get("sort") || "views",
    type: p.getAll("type"),
    genre: p.getAll("genre"),
    status: p.getAll("status"),
    from: Number(p.get("from")) || 1800,
    min: Number(p.get("min")) || 0,
    collection: p.get("collection") || "",
  };
}
function build(f) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.sort !== "views") p.set("sort", f.sort);
  f.type.forEach((v) => p.append("type", v));
  f.genre.forEach((v) => p.append("genre", v));
  f.status.forEach((v) => p.append("status", v));
  if (f.from > 1800) p.set("from", f.from);
  if (f.min) p.set("min", f.min);
  if (f.collection) p.set("collection", f.collection);
  const s = p.toString();
  return "/catalog" + (s ? "?" + s : "");
}
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function Catalog({ query }) {
  const f = parse(query);
  const [panel, setPanel] = useState(false);
  const set = (patch) => go(build({ ...f, ...patch }));
  const coll = collections.find((c) => c.id === f.collection);
  const list = useMemo(() => {
    const s = f.q.toLowerCase();
    const key = { views: "views", rating: "rating", new: "added", updated: "updated", likes: "likes", chapters: "chapterCount" }[f.sort];
    return all
      .filter(
        (t) =>
          (!s || (t.title + " " + t.original + " " + t.author + " " + t.genres.join(" ")).toLowerCase().includes(s)) &&
          (!f.type.length || f.type.includes(t.type)) &&
          (!f.genre.length || f.genre.every((g) => t.genres.includes(g))) &&
          (!f.status.length || f.status.includes(t.status)) &&
          t.year >= f.from &&
          t.rating >= f.min &&
          (!coll || coll.pick(t)),
      )
      .sort((a, b) => b[key] - a[key]);
  }, [query]);
  const active = f.genre.length + f.status.length + (f.from > 1800) + (f.min > 0);
  return (
    <div className="lx-page lx-catalog">
      <h1 className="lx-h1">{coll ? coll.name : f.q ? `Поиск: «${f.q}»` : "Каталог"}</h1>
      <div className="lx-toolbar">
        <label className="lx-select">
          <ArrowDownWideNarrow size={17} aria-hidden="true" />
          <span className="lx-sr">Сортировка</span>
          <select id="lx-sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
            {sorts.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <div className="lx-chips lx-chips-scroll">
          {types.map((t) => (
            <button key={t} className={f.type.includes(t) ? "active" : ""} aria-pressed={f.type.includes(t)} onClick={() => set({ type: toggle(f.type, t) })}>
              {t === "Книга" ? "Книги" : t}
            </button>
          ))}
        </div>
        <button className={`lx-pill ${panel || active ? "active" : ""}`} aria-expanded={panel} onClick={() => setPanel(!panel)}>
          <SlidersHorizontal size={17} />
          Фильтры{active ? ` · ${active}` : ""}
        </button>
      </div>
      {(f.q || coll || f.type.length > 0 || active > 0) && (
        <div className="lx-active-filters">
          <span>{list.length} найдено</span>
          {f.q && <button onClick={() => set({ q: "" })}>«{f.q}» <X size={14} /></button>}
          {coll && <button onClick={() => set({ collection: "" })}>{coll.name} <X size={14} /></button>}
          {[...f.genre].map((g) => (
            <button key={g} onClick={() => set({ genre: toggle(f.genre, g) })}>{g} <X size={14} /></button>
          ))}
          <button className="lx-clear" onClick={() => go("/catalog")}>Сбросить всё</button>
        </div>
      )}
      <div className={`lx-catalog-body ${panel ? "with-panel" : ""}`}>
        <div className="lx-grid">
          {list.map((t) => (
            <TitleCard key={t.id} t={t} />
          ))}
          {!list.length && (
            <div className="lx-empty">
              <h2>По этим условиям ничего нет</h2>
              <p>Уберите часть фильтров или поищите по другому названию.</p>
              <button className="lx-btn" onClick={() => go("/catalog")}>Сбросить фильтры</button>
            </div>
          )}
        </div>
        {panel && (
          <aside className="lx-filters" aria-label="Фильтры">
            <div className="lx-filters-head">
              <h2>Фильтры</h2>
              <button className="lx-icon" aria-label="Закрыть фильтры" onClick={() => setPanel(false)}>
                <X size={18} />
              </button>
            </div>
            <fieldset>
              <legend>Жанры</legend>
              <div className="lx-chips lx-chips-wrap">
                {allGenres.map((g) => (
                  <button key={g} className={f.genre.includes(g) ? "active" : ""} aria-pressed={f.genre.includes(g)} onClick={() => set({ genre: toggle(f.genre, g) })}>
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Статус</legend>
              <div className="lx-chips lx-chips-wrap">
                {statuses.map((s) => (
                  <button key={s} className={f.status.includes(s) ? "active" : ""} aria-pressed={f.status.includes(s)} onClick={() => set({ status: toggle(f.status, s) })}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Год выпуска</legend>
              <label className="lx-field">
                Не раньше
                <select id="lx-from" value={f.from} onChange={(e) => set({ from: Number(e.target.value) })}>
                  <option value={1800}>Любой</option>
                  {[1900, 2020, 2022, 2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>Оценка не ниже</legend>
              <div className="lx-chips lx-chips-wrap">
                {[0, 8, 8.5, 9].map((m) => (
                  <button key={m} className={f.min === m ? "active" : ""} aria-pressed={f.min === m} onClick={() => set({ min: m })}>
                    {m ? "★ " + m : "Любая"}
                  </button>
                ))}
              </div>
            </fieldset>
          </aside>
        )}
      </div>
    </div>
  );
}
