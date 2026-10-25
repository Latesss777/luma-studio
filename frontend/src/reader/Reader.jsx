import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Minus,
  Plus,
  List,
  Maximize,
  BookOpen,
} from "lucide-react";
import chapters from "../data/chapters.json";
import { findBook } from "../data/books";
import { go, useStore } from "../shared/store";
import { Button, IconButton } from "../shared/ui";
const panels = [
  { x: 40, y: 40, w: 920, h: 630 },
  { x: 40, y: 710, w: 440, h: 650 },
  { x: 520, y: 710, w: 440, h: 650 },
];
function Illustrations() {
  const vp = useRef(null);
  const [box, setBox] = useState({ w: 400, h: 650 });
  const [frame, setFrame] = useState(-1);
  const [rtl, setRtl] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  useEffect(() => {
    const ob = new ResizeObserver(([e]) =>
      setBox({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ob.observe(vp.current);
    return () => ob.disconnect();
  }, []);
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [frame]);
  const p =
    frame < 0
      ? { x: 0, y: 0, w: 1000, h: 1400 }
      : panels[rtl ? 2 - frame : frame];
  const s = Math.min((box.w - 20) / p.w, (box.h - 20) / p.h) * zoom;
  const x = (box.w - p.w * s) / 2 - p.x * s + pan.x;
  const y = (box.h - p.h * s) / 2 - p.y * s + pan.y;
  return (
    <section className="illustration-reader">
      <p className="language-notice">
        Демонстрационный лист из оригинальных иллюстраций Джона Тенниела.
        Области размечены вручную; автоматического распознавания нет.
      </p>
      <div className="illustration-tools">
        <select
          aria-label="Направление чтения"
          value={rtl ? "rtl" : "ltr"}
          onChange={(e) => {
            setRtl(e.target.value === "rtl");
            setFrame(-1);
          }}
        >
          <option value="ltr">Слева направо</option>
          <option value="rtl">Справа налево</option>
        </select>
        <IconButton
          label="Уменьшить страницу"
          icon={Minus}
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
        />
        <span>{Math.round(zoom * 100)}%</span>
        <IconButton
          label="Увеличить страницу"
          icon={Plus}
          onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
        />
        <IconButton
          label="Вся страница"
          icon={Maximize}
          onClick={() => {
            setFrame(-1);
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        />
      </div>
      <div
        className="illustration-viewport"
        ref={vp}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, pan };
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setPan({
              x: drag.current.pan.x + e.clientX - drag.current.x,
              y: drag.current.pan.y + e.clientY - drag.current.y,
            });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div
          className="illustrated-page"
          style={{ transform: `translate(${x}px,${y}px) scale(${s})` }}
        >
          {panels.map((p, i) => (
            <div
              key={i}
              className="illustrated-panel"
              style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
            >
              <img
                draggable={false}
                src={`/assets/illustration-${i + 2}.svg`}
                alt={
                  [
                    "Белый Кролик с часами",
                    "Алиса исследует Страну чудес",
                    "Иллюстрация Джона Тенниела",
                  ][i]
                }
              />
            </div>
          ))}
        </div>
      </div>
      <div className="reader-pagination">
        <Button
          secondary
          disabled={frame < 0}
          onClick={() => setFrame((f) => f - 1)}
        >
          Назад
        </Button>
        <span>{frame < 0 ? "Вся страница" : `Область ${frame + 1} / 3`}</span>
        <Button
          secondary
          onClick={() => setFrame((f) => (f >= 2 ? -1 : f + 1))}
        >
          {frame === 2 ? "Вся страница" : "Следующий кадр"}
        </Button>
      </div>
    </section>
  );
}
export default function Reader({ id, query = "" }) {
  const b = findBook(id);
  const { state, update, addLibrary, event } = useStore();
  const list = chapters[b.id] || [];
  const requested = new URLSearchParams(query).get("chapter");
  const [ch, setCh] = useState(() =>
    Math.min(
      list.length - 1,
      Math.max(
        0,
        requested === null
          ? state.progress[b.id]?.chapter || 0
          : Number(requested) || 0,
      ),
    ),
  );
  const [page, setPage] = useState(
    requested === null ? state.progress[b.id]?.page || 0 : 0,
  );
  const [font, setFont] = useState(21);
  const [light, setLight] = useState(false);
  const [toc, setToc] = useState(false);
  const [mode, setMode] = useState("text");
  const pages = useMemo(() => {
    const out = [];
    let current = [];
    let len = 0;
    for (const p of list[ch]?.paragraphs || []) {
      if (len > 1500) {
        out.push(current);
        current = [];
        len = 0;
      }
      current.push(p);
      len += p.length;
    }
    if (current.length) out.push(current);
    return out.length ? out : [["В этой главе нет доступного текста."]];
  }, [ch, b.id]);
  const actual = Math.min(page, pages.length - 1);
  useEffect(() => {
    addLibrary(b.id);
  }, [b.id]);
  useEffect(() => {
    const percent = Math.round(
      ((ch + (actual + 1) / pages.length) / list.length) * 100,
    );
    update((s) => ({
      progress: {
        ...s.progress,
        [b.id]: { chapter: ch, page: actual, percent },
      },
    }));
    event("reading", b.id, { chapter: ch, page: actual });
    window.scrollTo(0, 0);
  }, [b.id, ch, actual]);
  const next = () => {
    if (actual < pages.length - 1) setPage(actual + 1);
    else if (ch < list.length - 1) {
      setCh(ch + 1);
      setPage(0);
    }
  };
  const previous = () => {
    if (actual > 0) setPage(actual - 1);
    else if (ch > 0) {
      setCh(ch - 1);
      setPage(0);
    }
  };
  return (
    <main className={`reader-screen ${light ? "reader-light" : ""}`}>
      <header className="reader-header">
        <IconButton
          label="Закрыть читалку"
          icon={ArrowLeft}
          onClick={() => go("/title/" + b.id)}
        />
        <div>
          <strong>{b.title}</strong>
          <small>English · {list[ch]?.title}</small>
        </div>
        <IconButton
          label="Оглавление"
          icon={List}
          onClick={() => setToc(!toc)}
        />
        <IconButton
          label={light ? "Тёмная тема читалки" : "Светлая тема читалки"}
          icon={light ? Moon : Sun}
          onClick={() => setLight(!light)}
        />
      </header>
      <div className="reader-tools">
        <div className="segmented">
          <button
            className={mode === "text" ? "active" : ""}
            onClick={() => setMode("text")}
          >
            Текст
          </button>
          {b.id === "alice" && (
            <button
              className={mode === "art" ? "active" : ""}
              onClick={() => setMode("art")}
            >
              Иллюстрации
            </button>
          )}
        </div>
        {mode === "text" && (
          <div className="row">
            <IconButton
              label="Уменьшить шрифт"
              icon={Minus}
              disabled={font <= 16}
              onClick={() => setFont((f) => Math.max(16, f - 1))}
            />
            <span>{font}</span>
            <IconButton
              label="Увеличить шрифт"
              icon={Plus}
              disabled={font >= 32}
              onClick={() => setFont((f) => Math.min(32, f + 1))}
            />
          </div>
        )}
      </div>
      {toc && (
        <nav className="reader-toc" aria-label="Оглавление книги">
          {list.map((c, i) => (
            <button
              className={ch === i ? "active" : ""}
              key={i}
              onClick={() => {
                setCh(i);
                setPage(0);
                setToc(false);
              }}
            >
              {i + 1}. {c.title}
            </button>
          ))}
        </nav>
      )}
      {mode === "art" ? (
        <Illustrations />
      ) : (
        <>
          <article
            className="reading-page"
            style={{ fontSize: font }}
            lang="en"
          >
            <div className="reading-meta">
              {b.author} / Standard Ebooks · English
            </div>
            <h1>{list[ch]?.title}</h1>
            {pages[actual].map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <footer className="reader-pagination">
            <Button
              secondary
              icon={ChevronLeft}
              disabled={ch === 0 && actual === 0}
              onClick={previous}
            >
              Назад
            </Button>
            <span>
              {actual + 1} / {pages.length}
              <small>
                Глава {ch + 1} из {list.length}
              </small>
            </span>
            <Button
              secondary
              icon={ChevronRight}
              disabled={ch === list.length - 1 && actual === pages.length - 1}
              onClick={next}
            >
              Дальше
            </Button>
          </footer>
        </>
      )}
    </main>
  );
}
