import React from "react";
import { Eye, Heart, Bookmark } from "lucide-react";
import { all, types } from "../data/books";
import { go } from "../shared/store";
import { Poster, Score, num } from "./ui";

const metrics = [
  ["rating", "По оценке"],
  ["views", "По просмотрам"],
  ["likes", "По лайкам"],
  ["bookmarks", "По закладкам"],
];

export default function Top({ query }) {
  const p = new URLSearchParams(query);
  const type = p.get("type") || "";
  const metric = p.get("by") || "rating";
  const set = (k, v) => {
    const n = new URLSearchParams(query);
    v ? n.set(k, v) : n.delete(k);
    go("/top" + (n.toString() ? "?" + n : ""));
  };
  const list = all.filter((t) => !type || t.type === type).sort((a, b) => b[metric] - a[metric]);
  return (
    <div className="lx-page lx-top">
      <h1 className="lx-h1">Топы</h1>
      <div className="lx-toolbar">
        <div className="lx-chips lx-chips-scroll" role="tablist" aria-label="Тип">
          <button role="tab" aria-selected={!type} className={!type ? "active" : ""} onClick={() => set("type", "")}>
            Все
          </button>
          {types.map((t) => (
            <button key={t} role="tab" aria-selected={type === t} className={type === t ? "active" : ""} onClick={() => set("type", t)}>
              {t === "Книга" ? "Книги" : t}
            </button>
          ))}
        </div>
        <div className="lx-segment" role="tablist" aria-label="Показатель">
          {metrics.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={metric === k} className={metric === k ? "active" : ""} onClick={() => set("by", k === "rating" ? "" : k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <ol className="lx-toplist">
        {list.map((t, i) => (
          <li key={t.id}>
            <button className="lx-top-row" onClick={() => go("/title/" + t.id)}>
              <span className={`lx-place ${i < 3 ? "lx-place-hi" : ""}`}>{i + 1}</span>
              <Poster t={t} className="lx-top-cover" />
              <span className="lx-top-text">
                <strong>{t.title}</strong>
                <small>
                  {t.type} {t.year} · {t.status} · {t.genres.join(", ")}
                </small>
                <span className="lx-top-desc">{t.description}</span>
              </span>
              <span className="lx-top-stats">
                <Score value={t.rating} />
                <span><Eye size={14} aria-hidden="true" /> {num(t.views)}</span>
                <span><Heart size={14} aria-hidden="true" /> {num(t.likes)}</span>
                <span><Bookmark size={14} aria-hidden="true" /> {num(t.bookmarks)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
