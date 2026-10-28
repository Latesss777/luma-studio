import React from "react";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Plus,
  Star,
  BookOpen,
  Headphones,
  PanelsTopLeft,
  ScrollText,
  Sparkles,
  Compass,
  Heart,
  Orbit,
  Search,
  Skull,
} from "lucide-react";
import { cover, findBook } from "../data/books";
import { trailers, trailerEmbed } from "../data/trailers";
import { go, useStore } from "./store";
export const formatIcons = [BookOpen, PanelsTopLeft, ScrollText, Headphones];
export const genreIcons = [Sparkles, Search, Heart, Orbit, Skull, Compass];
export function Scene({ name, className = "", label }) {
  return (
    <picture
      className={`scene ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <source
        media="(max-width: 600px)"
        srcSet={`/assets/backgrounds/${name}-mobile.jpg`}
      />
      <img
        src={`/assets/backgrounds/${name}-desktop.jpg`}
        alt=""
        width="1672"
        height="941"
        decoding="async"
        fetchPriority={name === "auth" ? "high" : "auto"}
      />
    </picture>
  );
}
// The original 1254×1254 PNG stays intact. CSS crops only its empty canvas.
export function BrandArt({ mark = false }) {
  return (
    <span
      className={`brand-art ${mark ? "brand-mark" : ""}`}
      aria-hidden="true"
    >
      <img
        src="/assets/brand/luma-original.png"
        alt=""
        width="1254"
        height="1254"
      />
    </span>
  );
}
export function Brand({ large = false }) {
  return (
    <div
      className={`brand ${large ? "large" : ""}`}
      role="img"
      aria-label="Luma Studios"
    >
      <span className="brand-studios">Studios</span>
      <BrandArt />
    </div>
  );
}
export function Button({
  children,
  icon: Icon,
  secondary = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${secondary ? "secondary" : ""} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}
export function IconButton({ label, icon: Icon, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      <Icon size={21} aria-hidden="true" />
    </button>
  );
}
export function Back({ to = "/", label = "Назад" }) {
  return (
    <button className="back" onClick={() => go(to)}>
      <ArrowLeft size={19} aria-hidden="true" />
      {label}
    </button>
  );
}
export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
export function Cover({ book, ...props }) {
  return (
    <img
      className="cover"
      src={cover(book)}
      alt={`Обложка: ${book.original}`}
      width="1400"
      height="2100"
      decoding="async"
      {...props}
    />
  );
}
// Превью при наведении: короткий собственный ролик (12 с, без звука), только на устройствах с мышью.
function PosterPreview({ id }) {
  const [broken, setBroken] = React.useState(false);
  if (broken) return null;
  return (
    <video
      className="poster-preview"
      src={`/assets/previews/${id}.mp4`}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-hidden="true"
      onError={() => setBroken(true)}
    />
  );
}
export function Card({ book, selectable = false, selected = false, onSelect }) {
  const [hover, setHover] = React.useState(false);
  const canHover =
    typeof matchMedia === "function" &&
    matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <article className="book-card">
      <button
        className="poster-button"
        onPointerEnter={() => canHover && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => canHover && setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() =>
          selectable ? onSelect(book.id) : go("/title/" + book.id)
        }
        aria-label={
          selectable
            ? `${selected ? "Отменить выбор" : "Выбрать"}: ${book.title}`
            : `Открыть: ${book.title}`
        }
        aria-pressed={selectable ? selected : undefined}
      >
        <Cover book={book} />
        {hover && <PosterPreview id={book.id} />}
        {selectable && (
          <span className="selection">
            {selected ? <Check size={18} /> : <Plus size={18} />}
          </span>
        )}
      </button>
      <button
        className="card-title"
        onClick={() =>
          selectable ? onSelect(book.id) : go("/title/" + book.id)
        }
      >
        {book.title}
      </button>
      <p>{book.author}</p>
      <small>English · {book.id === "alice" ? "Текст и аудио" : "Текст"}</small>
    </article>
  );
}
export function Empty({ title = "Пока ничего нет", text, children }) {
  return (
    <div className="empty">
      <BookOpen size={30} strokeWidth={1.2} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Название или автор",
  label = "Поиск произведений",
}) {
  return (
    <div className="search-field">
      <Search size={18} aria-hidden="true" />
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
      />
    </div>
  );
}
export function Tags({ book }) {
  return (
    <div className="tags">
      <button
        style={{ "--tag": book.color }}
        onClick={() => go("/catalog?genre=" + encodeURIComponent(book.genre))}
      >
        {book.genre}
      </button>
      <span>English</span>
    </div>
  );
}
export function Rating({ id }) {
  const { state } = useStore();
  const rs = state.reviews[id] || [];
  return (
    <span className="rating">
      <Star
        size={16}
        fill={rs.length ? "#e6c563" : "none"}
        stroke={rs.length ? "#e6c563" : "currentColor"}
      />
      {rs.length
        ? `${(rs.reduce((a, r) => a + r.score, 0) / rs.length).toFixed(1)} / 10 · ваши отзывы`
        : "Пока без оценок"}
    </span>
  );
}
export function ShelfPicker({ id }) {
  const { state, update, setToast } = useStore();
  return (
    <label className="inline-select">
      На полку
      <select
        aria-label="Добавить на полку"
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          update((s) => ({
            shelves: s.shelves.map((sh) =>
              sh.id === e.target.value
                ? { ...sh, books: [...new Set([...sh.books, id])] }
                : sh,
            ),
            library: [...new Set([...s.library, id])],
            archive: s.archive.filter((x) => x !== id),
          }));
          setToast("Произведение добавлено на полку");
        }}
      >
        <option value="">Выбрать полку</option>
        {state.shelves.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {!state.shelves.length && (
        <button className="text-link" onClick={() => go("/library")}>
          Создать полку
        </button>
      )}
    </label>
  );
}
export function Trailer({ id }) {
  const t = trailers[id];
  const embed = t && trailerEmbed(t.url);
  if (!embed) return null;
  return (
    <section className="trailer">
      <div className="section-head">
        <h2>Трейлер</h2>
        <span className="muted">{t.kind}</span>
      </div>
      <div className="trailer-frame">
        <iframe
          src={embed}
          title={`Трейлер: ${t.title}`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  );
}
export function Community({ id }) {
  const { state, update, setToast } = useStore();
  const [note, setNote] = React.useState(state.notes[id] || "");
  const [review, setReview] = React.useState("");
  const [score, setScore] = React.useState(8);
  return (
    <div className="community">
      <section>
        <h2>Мои заметки</h2>
        <textarea
          aria-label="Текст заметки"
          dir="ltr"
          placeholder="Что хочется запомнить?"
          value={note}
          maxLength={4000}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          secondary
          onClick={() => {
            update((s) => ({ notes: { ...s.notes, [id]: note } }));
            setToast("Заметка сохранена на этом устройстве");
          }}
        >
          Сохранить заметку
        </Button>
      </section>
      <section>
        <h2>Отзывы</h2>
        {(state.reviews[id] || []).map((r) => (
          <blockquote key={r.id} dir="ltr">
            <span className="rating">
              <Star size={15} fill="#e6c563" stroke="#e6c563" />
              {r.score} / 10
            </span>
            <p>{r.text}</p>
            <small>{state.profile.name} · локальный отзыв</small>
          </blockquote>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!review.trim()) return;
            update((s) => ({
              reviews: {
                ...s.reviews,
                [id]: [
                  ...(s.reviews[id] || []),
                  {
                    id: crypto.randomUUID(),
                    text: review.trim(),
                    score: Number(score),
                  },
                ],
              },
            }));
            setReview("");
            setToast("Отзыв сохранён на этом устройстве");
          }}
        >
          <textarea
            aria-label="Текст отзыва"
            dir="ltr"
            placeholder="Поделись впечатлением"
            required
            maxLength={2000}
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
          <div className="row">
            <label>
              Оценка{" "}
              <select
                aria-label="Оценка"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} / 10
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" secondary>
              Сохранить отзыв
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
