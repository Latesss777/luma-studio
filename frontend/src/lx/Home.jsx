import React, { useMemo, useState } from "react";
import { all, books, findBook } from "../data/books";
import { go, useStore } from "../shared/store";
import { Rail, TitleCard, Row, Poster, Score, ago } from "./ui";

const by = (k) => [...all].sort((a, b) => b[k] - a[k]);

const collections = [
  { id: "classic", name: "Классика, которую можно читать здесь", sub: "Книги целиком или первыми главами", pick: (t) => t.type === "Книга" },
  { id: "short", name: "Прочитать за вечер", sub: "До 30 глав", pick: (t) => t.comic && t.chapterCount <= 30 },
  { id: "cozy", name: "Тёплая повседневность", sub: "Без спешки и злодеев", pick: (t) => t.genres.some((g) => ["Повседневность", "Комедия"].includes(g)) },
  { id: "done", name: "Уже завершены", sub: "Можно читать до конца", pick: (t) => t.status === "Завершён" },
  { id: "mystery", name: "Загадки и тайны", sub: "Детективы, мистика, триллеры", pick: (t) => t.genres.some((g) => ["Детектив", "Мистика", "Триллер", "Готика"].includes(g)) },
];

function Collection({ c }) {
  const items = all.filter(c.pick).sort((a, b) => b.rating - a.rating);
  return (
    <button className="lx-collection" onClick={() => go("/catalog?collection=" + c.id)}>
      <span className="lx-collection-fan">
        {items.slice(0, 3).map((t, i) => (
          <Poster key={t.id} t={t} className={`lx-fan-${i}`} />
        ))}
      </span>
      <strong>{c.name}</strong>
      <small>
        {c.sub} · {items.length}
      </small>
    </button>
  );
}

function Columns() {
  const cols = [
    ["Новый сезон", all.filter((t) => t.year >= 2026).sort((a, b) => b.rating - a.rating)],
    ["В тренде", by("views")],
    ["Популярно сегодня", by("likes")],
  ];
  return (
    <section className="lx-section lx-columns" aria-label="Подборки">
      {cols.map(([name, list]) => (
        <div key={name} className="lx-column">
          <div className="lx-section-head">
            <h2>{name}</h2>
          </div>
          <div className="lx-column-list">
            {list.slice(0, 5).map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function TopTitles() {
  const tabs = ["Манхва", "Манга", "Маньхуа", "Книга"];
  const [tab, setTab] = useState(tabs[0]);
  const list = all.filter((t) => t.type === tab).sort((a, b) => b.rating - a.rating);
  return (
    <Rail
      id="top"
      title="Топ тайтлов"
      more={"/top?type=" + encodeURIComponent(tab)}
      items={list}
      render={(t, i) => <TitleCard key={t.id} t={t} rank={i + 1} />}
    >
      <div className="lx-chips" role="tablist" aria-label="Тип">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "Книга" ? "Книги" : t}
          </button>
        ))}
      </div>
    </Rail>
  );
}

function Updates() {
  const [n, setN] = useState(8);
  const list = all.filter((t) => t.comic).sort((a, b) => b.updated - a.updated);
  return (
    <section className="lx-section" aria-labelledby="upd">
      <div className="lx-section-head">
        <h2 id="upd">Последние обновления</h2>
      </div>
      <div className="lx-updates">
        {list.slice(0, n).map((t) => (
          <div key={t.id} className="lx-update">
            <button className="lx-update-cover" onClick={() => go("/title/" + t.id)} aria-label={t.title}>
              <Poster t={t} />
            </button>
            <div className="lx-update-text">
              <button className="lx-link-strong" onClick={() => go("/title/" + t.id)}>
                {t.title}
              </button>
              <small>
                {t.type} · {t.genres.join(", ")}
              </small>
              <div className="lx-update-chapters">
                {[0, 1].map((k) => (
                  <button key={k} onClick={() => go(`/reader/${t.id}?chapter=${t.chapterCount - 1 - k}`)}>
                    Глава {t.chapterCount - k}
                    <span>{ago(t.updated - k * 7 * 86400000)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {n < list.length && (
        <button className="lx-btn lx-btn-ghost lx-wide" onClick={() => setN(n + 8)}>
          Показать ещё
        </button>
      )}
    </section>
  );
}

export default function Home() {
  const { state } = useStore();
  const popular = useMemo(() => by("views").slice(0, 16), []);
  const fresh = useMemo(() => [...all].filter((t) => t.comic).sort((a, b) => b.added - a.added).slice(0, 14), []);
  const chapters = useMemo(() => all.filter((t) => t.comic).sort((a, b) => b.updated - a.updated).slice(0, 14), []);
  const continuing = Object.entries(state.progress || {})
    .filter(([id]) => all.some((t) => t.id === id))
    .map(([id, p]) => [findBook(id), p]);
  return (
    <div className="lx-page lx-home">
      <Rail wide items={popular} id="popular-top" />
      {continuing.length > 0 && (
        <Rail
          id="continue"
          title="Продолжить чтение"
          items={continuing.map(([t]) => t)}
          render={(t) => {
            const p = state.progress[t.id];
            return (
              <div key={t.id} className="lx-continue">
                <TitleCard t={t} sub={`Глава ${(p.chapter || 0) + 1} · ${p.percent || 0}%`} />
                <span className="lx-progress" style={{ "--p": (p.percent || 0) + "%" }} />
              </div>
            );
          }}
        />
      )}
      <Rail id="fresh" title="Горячие новинки" more="/catalog?sort=new" items={fresh} />
      <Columns />
      <Rail id="popular" title="Популярное" more="/catalog?sort=views" items={by("likes").slice(0, 16)} />
      <section className="lx-section" aria-labelledby="coll">
        <div className="lx-section-head">
          <h2 id="coll">Коллекции</h2>
        </div>
        <div className="lx-collections">
          {collections.map((c) => (
            <Collection key={c.id} c={c} />
          ))}
        </div>
      </section>
      <TopTitles />
      <Rail
        id="chapters"
        title="Свежие главы"
        more="/catalog?sort=updated"
        items={chapters}
        render={(t) => <TitleCard key={t.id} t={t} sub={`Глава ${t.chapterCount} · ${ago(t.updated)}`} />}
      />
      <Rail id="books" title="Книги целиком" more="/catalog?type=Книга" items={books} />
      <Updates />
      <footer className="lx-footer">
        <p>
          Luma Studios — прототип. Тайтлы с пометкой «демо» придуманы для показа интерфейса: обложки нарисованы кодом, главы
          состоят из демо-страниц. Книги — произведения в общественном достоянии из Standard Ebooks.
        </p>
        <p>Закладки, оценки и прогресс хранятся только в этом браузере.</p>
      </footer>
    </div>
  );
}

export { collections };
