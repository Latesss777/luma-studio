import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Bookmark, Bell, MoreHorizontal, Sun, Moon, X, LayoutGrid, Menu } from "lucide-react";
import { all } from "../data/books";
import { go, useStore } from "../shared/store";
import { BrandArt } from "../shared/ui";
import { Poster, ago } from "./ui";

function useOutside(ref, open, close) {
  useEffect(() => {
    if (!open) return;
    const f = (e) => !ref.current?.contains(e.target) && close();
    const k = (e) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", f);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("pointerdown", f);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
}

function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, open, () => setOpen(false));
  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return all.filter((t) => (t.title + " " + t.original + " " + t.author + " " + t.genres.join(" ")).toLowerCase().includes(s)).slice(0, 6);
  }, [q]);
  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    go("/catalog?q=" + encodeURIComponent(q.trim()));
  };
  return (
    <form className="lx-search" ref={ref} onSubmit={submit} role="search">
      <Search size={17} aria-hidden="true" />
      <input
        id="lx-search"
        type="search"
        aria-label="Поиск по каталогу"
        placeholder="Что почитаем сегодня?"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {open && q.trim() && (
        <div className="lx-pop lx-search-pop">
          {res.length ? (
            res.map((t) => (
              <button
                type="button"
                key={t.id}
                className="lx-search-item"
                onClick={() => {
                  setOpen(false);
                  setQ("");
                  go("/title/" + t.id);
                }}
              >
                <Poster t={t} className="lx-search-cover" />
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {t.type} {t.year} · ★ {t.rating.toFixed(1)}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="lx-pop-empty">Ничего не нашлось. Попробуйте другое название или жанр.</p>
          )}
          {res.length > 0 && (
            <button type="submit" className="lx-pop-all">
              Все результаты в каталоге
            </button>
          )}
        </div>
      )}
    </form>
  );
}

function Notifications() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, open, () => setOpen(false));
  const ids = Object.keys(state.bookmarks || {});
  const items = all
    .filter((t) => t.comic && (ids.length ? ids.includes(t.id) : true))
    .sort((a, b) => b.updated - a.updated)
    .slice(0, 6);
  return (
    <div className="lx-menu-wrap" ref={ref}>
      <button className="lx-icon" aria-label="Уведомления" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Bell size={19} />
        {ids.length > 0 && <i className="lx-dot" />}
      </button>
      {open && (
        <div className="lx-pop lx-notify">
          <h3>{ids.length ? "Новые главы в закладках" : "Новые главы в каталоге"}</h3>
          {items.map((t) => (
            <button
              key={t.id}
              className="lx-search-item"
              onClick={() => {
                setOpen(false);
                go(`/reader/${t.id}?chapter=${t.chapterCount - 1}`);
              }}
            >
              <Poster t={t} className="lx-search-cover" />
              <span>
                <strong>{t.title}</strong>
                <small>
                  Глава {t.chapterCount} · {ago(t.updated)}
                </small>
              </span>
            </button>
          ))}
          {!ids.length && <p className="lx-pop-empty">Добавьте тайтлы в закладки, и здесь будут только их главы.</p>}
        </div>
      )}
    </div>
  );
}

function More() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, open, () => setOpen(false));
  const links = [
    ["/audio", "Аудиокниги"],
    ["/library", "Мои полки"],
    ["/integrations", "Импорт и экспорт"],
    ["/profile", "Профиль и статистика"],
  ];
  return (
    <div className="lx-menu-wrap" ref={ref}>
      <button className="lx-nav-link" aria-label="Ещё разделы" aria-expanded={open} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div className="lx-menu lx-menu-left" role="menu">
          {links.map(([u, l]) => (
            <button
              key={u}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                go(u);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ path }) {
  const { state, update } = useStore();
  const light = state.theme === "light";
  const nav = [
    ["/catalog", "Каталог"],
    ["/top", "Топы"],
  ];
  return (
    <header className="lx-header">
      <div className="lx-header-in">
        <button className="lx-logo" aria-label="Luma — главная" onClick={() => go("/")}>
          <BrandArt mark />
          <span className="lx-logo-word">Luma</span>
        </button>
        <nav className="lx-nav" aria-label="Разделы">
          {nav.map(([u, l]) => (
            <button key={u} className={`lx-nav-link ${path.startsWith(u) ? "active" : ""}`} onClick={() => go(u)}>
              {l}
            </button>
          ))}
          <More />
        </nav>
        <SearchBox />
        <div className="lx-actions">
          <button className={`lx-pill ${path.startsWith("/bookmarks") ? "active" : ""}`} onClick={() => go("/bookmarks")}>
            <Bookmark size={17} />
            <span>Закладки</span>
          </button>
          <button
            className="lx-icon"
            aria-label={light ? "Тёмная тема" : "Светлая тема"}
            onClick={() => update({ theme: light ? "dark" : "light" })}
          >
            {light ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <Notifications />
          <button className="lx-avatar" aria-label="Профиль" onClick={() => go("/profile")}>
            {state.profile.avatar ? <img src={state.profile.avatar} alt="" /> : state.profile.name[0]}
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNav({ path }) {
  const { state, update } = useStore();
  const [menu, setMenu] = useState(false);
  const light = state.theme === "light";
  const ids = Object.keys(state.bookmarks || {});
  const items = [
    ["/catalog", "Каталог", LayoutGrid],
    ["/bookmarks", "Закладки", Bookmark],
  ];
  const links = [
    ["/top", "Топы"],
    ["/audio", "Аудиокниги"],
    ["/library", "Мои полки"],
    ["/profile", "Профиль"],
    ["/integrations", "Импорт и экспорт"],
  ];
  return (
    <>
      <nav className="lx-mobile-nav" aria-label="Навигация">
        {items.map(([u, l, I]) => (
          <button key={u} className={path.startsWith(u) ? "active" : ""} onClick={() => go(u)}>
            <I size={21} />
            <span>{l}</span>
          </button>
        ))}
        <button className={`lx-mnav-home ${path === "/" ? "active" : ""}`} aria-label="Главная" onClick={() => go("/")}>
          <BrandArt mark />
        </button>
        <button className={path.startsWith("/notifications") ? "active" : ""} onClick={() => go("/notifications")}>
          <Bell size={21} />
          {ids.length > 0 && <i className="lx-dot lx-dot-nav" />}
          <span>Уведомления</span>
        </button>
        <button className={menu ? "active" : ""} aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <Menu size={21} />
          <span>Меню</span>
        </button>
      </nav>
      {menu && (
        <div className="lx-sheet-wrap" onClick={() => setMenu(false)}>
          <div className="lx-sheet" role="dialog" aria-label="Меню" onClick={(e) => e.stopPropagation()}>
            <div className="lx-sheet-head">
              <button className="lx-sheet-profile" onClick={() => (setMenu(false), go("/profile"))}>
                <span className="lx-avatar">{state.profile.avatar ? <img src={state.profile.avatar} alt="" /> : state.profile.name[0]}</span>
                <strong>{state.profile.name}</strong>
              </button>
              <button className="lx-icon" aria-label="Закрыть меню" onClick={() => setMenu(false)}>
                <X size={20} />
              </button>
            </div>
            {links.map(([u, l]) => (
              <button key={u} className="lx-sheet-link" onClick={() => (setMenu(false), go(u))}>
                {l}
              </button>
            ))}
            <button className="lx-sheet-link" onClick={() => update({ theme: light ? "dark" : "light" })}>
              {light ? <Moon size={18} /> : <Sun size={18} />} {light ? "Тёмная тема" : "Светлая тема"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
