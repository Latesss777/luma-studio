import React, { useState } from "react";
import {
  BookOpen,
  Headphones,
  Plus,
  Check,
  ChevronRight,
  Archive,
  ArrowUpRight,
} from "lucide-react";
import { findBook, books, authorBio } from "../data/books";
import chapters from "../data/chapters.json";
import { go, useStore } from "../shared/store";
import {
  Back,
  Button,
  Cover,
  Tags,
  Rating,
  Community,
  Trailer,
  ShelfPicker,
  Card,
  PageHead,
} from "../shared/ui";
export default function Title({ id }) {
  const b = findBook(id);
  const { state, addLibrary, update, setToast } = useStore();
  const [tab, setTab] = useState("Главы");
  const list = chapters[b.id] || [];
  return (
    <>
      <Back to="/catalog" label="К историям" />
      <section className="title-overview">
        <div className="title-cover">
          <Cover book={b} />
        </div>
        <div className="title-info">
          <p className="muted">{b.year} · Оригинальное издание на английском</p>
          <h1>{b.title}</h1>
          <p className="original-title">{b.original}</p>
          <button
            className="author-link"
            onClick={() => go("/author/" + b.authorId)}
          >
            {b.author}
            <ArrowUpRight size={17} />
          </button>
          <Rating id={b.id} />
          <Tags book={b} />
          <p className="description">{b.description}</p>
          <div className="title-actions">
            <Button
              icon={BookOpen}
              onClick={() => {
                addLibrary(b.id);
                go("/reader/" + b.id);
              }}
            >
              {state.progress[b.id] ? "Продолжить" : "Читать"}
            </Button>
            {b.id === "alice" && (
              <Button
                secondary
                icon={Headphones}
                onClick={() => go("/audio/alice")}
              >
                Слушать
              </Button>
            )}
            <Button
              secondary
              icon={state.library.includes(b.id) ? Check : Plus}
              onClick={() => {
                addLibrary(b.id);
                setToast("В твоей библиотеке");
              }}
            >
              {state.library.includes(b.id) ? "В библиотеке" : "В библиотеку"}
            </Button>
          </div>
          <ShelfPicker id={b.id} />
        </div>
      </section>
      <div className="title-body">
        <Trailer id={b.id} />
        <div className="tabs" role="tablist" aria-label="О произведении">
          {[
            "Главы",
            "Герои",
            ...(state.settings.community ? ["Заметки и отзывы"] : []),
          ].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Главы" ? (
          <section>
            <div className="section-head">
              <h2>Главы</h2>
              <span className="muted">{list.length} доступно · English</span>
            </div>
            <div className="chapters">
              {list.map((c, i) => (
                <button
                  key={i}
                  className="chapter-row"
                  onClick={() => {
                    addLibrary(b.id);
                    go(`/reader/${b.id}?chapter=${i}`);
                  }}
                >
                  <span className="chapter-indicator">
                    {state.progress[b.id]?.chapter > i ? (
                      <Check size={15} />
                    ) : (
                      <BookOpen size={15} />
                    )}
                  </span>
                  <span className="chapter-no">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    {c.title.replace(/^CHAPTER\s+[IVXLC]+\.\s*/i, "")}
                  </span>
                  <small>EN</small>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
            <p className="muted small">
              Подключены настоящие главы из открытого издания. Полное издание:{" "}
              <a
                href={`https://standardebooks.org/ebooks/${{ alice: "lewis-carroll/alices-adventures-in-wonderland/john-tenniel", pride: "jane-austen/pride-and-prejudice", sherlock: "arthur-conan-doyle/the-adventures-of-sherlock-holmes", moby: "herman-melville/moby-dick", dracula: "bram-stoker/dracula", frankenstein: "mary-shelley/frankenstein" }[b.id]}`}
                target="_blank"
                rel="noreferrer"
              >
                Standard Ebooks
              </a>
              .
            </p>
          </section>
        ) : tab === "Герои" ? (
          <section>
            <h2>В этой истории</h2>
            <div className="characters">
              {b.characters.map((c, i) => (
                <div key={c}>
                  <span>{c[0]}</span>
                  <h3>{c}</h3>
                  <p className="muted">Персонаж произведения</p>
                </div>
              ))}
            </div>
            <button
              className="text-link"
              onClick={() => go("/author/" + b.authorId)}
            >
              Другие работы автора <ArrowUpRight size={16} />
            </button>
          </section>
        ) : (
          state.settings.community && <Community key={b.id} id={b.id} />
        )}
      </div>
    </>
  );
}
export function Author({ id }) {
  const b = books.find((b) => b.authorId === id) || books[0];
  return (
    <>
      <Back to={"/title/" + b.id} />
      <div className="author-intro">
        <span className="author-monogram">
          {b.author
            .split(" ")
            .map((w) => w[0])
            .join("")}
        </span>
        <PageHead title={b.author} sub={authorBio[b.authorId]} />
      </div>
      <h2>В доступном каталоге</h2>
      <div className="book-grid">
        {books
          .filter((x) => x.authorId === id)
          .map((x) => (
            <Card key={x.id} book={x} />
          ))}
      </div>
    </>
  );
}
