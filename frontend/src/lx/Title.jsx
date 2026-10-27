import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Star, ArrowDownUp, Eye, Check, Share2, Search, Heart } from "lucide-react";
import chapters from "../data/chapters.json";
import { all, findBook, cover } from "../data/books";
import { chapterList } from "../data/titles";
import { go, useStore } from "../shared/store";
import { Poster, BookmarkButton, Rail, TitleCard, num, ago, marks } from "./ui";
import Comments from "./Comments";

export const scoreColor = (r) => (r >= 8.5 ? "var(--lx-good)" : r >= 7 ? "var(--lx-mid)" : "var(--lx-bad)");

export function chaptersOf(t) {
  if (t.comic) return chapterList(t).map((c) => ({ ...c, vol: Math.floor((c.n - 1) / t.volumeSize) + 1 }));
  return (chapters[t.id] || []).map((c, i) => ({ n: i + 1, title: c.title, date: t.updated, vol: 1 }));
}

function RatePopover({ t }) {
  const { state, update, setToast } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const mine = state.ratings?.[t.id];
  useEffect(() => {
    if (!open) return;
    const f = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, [open]);
  return (
    <div className="lx-menu-wrap" ref={ref}>
      <button className="lx-rate-pill" aria-expanded={open} onClick={() => setOpen(!open)}>
        {mine ? `Ваша оценка ${mine}` : "Оценить"}
      </button>
      {open && (
        <div className="lx-pop lx-rate-pop" role="group" aria-label="Оценка">
          {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
            <button
              key={n}
              className={mine === n ? "active" : ""}
              onClick={() => {
                update((s) => ({ ratings: { ...(s.ratings || {}), [t.id]: n } }));
                setToast(`Ваша оценка: ${n}`);
                setOpen(false);
              }}
            >
              <Star size={14} fill="currentColor" strokeWidth={0} /> {n}
            </button>
          ))}
          {mine && (
            <button
              className="lx-rate-clear"
              onClick={() => {
                update((s) => {
                  const r = { ...(s.ratings || {}) };
                  delete r[t.id];
                  return { ratings: r };
                });
                setOpen(false);
              }}
            >
              Убрать оценку
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Stats({ t }) {
  const max = Math.max(...t.dist);
  const smax = Math.max(...t.shelfStats);
  const [more, setMore] = useState(false);
  const rows = more ? t.dist : t.dist.slice(0, 3);
  return (
    <section className="lx-tsection">
      <h3>Статистика</h3>
      <p className="lx-muted lx-small">
        {t.votes.toLocaleString("ru")} оценок · средняя {t.rating.toFixed(1)}
      </p>
      <div className="lx-stats">
        <div className="lx-bars">
          {rows.map((v, i) => (
            <div key={i} className="lx-bar-row">
              <span className="lx-bar-label">
                {10 - i} <Star size={12} fill="currentColor" strokeWidth={0} />
              </span>
              <span className="lx-bar"><i style={{ width: (v / max) * 100 + "%" }} /></span>
              <span className="lx-bar-val">{num(v)}</span>
            </div>
          ))}
        </div>
        <div className="lx-bars">
          {marks.slice(0, more ? 5 : 3).map(([k, l], i) => (
            <div key={k} className="lx-bar-row">
              <span className="lx-bar-label lx-bar-label-wide">{l}</span>
              <span className="lx-bar lx-bar-blue"><i style={{ width: (t.shelfStats[i] / smax) * 100 + "%" }} /></span>
              <span className="lx-bar-val">{num(t.shelfStats[i])}</span>
            </div>
          ))}
        </div>
      </div>
      <button className="lx-link lx-center" onClick={() => setMore(!more)}>
        {more ? "Свернуть" : "Больше"}
      </button>
    </section>
  );
}

function Main({ t }) {
  const [full, setFull] = useState(false);
  const [allTags, setAllTags] = useState(false);
  const related = all.filter((x) => x.id !== t.id && x.type === t.type && x.genres[0] === t.genres[0]).slice(0, 6);
  const tags = allTags ? t.tags : t.tags.slice(0, 6);
  return (
    <div className="lx-tmain">
      <div className={`lx-desc ${full ? "open" : ""}`}>
        <p>{t.description}</p>
        {full && !t.demo && (
          <p>
            Полный текст на английском из Standard Ebooks. Произведение перешло в общественное достояние, поэтому его можно
            читать здесь целиком. Русского издания пока нет.
          </p>
        )}
        {full && t.demo && <p>Это демо-тайтл Luma. Название, описание и обложка придуманы для показа интерфейса, главы состоят из демо-страниц.</p>}
      </div>
      <button className="lx-link" onClick={() => setFull(!full)}>
        {full ? "Свернуть" : "Подробнее"}
      </button>
      <div className="lx-hashtags">
        {t.genres.map((g) => (
          <button key={g} className="lx-hashtag lx-hashtag-genre" onClick={() => go("/catalog?genre=" + encodeURIComponent(g))}>
            {g}
          </button>
        ))}
        {tags.map((g) => (
          <button key={g} className="lx-hashtag" onClick={() => go("/catalog?tag=" + encodeURIComponent(g))}>
            #{g}
          </button>
        ))}
        {t.tags.length > 6 && (
          <button className="lx-link" onClick={() => setAllTags(!allTags)}>
            {allTags ? "меньше" : "больше"}
          </button>
        )}
      </div>
      <dl className="lx-info">
        <div><dt>Автор</dt><dd>{t.author}</dd></div>
        <div><dt>Выпуск</dt><dd>{t.year}</dd></div>
        <div><dt>Статус</dt><dd>{t.status}</dd></div>
        <div><dt>Возрастное ограничение</dt><dd>{t.age}</dd></div>
        {t.original !== t.title && <div><dt>Оригинальное название</dt><dd>{t.original}</dd></div>}
        {t.characters && <div><dt>Главные герои</dt><dd>{t.characters.join(", ")}</dd></div>}
      </dl>
      {related.length > 0 && <Rail id="related" title="Связанные произведения" items={related} />}
      <Stats t={t} />
      <Comments thread={t.id + ":title"} title="Комментарии под тайтлом" />
    </div>
  );
}

function Chapters({ t }) {
  const { state, update } = useStore();
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const read = state.readChapters?.[t.id] || [];
  const list = chaptersOf(t);
  const likes = state.chapterLikes || {};
  const rows = (asc ? list : [...list].reverse()).filter((c) => !q || String(c.n).includes(q.trim()));
  const toggleRead = (i) =>
    update((s) => {
      const cur = s.readChapters?.[t.id] || [];
      const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
      return { readChapters: { ...(s.readChapters || {}), [t.id]: next } };
    });
  return (
    <div className="lx-chlist">
      <div className="lx-chlist-tools">
        <label className="lx-chsearch">
          <Search size={16} aria-hidden="true" />
          <input id="lx-chsearch" type="search" inputMode="numeric" placeholder="Номер главы" aria-label="Найти главу по номеру" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <button className="lx-pill" onClick={() => setAsc(!asc)}>
          <ArrowDownUp size={16} />
          {asc ? "С первой" : "С последней"}
        </button>
      </div>
      <ul>
        {rows.map((c) => {
          const done = read.includes(c.n - 1);
          const liked = likes[`${t.id}:${c.n - 1}`];
          return (
            <li key={c.n} className={done ? "read" : ""}>
              <button className="lx-chrow" onClick={() => go(`/reader/${t.id}?chapter=${c.n - 1}`)}>
                <span className="lx-chvol">{c.vol}</span>
                <span className="lx-chtext">
                  <span className="lx-chname">
                    Глава {c.n}
                    {c.title ? ` — ${c.title}` : ""}
                  </span>
                  <small>{t.comic ? "Студия Luma (демо)" : "Standard Ebooks"}</small>
                </span>
                <small className="lx-chdate">{new Intl.DateTimeFormat("ru").format(c.date)}</small>
                {liked && <Heart size={15} className="lx-chliked" fill="currentColor" aria-label="Понравилась" />}
              </button>
              <button
                className={`lx-icon ${done ? "lx-icon-on" : ""}`}
                aria-label={done ? `Глава ${c.n}: снять отметку о прочтении` : `Глава ${c.n}: отметить прочитанной`}
                aria-pressed={done}
                onClick={() => toggleRead(c.n - 1)}
              >
                {done ? <Check size={17} /> : <Eye size={17} />}
              </button>
            </li>
          );
        })}
      </ul>
      {!rows.length && <p className="lx-comments-empty">Главы с номером «{q}» нет.</p>}
    </div>
  );
}

function Similar({ t }) {
  const list = useMemo(() => {
    const score = (x) => x.genres.filter((g) => t.genres.includes(g)).length * 2 + x.tags.filter((g) => t.tags.includes(g)).length + (x.type === t.type ? 1 : 0);
    return all
      .filter((x) => x.id !== t.id)
      .map((x) => [x, score(x)])
      .sort((a, b) => b[1] - a[1] || b[0].rating - a[0].rating)
      .slice(0, 6);
  }, [t.id]);
  return (
    <aside className="lx-similar" aria-label="Похожее">
      <h3>Похожее</h3>
      {list.map(([x, s]) => {
        const g = x.genres.filter((v) => t.genres.includes(v)).length;
        const tg = x.tags.filter((v) => t.tags.includes(v)).length;
        return (
          <button key={x.id} className="lx-sim" onClick={() => go("/title/" + x.id)}>
            <Poster t={x} className="lx-sim-cover" tag={false} />
            <span>
              <strong>{x.title}</strong>
              <small>{g && tg ? "Похож по жанрам и тегам" : g ? "Похож по жанрам" : tg ? "Похож по тегам" : `Тоже ${x.type.toLowerCase()}`}</small>
              <small>Совпадений: {s}</small>
            </span>
          </button>
        );
      })}
    </aside>
  );
}

export default function Title({ id, query }) {
  const t = findBook(id);
  const { state, setToast } = useStore();
  const tab = new URLSearchParams(query).get("tab") || "main";
  const setTab = (k) => go(`/title/${t.id}${k === "main" ? "" : "?tab=" + k}`);
  const p = state.progress?.[t.id];
  const talk = (state.comments?.[t.id + ":title"] || []).length;
  const tabs = [
    ["main", "Главная"],
    ["chapters", `Главы (${t.chapterCount})`],
    ["talk", `Обсуждения (${talk})`],
  ];
  const share = async () => {
    const url = location.href.split("#")[0] + "#/title/" + t.id;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Ссылка на тайтл скопирована");
    } catch {
      setToast("Скопируйте ссылку из адресной строки");
    }
  };
  return (
    <div className="lx-title2">
      <div className="lx-tbanner" aria-hidden="true" style={{ backgroundImage: `url("${cover(t)}")` }} />
      <div className="lx-page lx-tgrid">
        <aside className="lx-tside">
          <Poster t={t} className="lx-tcover" />
          <button className="lx-btn lx-btn-read" onClick={() => go(`/reader/${t.id}${p ? "" : "?chapter=0"}`)}>
            <BookOpen size={18} />
            {p ? `Продолжить · гл. ${(p.chapter || 0) + 1}` : "Читать"}
          </button>
          <BookmarkButton id={t.id} />
          <button className="lx-btn lx-btn-flat" onClick={share}>
            <Share2 size={16} /> Поделиться
          </button>
          {t.id === "alice" && (
            <button className="lx-btn lx-btn-flat" onClick={() => go("/audio")}>
              Слушать аудиокнигу
            </button>
          )}
        </aside>
        <div className="lx-tbody">
          <div className="lx-thead">
            <div>
              <div className="lx-tmeta">
                <button onClick={() => go("/catalog?type=" + encodeURIComponent(t.type))}>{t.type}</button>
                <span>·</span>
                <button onClick={() => go("/catalog?from=" + t.year)}>{t.year}</button>
                {t.demo && <span className="lx-demo-inline">демо</span>}
              </div>
              <h1>{t.title}</h1>
              <div className="lx-tcounts">
                <span>Лайков: {num(t.likes)}</span>
                <span>Просмотров: {num(t.views)}</span>
                <span>Закладок: {num(t.bookmarks)}</span>
              </div>
            </div>
            <div className="lx-tscore">
              <strong style={{ color: scoreColor(t.rating) }}>{t.rating.toFixed(1)}</strong>
              <small>{t.votes.toLocaleString("ru")} голосов</small>
              <RatePopover t={t} />
            </div>
          </div>
          <div className="lx-ptabs" role="tablist">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="lx-tcols">
            <div className="lx-tcontent">
              {tab === "main" && <Main t={t} />}
              {tab === "chapters" && <Chapters t={t} />}
              {tab === "talk" && <Comments thread={t.id + ":title"} title="Обсуждения" />}
            </div>
            <Similar t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
