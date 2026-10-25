import React, { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { books, genres, formats } from "../data/books";
import { PageHead, SearchField, Card, Empty, Button } from "../shared/ui";
import { useStore } from "../shared/store";
export default function Catalog({ query = "" }) {
  const { state } = useStore();
  const params = new URLSearchParams(query);
  const [q, setQ] = useState("");
  const [format, setFormat] = useState("Все форматы");
  const [genre, setGenre] = useState(params.get("genre") || "Все жанры");
  const [sort, setSort] = useState("Для тебя");
  const [open, setOpen] = useState(false);
  const reset = () => {
    setQ("");
    setFormat("Все форматы");
    setGenre("Все жанры");
    setSort("Для тебя");
  };
  const filtered = books
    .filter(
      (b) =>
        (b.title + " " + b.author + " " + b.original)
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (genre === "Все жанры" || b.genre === genre) &&
        (format === "Все форматы" ||
          format === "Книги" ||
          (format === "Аудиокниги" && b.id === "alice")),
    )
    .sort((a, b) =>
      sort === "По названию"
        ? a.title.localeCompare(b.title, "ru")
        : sort === "Сначала новые"
          ? b.year - a.year
          : state.genres.includes(b.genre) - state.genres.includes(a.genre),
    );
  return (
    <>
      <PageHead
        title="Найди свою историю"
        sub="Шесть книг, к которым возвращаются."
      />
      <div className="catalog-layout">
        <aside className={`filters ${open ? "expanded" : ""}`}>
          <button
            className="mobile-filter-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <SlidersHorizontal size={18} />
            Фильтры
          </button>
          <div className="filter-body">
            <h3>Формат</h3>
            {["Все форматы", ...formats].map((f) => (
              <label className="radio-row" key={f}>
                <input
                  type="radio"
                  name="format"
                  checked={format === f}
                  onChange={() => setFormat(f)}
                />
                {f}
              </label>
            ))}
            <h3>Жанр</h3>
            {["Все жанры", ...genres].map((g) => (
              <label className="radio-row" key={g}>
                <input
                  type="radio"
                  name="genre"
                  checked={genre === g}
                  onChange={() => setGenre(g)}
                />
                {g}
              </label>
            ))}
            <button className="text-link" onClick={reset}>
              <RotateCcw size={15} />
              Сбросить фильтры
            </button>
          </div>
        </aside>
        <section className="catalog-results">
          <div className="catalog-toolbar">
            <SearchField value={q} onChange={setQ} />
            <select
              aria-label="Сортировка"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>Для тебя</option>
              <option>По названию</option>
              <option>Сначала новые</option>
            </select>
          </div>
          {state.language === "ru" && (
            <p className="language-notice">
              Русских изданий пока нет. Показываем доступные оригиналы на
              английском.
            </p>
          )}
          <p className="muted result-count">Найдено: {filtered.length}</p>
          {filtered.length ? (
            <div className="book-grid">
              {filtered.map((b) => (
                <Card book={b} key={b.id} />
              ))}
            </div>
          ) : (
            <Empty
              title="История ещё не нашлась"
              text="Попробуй другое название, автора или убери фильтры."
            >
              <Button secondary onClick={reset}>
                Сбросить фильтры
              </Button>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
