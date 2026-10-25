import React, { useState } from "react";
import {
  Plus,
  Archive,
  RotateCcw,
  Trash2,
  LibraryBig,
  Check,
  BookOpen,
  Upload,
} from "lucide-react";
import { books, findBook } from "../data/books";
import { go, useStore, plural } from "../shared/store";
import {
  PageHead,
  Button,
  Card,
  Cover,
  Empty,
  IconButton,
  Back,
} from "../shared/ui";
export async function readIcon(file) {
  if (!file) return "";
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 500000
  )
    throw Error("Выбери PNG, JPEG или WebP до 500 КБ.");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(Error("Не удалось прочитать изображение."));
    r.readAsDataURL(file);
  });
}
export default function Library() {
  const { state, update, setToast } = useStore();
  const [tab, setTab] = useState("Библиотека");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);
  const archive = (id) => {
    update((s) => ({
      library: s.library.filter((x) => x !== id),
      archive: [...new Set([...s.archive, id])],
      shelves: s.shelves.map((sh) => ({
        ...sh,
        books: sh.books.filter((x) => x !== id),
      })),
    }));
    setToast("Произведение в архиве");
  };
  const shelf = state.shelves.find((s) => s.id === selected);
  const addToShelf = (id) =>
    update((s) => ({
      shelves: s.shelves.map((sh) =>
        sh.id === selected
          ? {
              ...sh,
              books: sh.books.includes(id)
                ? sh.books.filter((x) => x !== id)
                : [...sh.books, id],
            }
          : sh,
      ),
      library: [...new Set([...s.library, id])],
      archive: s.archive.filter((x) => x !== id),
    }));
  if (shelf)
    return (
      <>
        <Back to="/library" />
        <button className="text-link" onClick={() => setSelected(null)}>
          Все полки
        </button>
        <PageHead title={shelf.name} sub={plural(shelf.books.length)}>
          {shelf.icon && (
            <img className="shelf-icon" src={shelf.icon} alt="Иконка полки" />
          )}
        </PageHead>
        <p className="muted">
          Нажми на обложку, чтобы добавить или убрать произведение с полки.
        </p>
        <div className="book-grid">
          {books.map((b) => (
            <Card
              key={b.id}
              book={b}
              selectable
              selected={shelf.books.includes(b.id)}
              onSelect={addToShelf}
            />
          ))}
        </div>
        <div className="shelf-settings">
          <label className="upload-label">
            <Upload size={17} />
            Изменить иконку
            <input
              aria-label="Иконка полки"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                try {
                  const data = await readIcon(e.target.files[0]);
                  update((s) => ({
                    shelves: s.shelves.map((sh) =>
                      sh.id === selected ? { ...sh, icon: data } : sh,
                    ),
                  }));
                  setToast("Иконка полки обновлена");
                } catch (err) {
                  setToast(err.message);
                }
              }}
            />
          </label>
          <Button
            secondary
            icon={Trash2}
            onClick={() => {
              update((s) => ({
                shelves: s.shelves.filter((x) => x.id !== selected),
              }));
              setSelected(null);
              setToast("Полка удалена. Книги остались в библиотеке.");
            }}
          >
            Удалить полку
          </Button>
        </div>
      </>
    );
  return (
    <>
      <PageHead title="Твоя библиотека" sub={plural(state.library.length)}>
        <Button
          secondary
          icon={Plus}
          onClick={() => {
            setCreating(!creating);
            setTab("Полки");
          }}
        >
          Создать полку
        </Button>
      </PageHead>
      <div className="tabs" role="tablist" aria-label="Разделы библиотеки">
        {["Библиотека", "Полки", "Архив"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setCreating(false);
            }}
          >
            {t}
            <span>
              {t === "Библиотека"
                ? state.library.length
                : t === "Полки"
                  ? state.shelves.length
                  : state.archive.length}
            </span>
          </button>
        ))}
      </div>
      {creating && (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setErr("Назови полку");
              return;
            }
            update((s) => ({
              shelves: [
                ...s.shelves,
                { id: crypto.randomUUID(), name: name.trim(), icon, books: [] },
              ],
            }));
            setName("");
            setIcon("");
            setCreating(false);
            setToast("Полка создана");
          }}
        >
          <h2>Новая полка</h2>
          <label>
            Название
            <input
              aria-label="Название полки"
              value={name}
              maxLength={50}
              placeholder="Например, на длинные вечера"
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              autoFocus
            />
          </label>
          <label className="upload-label">
            <Upload size={17} />
            Своя иконка · до 500 КБ
            <input
              aria-label="Загрузить иконку новой полки"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                try {
                  setIcon(await readIcon(e.target.files[0]));
                  setErr("");
                } catch (err) {
                  setErr(err.message);
                }
              }}
            />
          </label>
          {icon && (
            <img className="shelf-icon" src={icon} alt="Выбранная иконка" />
          )}
          <div className="field-error" role="alert">
            {err}
          </div>
          <div className="row">
            <Button type="submit">Создать</Button>
            <button
              type="button"
              className="text-link"
              onClick={() => setCreating(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
      {tab === "Полки" ? (
        state.shelves.length ? (
          <div className="shelves-grid">
            {state.shelves.map((sh) => (
              <button
                className="shelf-card"
                key={sh.id}
                onClick={() => setSelected(sh.id)}
              >
                <div className="shelf-montage">
                  {sh.books.slice(0, 4).map((id, i) => (
                    <Cover key={id} book={findBook(id)} style={{ "--i": i }} />
                  ))}
                  {!sh.books.length && <LibraryBig size={36} strokeWidth={1} />}
                </div>
                <div className="shelf-caption">
                  {sh.icon ? (
                    <img className="shelf-icon" src={sh.icon} alt="" />
                  ) : (
                    <LibraryBig size={24} />
                  )}
                  <div>
                    <h3>{sh.name}</h3>
                    <p>{plural(sh.books.length)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="Полка для особенных историй"
            text="Собери книги по настроению, автору или своим правилам."
          >
            <Button secondary onClick={() => setCreating(true)} icon={Plus}>
              Создать первую полку
            </Button>
          </Empty>
        )
      ) : (
        <>
          {(tab === "Архив" ? state.archive : state.library).length ? (
            <div className="book-grid library-grid">
              {(tab === "Архив" ? state.archive : state.library).map((id) => (
                <div key={id}>
                  <Card book={findBook(id)} />
                  {tab === "Архив" ? (
                    <button
                      className="library-action"
                      onClick={() => {
                        update((s) => ({
                          library: [...new Set([...s.library, id])],
                          archive: s.archive.filter((x) => x !== id),
                        }));
                        setToast("Произведение восстановлено");
                      }}
                    >
                      <RotateCcw size={15} />
                      Восстановить
                    </button>
                  ) : (
                    <button
                      className="library-action"
                      onClick={() => archive(id)}
                    >
                      <Archive size={15} />В архив
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={
                tab === "Архив" ? "Архив пуст" : "Здесь будут твои истории"
              }
              text={
                tab === "Архив"
                  ? "Архивированные книги можно вернуть в любое время."
                  : "Добавь произведение из каталога или начни читать."
              }
            >
              {tab !== "Архив" && (
                <Button onClick={() => go("/catalog")}>Открыть каталог</Button>
              )}
            </Empty>
          )}
        </>
      )}
    </>
  );
}
