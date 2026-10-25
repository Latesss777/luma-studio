import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Plug,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { books, findBook } from "../data/books";
import { useStore, csvDownload } from "../shared/store";
import { PageHead, Button, Cover, Empty } from "../shared/ui";
const services = [
  {
    id: "telegram",
    name: "Telegram",
    text: "Истории из сообщений",
    file: "telegram.svg",
  },
  {
    id: "notion",
    name: "Notion",
    text: "Твоя база прочитанного",
    file: "notion.svg",
  },
  {
    id: "googlesheets",
    name: "Google Sheets",
    text: "Данные в таблице",
    file: "googlesheets.svg",
  },
  {
    id: "googledocs",
    name: "Google Docs",
    text: "Заметки в документе",
    file: "googledocs.svg",
  },
];
export function exportRows(state, parts) {
  const rows = [["Раздел", "Произведение", "Автор", "Значение", "Язык"]];
  if (parts.includes("Библиотека"))
    for (const id of state.library) {
      const b = findBook(id);
      rows.push(["Библиотека", b.title, b.author, "В библиотеке", b.language]);
    }
  if (parts.includes("Прогресс"))
    for (const [id, p] of Object.entries(state.progress)) {
      const b = findBook(id);
      rows.push([
        "Прогресс",
        b.title,
        b.author,
        `Глава ${p.chapter + 1}, страница ${p.page + 1}, ${p.percent}%`,
        b.language,
      ]);
    }
  if (parts.includes("Заметки"))
    for (const [id, note] of Object.entries(state.notes)) {
      const b = findBook(id);
      rows.push(["Заметки", b.title, b.author, note, b.language]);
    }
  if (parts.includes("Аналитика"))
    for (const e of state.events) {
      const b = findBook(e.book);
      rows.push([
        "Аналитика",
        b.title,
        b.author,
        `${e.type}: ${new Date(e.time).toISOString()}`,
        b.language,
      ]);
    }
  return rows;
}
export default function Integrations() {
  const { state, update, setToast } = useStore();
  const [tab, setTab] = useState("Импорт");
  const [service, setService] = useState("telegram");
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState(["sherlock", "pride"]);
  const [parts, setParts] = useState(["Библиотека", "Прогресс", "Заметки"]);
  const [mapping, setMapping] = useState({
    title: "Название",
    author: "Автор",
  });
  const [result, setResult] = useState("");
  const srv = services.find((s) => s.id === service);
  const records = ["sherlock", "pride", "dracula"];
  const choose = (id) => {
    setService(id);
    setStage(0);
    setResult("");
  };
  const connect = () => {
    update((s) => ({ connections: { ...s.connections, [service]: "demo" } }));
    setStage(1);
  };
  const imported = () => {
    const added = selected.filter((id) => !state.library.includes(id));
    update((s) => ({
      library: [...new Set([...s.library, ...selected])],
      archive: s.archive.filter((id) => !selected.includes(id)),
      imports: [
        ...s.imports,
        { service, books: selected, time: Date.now(), demo: true },
      ],
    }));
    setResult(
      `В локальную библиотеку добавлено: ${added.length}. Уже были в библиотеке: ${selected.length - added.length}.`,
    );
    setStage(3);
  };
  const rows = exportRows(state, parts);
  return (
    <>
      <PageHead
        title="Истории без границ"
        sub="Собирай в одном месте. Забирай с собой."
      />
      <div className="tabs" role="tablist" aria-label="Импорт и экспорт">
        {["Импорт", "Экспорт"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => {
              setTab(t);
              setStage(0);
              setService(t === "Импорт" ? "telegram" : service);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="integrations-layout">
        <aside className="service-list">
          {services
            .filter(
              (s) => tab === "Экспорт" || ["telegram", "notion"].includes(s.id),
            )
            .map((s) => (
              <button
                key={s.id}
                className={service === s.id ? "active" : ""}
                onClick={() => choose(s.id)}
              >
                <img src={"/assets/" + s.file} alt="" />
                <span>
                  {s.name}
                  <small>{s.text}</small>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
        </aside>
        <section className="integration-workspace">
          <div className="service-heading">
            <img src={"/assets/" + srv.file} alt="" />
            <div>
              <h2>{srv.name}</h2>
              <p className="muted">
                {state.connections[service]
                  ? "Демосвязь настроена"
                  : "Внешний аккаунт не подключён"}
              </p>
            </div>
            <span className="quiet-pill">Демо</span>
          </div>
          <p className="demo-notice">
            Внешние сервисы не подключаются.{" "}
            {tab === "Импорт"
              ? "Используем пример данных; книги добавляются только в этот браузер."
              : "Передача в сервис имитируется. CSV можно скачать настоящим файлом."}
          </p>
          <ol className="workflow-steps">
            {(tab === "Импорт"
              ? ["Подключение", "Данные", "Проверка", "Результат"]
              : ["Данные", "Предпросмотр", "Результат"]
            ).map((s, i) => (
              <li
                key={s}
                className={
                  i <= (tab === "Экспорт" ? (stage === 3 ? 2 : stage) : stage)
                    ? "active"
                    : ""
                }
              >
                <span>
                  {i <
                  (tab === "Экспорт" ? (stage === 3 ? 2 : stage) : stage) ? (
                    <Check size={13} />
                  ) : (
                    i + 1
                  )}
                </span>
                {s}
              </li>
            ))}
          </ol>
          {tab === "Импорт" ? (
            stage === 0 ? (
              <div className="connect-content">
                <Plug size={30} strokeWidth={1.2} />
                <h3>
                  {service === "telegram"
                    ? "Библиотека через бота"
                    : "Чтение из твоей базы"}
                </h3>
                <p>
                  {service === "telegram"
                    ? "В настоящей интеграции бот принимает твои файлы, а ты проверяешь их перед добавлением. Здесь можно пройти этот путь на примере."
                    : "В настоящей интеграции выбирается база с разрешением Notion OAuth. Здесь доступна демонстрационная база из трёх записей."}
                </p>
                <Button onClick={connect}>Настроить демосвязь</Button>
              </div>
            ) : stage === 1 ? (
              <>
                <div className="section-head">
                  <h3>
                    {service === "telegram"
                      ? "Пример входящих файлов"
                      : "Демонстрационная база"}
                  </h3>
                  <span className="muted">{selected.length} выбрано</span>
                </div>
                {service === "notion" && (
                  <div className="field-mapping">
                    <h4>Соответствие полей</h4>
                    {[
                      ["title", "Название произведения"],
                      ["author", "Автор"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <ArrowRight size={16} />
                        <select
                          aria-label={"Поле: " + label}
                          value={mapping[key]}
                          onChange={(e) =>
                            setMapping({ ...mapping, [key]: e.target.value })
                          }
                        >
                          <option>Название</option>
                          <option>Автор</option>
                          <option>Не импортировать</option>
                        </select>
                      </label>
                    ))}
                    {(mapping.title !== "Название" ||
                      mapping.author !== "Автор") && (
                      <p className="field-error">
                        Для примера сопоставь название с «Название», автора — с
                        «Автор». Предпросмотр ниже учитывает выбранные поля.
                      </p>
                    )}
                    <div className="mapping-preview">
                      <small>Первая запись</small>
                      <p>
                        {mapping.title === "Название"
                          ? findBook(records[0]).title
                          : mapping.title === "Автор"
                            ? findBook(records[0]).author
                            : "Без названия"}{" "}
                        /{" "}
                        {mapping.author === "Автор"
                          ? findBook(records[0]).author
                          : mapping.author === "Название"
                            ? findBook(records[0]).title
                            : "Без автора"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="import-records">
                  {records.map((id) => {
                    const b = findBook(id);
                    return (
                      <label key={id}>
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onChange={() =>
                            setSelected((s) =>
                              s.includes(id)
                                ? s.filter((x) => x !== id)
                                : [...s, id],
                            )
                          }
                        />
                        <Cover book={b} />
                        <span>
                          <strong>{b.title}</strong>
                          <small>{b.author} · English</small>
                          <small>
                            {service === "telegram"
                              ? `${b.id}.epub · демонстрационный файл`
                              : "Запись базы · пример"}
                          </small>
                        </span>
                        {state.library.includes(id) && (
                          <small>Уже в библиотеке</small>
                        )}
                      </label>
                    );
                  })}
                </div>
                <Button
                  disabled={
                    !selected.length ||
                    (service === "notion" &&
                      (mapping.title !== "Название" ||
                        mapping.author !== "Автор"))
                  }
                  onClick={() => setStage(2)}
                >
                  Проверить выбранное
                </Button>
              </>
            ) : stage === 2 ? (
              <>
                <h3>Всё готово к добавлению</h3>
                <p className="muted">
                  Издания на английском. Повторные записи не дублируются.
                </p>
                <ul className="preview-list">
                  {selected.map((id) => (
                    <li key={id}>
                      <Check size={16} />
                      {findBook(id).title}
                      <span>
                        {state.library.includes(id) ? "Уже есть" : "Добавится"}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="row">
                  <Button onClick={imported}>Добавить в библиотеку</Button>
                  <button className="text-link" onClick={() => setStage(1)}>
                    Изменить выбор
                  </button>
                </div>
              </>
            ) : (
              <div className="workflow-result">
                <span>
                  <Check size={33} />
                </span>
                <h3>Демоимпорт завершён</h3>
                <p>{result}</p>
                <Button secondary onClick={() => setStage(1)}>
                  Вернуться к данным
                </Button>
              </div>
            )
          ) : stage === 0 ? (
            <>
              <h3>Что забрать с собой?</h3>
              <div className="export-options">
                {["Библиотека", "Прогресс", "Заметки", "Аналитика"].map((p) => (
                  <label key={p}>
                    <input
                      type="checkbox"
                      checked={parts.includes(p)}
                      onChange={() =>
                        setParts((s) =>
                          s.includes(p) ? s.filter((x) => x !== p) : [...s, p],
                        )
                      }
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
              <Button disabled={!parts.length} onClick={() => setStage(1)}>
                Предпросмотр
              </Button>
            </>
          ) : stage === 1 ? (
            <>
              <div className="section-head">
                <h3>Предпросмотр экспорта</h3>
                <span className="muted">{rows.length - 1} записей</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {rows[0].slice(0, 4).map((t) => (
                        <th key={t}>{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(1, 7).map((r, i) => (
                      <tr key={i}>
                        {r.slice(0, 4).map((c, j) => (
                          <td key={j}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 1 && (
                <p className="muted">
                  Пока нет данных в выбранных разделах. CSV будет содержать
                  заголовки.
                </p>
              )}
              <p className="muted small">
                В {srv.name} данные не передаются. Подтверждение завершит
                демонстрационный сценарий.
              </p>
              <div className="row">
                <Button
                  onClick={() => {
                    setStage(3);
                    setResult(
                      "Подготовлено " +
                        (rows.length - 1) +
                        " записей. Внешняя передача не выполнялась.",
                    );
                  }}
                >
                  Подтвердить демоэкспорт
                </Button>
                <button className="text-link" onClick={() => setStage(0)}>
                  Изменить
                </button>
              </div>
            </>
          ) : (
            <div className="workflow-result">
              <span>
                <Check size={33} />
              </span>
              <h3>Экспорт подготовлен</h3>
              <p>{result}</p>
              <Button
                icon={Download}
                onClick={() => {
                  csvDownload(rows);
                  setToast("Настоящий CSV создан: UTF-8 с BOM");
                }}
              >
                Скачать CSV
              </Button>
              <button className="text-link" onClick={() => setStage(0)}>
                Новый экспорт
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
