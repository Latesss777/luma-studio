import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  BookOpen,
  Headphones,
} from "lucide-react";
import { books, findBook } from "../data/books";
import { go, useStore } from "../shared/store";
import { Cover, IconButton, Button, Tags } from "../shared/ui";
export default function Home() {
  const { state } = useStore();
  const [index, setIndex] = useState(0);
  const start = useRef(null);
  const prev = useRef(0);
  const b = books[index];
  const move = (n) => setIndex((i) => (i + n + books.length) % books.length);
  useEffect(() => {
    const key = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    prev.current = index;
  }, [index]);
  let continuing = Object.keys(state.progress).filter((id) =>
    state.library.includes(id),
  );
  return (
    <div className="home">
      <div className="home-heading">
        <h1>Для тебя</h1>
        <span className="muted">История найдётся.</span>
        <button className="text-link" onClick={() => go("/catalog")}>
          Весь каталог <ArrowUpRight size={16} />
        </button>
      </div>
      <section
        className="hero-carousel"
        aria-label="Подборка произведений"
        aria-roledescription="карусель"
        tabIndex={0}
        onTouchStart={(e) => (start.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (start.current !== null) {
            const d = e.changedTouches[0].clientX - start.current;
            if (Math.abs(d) > 35) move(d > 0 ? -1 : 1);
            start.current = null;
          }
        }}
      >
        <div
          className="stage-backdrop"
          style={{ backgroundImage: `url(/assets/${b.id}.jpg)` }}
        />
        <div className="poster-stage">
          {books.map((book, i) => {
            const offset = ((i - index + books.length + 3) % books.length) - 3;
            const old =
              ((i - prev.current + books.length + 3) % books.length) - 3;
            return (
              <button
                key={book.id}
                className={`carousel-poster ${offset === 0 ? "center" : ""} ${Math.abs(offset - old) > 1 ? "wrap" : ""}`}
                style={{
                  "--offset": offset,
                  "--distance": Math.abs(offset),
                  zIndex: 5 - Math.abs(offset),
                }}
                tabIndex={offset === 0 ? 0 : -1}
                aria-label={
                  offset === 0
                    ? `Открыть: ${book.title}`
                    : `Выбрать: ${book.title}`
                }
                aria-hidden={Math.abs(offset) > 2}
                onClick={() =>
                  offset === 0 ? go("/title/" + book.id) : setIndex(i)
                }
              >
                <Cover book={book} fetchPriority="high" />
              </button>
            );
          })}
        </div>
        <div className="carousel-caption">
          <div className="carousel-controls">
            <IconButton
              label="Предыдущее произведение"
              icon={ChevronLeft}
              onClick={() => move(-1)}
            />
            <span>
              {index + 1} <span className="muted">/ {books.length}</span>
            </span>
            <IconButton
              label="Следующее произведение"
              icon={ChevronRight}
              onClick={() => move(1)}
            />
          </div>
          <h2>{b.title}</h2>
          <p>{b.author}</p>
          <Tags book={b} />
          <Button icon={BookOpen} onClick={() => go("/title/" + b.id)}>
            Открыть историю
          </Button>
        </div>
      </section>
      <section className="continue-section">
        <div className="section-head">
          <h2>Продолжить</h2>
          <button className="text-link" onClick={() => go("/library")}>
            Моя библиотека <ChevronRight size={16} />
          </button>
        </div>
        {continuing.length ? (
          <div className="continue-list">
            {continuing.map((id) => {
              const book = findBook(id);
              const p = state.progress[id];
              return (
                <button
                  className="continue-card"
                  key={id}
                  onClick={() => go("/reader/" + id)}
                >
                  <Cover book={book} />
                  <div>
                    <small>English · Глава {p.chapter + 1}</small>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <div className="progress-line">
                      <i style={{ width: Math.max(5, p.percent || 0) + "%" }} />
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="start-reading">
            <BookOpen size={24} strokeWidth={1.3} />
            <p>Начни историю — и возвращайся сюда с того же места.</p>
            <button className="text-link" onClick={() => go("/title/alice")}>
              Выбрать книгу
            </button>
          </div>
        )}
      </section>
      <section className="curated-row">
        <div>
          <Headphones size={25} strokeWidth={1.3} />
          <h2>
            Та же история.
            <br />
            Другой голос.
          </h2>
          <p>Алиса в Стране чудес</p>
          <small className="muted">Английский · синтезированное чтение</small>
          <Button secondary onClick={() => go("/audio/alice")}>
            Слушать фрагмент
          </Button>
        </div>
        <button
          className="mini-poster"
          aria-label="Открыть аудио Алисы"
          onClick={() => go("/audio/alice")}
        >
          <Cover book={books[0]} />
        </button>
      </section>
    </div>
  );
}
