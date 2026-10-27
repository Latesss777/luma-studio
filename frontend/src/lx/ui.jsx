import React, { useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, ChevronDown, ArrowUpRight, Bookmark, Check } from "lucide-react";
import { cover } from "../data/books";
import { go, useStore } from "../shared/store";

export const smooth = () => (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

export const marks = [
  ["reading", "Читаю"],
  ["planned", "Буду читать"],
  ["done", "Прочитано"],
  ["favorite", "Любимое"],
  ["dropped", "Брошено"],
];

export const num = (n) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + " млн" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(".0", "") + " тыс" : String(n);

const NOW = Date.UTC(2026, 9, 27, 12);
export function ago(t) {
  const m = Math.round((NOW - t) / 60000);
  if (m < 60) return `${Math.max(1, m)} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} дн назад`;
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", year: "numeric" }).format(t);
}

export function Poster({ t, className = "", tag = true }) {
  return (
    <span className={`lx-poster ${className}`} style={{ "--hue": t.hue ?? 40 }}>
      <img src={cover(t)} alt="" loading="lazy" decoding="async" />
      {t.demo && tag && <span className="lx-demo">демо</span>}
    </span>
  );
}

export function Score({ value }) {
  return (
    <span className="lx-score">
      <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      {value.toFixed(1)}
    </span>
  );
}

export function TitleCard({ t, rank, sub }) {
  return (
    <a className="lx-card" href={`#/title/${t.id}`} onClick={(e) => { e.preventDefault(); go("/title/" + t.id); }}>
      <span className="lx-card-cover">
        <Poster t={t} tag={!rank} />
        <Score value={t.rating} />
        {rank && <span className="lx-rank">{rank}</span>}
      </span>
      <span className="lx-card-meta">{sub ?? `${t.type} ${t.year}`}</span>
      <span className="lx-card-title">{t.title}</span>
    </a>
  );
}

export function Rail({ title, items, more, children, render, wide = false, id }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState([true, false]);
  const check = () => {
    const el = ref.current;
    if (!el) return;
    setEdge([el.scrollLeft < 8, el.scrollLeft + el.clientWidth > el.scrollWidth - 8]);
  };
  useEffect(() => {
    check();
    addEventListener("resize", check);
    return () => removeEventListener("resize", check);
  }, [items]);
  const by = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: smooth() });
  return (
    <section className={`lx-section ${wide ? "lx-bleed" : ""}`} aria-labelledby={id}>
      {title && (
        <div className="lx-section-head">
          <h2 id={id}>{title}</h2>
          {children}
          {more && (
            <button className="lx-round" aria-label={`${title}: открыть всё`} onClick={() => go(more)}>
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
      )}
      <div className="lx-rail-wrap">
        <div className="lx-rail" ref={ref} onScroll={check}>
          {items.map((t, i) => (render ? render(t, i) : <TitleCard key={t.id} t={t} />))}
        </div>
        {!edge[0] && (
          <button className="lx-round lx-arrow lx-arrow-l" aria-label="Прокрутить назад" onClick={() => by(-1)}>
            <ChevronLeft size={18} />
          </button>
        )}
        {!edge[1] && (
          <button className="lx-round lx-arrow lx-arrow-r" aria-label="Прокрутить вперёд" onClick={() => by(1)}>
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </section>
  );
}

export function Row({ t, right, sub }) {
  return (
    <a className="lx-row" href={`#/title/${t.id}`} onClick={(e) => { e.preventDefault(); go("/title/" + t.id); }}>
      <Poster t={t} className="lx-row-cover" />
      <span className="lx-row-text">
        <strong>{t.title}</strong>
        <small>{sub ?? `${t.type} ${t.year} · ${t.genres[0]}`}</small>
      </span>
      {right ?? <Score value={t.rating} />}
    </a>
  );
}

export function BookmarkButton({ id }) {
  const { state, update, setToast } = useStore();
  const [open, setOpen] = useState(false);
  const cur = state.bookmarks?.[id];
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const f = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, [open]);
  const set = (k) => {
    update((s) => {
      const b = { ...s.bookmarks };
      if (k) b[id] = k;
      else delete b[id];
      return { bookmarks: b, library: k ? [...new Set([...s.library, id])] : s.library };
    });
    setToast(k ? `В закладках: ${marks.find((m) => m[0] === k)[1]}` : "Убрано из закладок");
    setOpen(false);
  };
  return (
    <div className="lx-menu-wrap" ref={ref}>
      <button className={`lx-btn ${cur ? "lx-btn-on" : "lx-btn-ghost"}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Bookmark size={17} fill={cur ? "currentColor" : "none"} />
        {cur ? marks.find((m) => m[0] === cur)[1] : "В закладки"}
      </button>
      {open && (
        <div className="lx-menu" role="menu">
          {marks.map(([k, label]) => (
            <button key={k} role="menuitemradio" aria-checked={cur === k} onClick={() => set(k)}>
              {label}
              {cur === k && <Check size={16} />}
            </button>
          ))}
          {cur && (
            <button className="lx-menu-danger" onClick={() => set(null)}>
              Убрать из закладок
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Custom dropdown so the open list follows the Luma palette instead of the OS one.
export function Select({ id, label, value, options, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  const cur = options.find((o) => o[0] === value) || options[0];
  useEffect(() => {
    if (!open) return;
    setHi(Math.max(0, options.findIndex((o) => o[0] === value)));
    const f = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, [open]);
  const pick = (k) => {
    onChange(k);
    setOpen(false);
    ref.current?.querySelector("button")?.focus();
  };
  const key = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setHi((h) => (h + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      pick(options[hi][0]);
    } else if (e.key === "Escape") setOpen(false);
  };
  return (
    <div className="lx-dd" ref={ref} onKeyDown={key}>
      <button id={id} type="button" className="lx-dd-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${cur[1]}`} onClick={() => setOpen(!open)}>
        {Icon && <Icon size={16} aria-hidden="true" />}
        <span>{cur[1]}</span>
        <ChevronDown size={16} aria-hidden="true" className="lx-dd-chev" />
      </button>
      {open && (
        <ul className="lx-pop lx-dd-list" role="listbox" aria-label={label}>
          {options.map(([k, l], i) => (
            <li
              key={k}
              role="option"
              aria-selected={k === value}
              className={`${k === value ? "sel" : ""} ${i === hi ? "hi" : ""}`}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(k)}
            >
              {l}
              {k === value && <Check size={15} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
