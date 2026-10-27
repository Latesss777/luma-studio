import React from "react";
import { findBook } from "../data/books";
import { go, useStore } from "../shared/store";
import { TitleCard, marks } from "./ui";

export default function Bookmarks({ query }) {
  const { state } = useStore();
  const bm = state.bookmarks || {};
  const tab = new URLSearchParams(query).get("tab") || "reading";
  const count = (k) => Object.values(bm).filter((v) => v === k).length;
  const list = Object.entries(bm)
    .filter(([, v]) => v === tab)
    .map(([id]) => findBook(id));
  return (
    <div className="lx-page lx-bookmarks">
      <h1 className="lx-h1">Закладки</h1>
      <div className="lx-tabs lx-tabs-page" role="tablist">
        {marks.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => go("/bookmarks?tab=" + k)}>
            {l} <span className="lx-count">{count(k)}</span>
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="lx-grid">
          {list.map((t) => {
            const p = state.progress?.[t.id];
            return <TitleCard key={t.id} t={t} sub={p ? `Глава ${(p.chapter || 0) + 1} из ${t.chapterCount}` : `${t.type} ${t.year}`} />;
          })}
        </div>
      ) : (
        <div className="lx-empty">
          <h2>В «{marks.find((m) => m[0] === tab)[1]}» пока пусто</h2>
          <p>Откройте любой тайтл и нажмите «В закладки», чтобы выбрать категорию.</p>
          <button className="lx-btn" onClick={() => go("/catalog")}>
            Открыть каталог
          </button>
        </div>
      )}
    </div>
  );
}
