import React, { useState } from "react";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import { books, formats, genres } from "../data/books";
import { useStore } from "../shared/store";
import {
  Brand,
  Button,
  SearchField,
  Card,
  formatIcons,
  genreIcons,
} from "../shared/ui";
export default function Onboarding() {
  const { state, update } = useStore();
  const [step, setStep] = useState(0);
  const [q, setQ] = useState("");
  const [greet, setGreet] = useState(false);
  const toggle = (key, value) =>
    update((s) => ({
      [key]: s[key].includes(value)
        ? s[key].filter((v) => v !== value)
        : [...s[key], value],
    }));
  const finish = () => {
    setGreet(true);
    setTimeout(() => {
      update((s) => ({
        onboarded: true,
        library: [...new Set([...s.library, ...s.favorites])],
      }));
      location.hash = "/";
    }, 1900);
  };
  if (greet)
    return (
      <main className="greeting">
        <Brand large />
        <h1>Привет, {state.profile.name}</h1>
        <p>Твои истории уже рядом.</p>
      </main>
    );
  const titles = [
    "На каком языке тебе удобно?",
    "Как ты любишь истории?",
    "Что тебя увлекает?",
    "Есть любимые истории?",
    "Начни с интересного",
  ];
  return (
    <main className="onboarding">
      <header>
        <Brand />
        <button className="text-link" onClick={finish}>
          Настроить позже
        </button>
      </header>
      <div className="onboarding-content">
        <div className="steps" aria-label={`Шаг ${step + 1} из 5`}>
          {titles.map((_, i) => (
            <span key={i} className={i <= step ? "active" : ""} />
          ))}
        </div>
        <h1>{titles[step]}</h1>
        {step === 0 ? (
          <div className="language-options">
            {[
              ["ru", "Русский"],
              ["en", "English"],
            ].map(([v, t]) => (
              <button
                key={v}
                className={state.language === v ? "chosen" : ""}
                aria-pressed={state.language === v}
                onClick={() => update({ language: v })}
              >
                <span>{t}</span>
                {state.language === v && <Check size={20} />}
              </button>
            ))}
          </div>
        ) : step === 1 ? (
          <>
            <p className="muted">Можно выбрать несколько.</p>
            <div className="format-options">
              {formats.map((f, i) => {
                const Icon = formatIcons[i];
                return (
                  <button
                    key={f}
                    aria-pressed={state.formats.includes(f)}
                    className={state.formats.includes(f) ? "chosen" : ""}
                    onClick={() => toggle("formats", f)}
                  >
                    <Icon size={30} strokeWidth={1.3} />
                    <span>{f}</span>
                    {state.formats.includes(f) && <Check size={18} />}
                  </button>
                );
              })}
            </div>
          </>
        ) : step === 2 ? (
          <div className="genre-options">
            {genres.map((g, i) => {
              const Icon = genreIcons[i];
              return (
                <button
                  key={g}
                  aria-pressed={state.genres.includes(g)}
                  className={state.genres.includes(g) ? "chosen" : ""}
                  onClick={() => toggle("genres", g)}
                >
                  <Icon size={21} />
                  {g}
                  {state.genres.includes(g) && <Check size={16} />}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <p className="muted">
              {step === 3
                ? "Выбери то, к чему хочется возвращаться."
                : "Добавь в библиотеку или продолжи без выбора."}
            </p>
            {step === 3 && <SearchField value={q} onChange={setQ} />}
            <div className="onboard-books">
              {books
                .filter((b) =>
                  step === 4
                    ? state.genres.includes(b.genre) || b.id === "alice"
                    : (b.title + " " + b.author)
                        .toLowerCase()
                        .includes(q.toLowerCase()),
                )
                .map((b) => (
                  <Card
                    key={b.id}
                    book={b}
                    selectable
                    selected={state.favorites.includes(b.id)}
                    onSelect={(id) => toggle("favorites", id)}
                  />
                ))}
            </div>
            {step === 3 &&
              !books.some((b) =>
                (b.title + " " + b.author)
                  .toLowerCase()
                  .includes(q.toLowerCase()),
              ) && <p className="empty">Не нашли. Можно выбрать позже.</p>}
            <small className="muted">
              Издания на английском. Русский перевод пока не подключён.
            </small>
          </>
        )}
        <div className="onboarding-footer">
          {step > 0 ? (
            <button
              className="back"
              onClick={() => {
                setStep(step - 1);
                setQ("");
              }}
            >
              <ArrowLeft size={18} />
              Назад
            </button>
          ) : (
            <span />
          )}
          <div className="row">
            {step > 2 && (
              <button
                className="text-link"
                onClick={() => (step === 4 ? finish() : setStep(4))}
              >
                Пропустить
              </button>
            )}
            <Button
              icon={ArrowRight}
              onClick={() => {
                step === 4 ? finish() : setStep(step + 1);
                setQ("");
                window.scrollTo(0, 0);
              }}
            >
              {step === 4 ? "В библиотеку" : "Продолжить"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
