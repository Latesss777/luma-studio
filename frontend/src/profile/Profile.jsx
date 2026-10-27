import React, { useState } from "react";
import {
  Pencil,
  Settings,
  Plug,
  Download,
  LogOut,
  ChevronRight,
  BookOpen,
  Headphones,
  LibraryBig,
  Upload,
} from "lucide-react";
import { go, useStore, csvDownload, plural } from "../shared/store";
import { findBook } from "../data/books";
import { PageHead, Button } from "../shared/ui";
import { readIcon } from "../library/Library";
export default function Profile() {
  const { state, update, setToast } = useStore();
  const [edit, setEdit] = useState(false);
  const [settings, setSettings] = useState(false);
  const [form, setForm] = useState(state.profile);
  const [err, setErr] = useState("");
  const [period, setPeriod] = useState(7);
  const since = Date.now() - Number(period) * 86400000;
  const events = state.events.filter((e) => e.time >= since);
  const pages = new Set(
    events
      .filter((e) => e.type === "reading")
      .map((e) => e.book + ":" + e.chapter + ":" + e.page),
  ).size;
  const audio = events.filter((e) => e.type === "audio").length;
  const bins = Number(period) === 30 ? 6 : 7;
  const span = Number(period) === 30 ? 5 : 1;
  const days = Array.from({ length: bins }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (bins - 1 - i) * span - (span - 1));
    const end = new Date(start);
    end.setDate(end.getDate() + span);
    const last = new Date(end.getTime() - 1);
    return {
      name:
        span === 1
          ? new Intl.DateTimeFormat("ru", { weekday: "short" }).format(start)
          : `${start.getDate()}–${last.getDate()}`,
      value: events.filter(
        (e) => e.time >= start.getTime() && e.time < end.getTime(),
      ).length,
    };
  });
  const max = Math.max(...days.map((d) => d.value), 1);
  return (
    <>
      <PageHead title="Профиль" />
      <section className="profile-identity">
        {state.profile.avatar ? (
          <img
            className="avatar"
            src={state.profile.avatar}
            alt="Аватар профиля"
          />
        ) : (
          <div className="avatar" aria-label="Аватар профиля">
            {state.profile.name.slice(0, 1)}
          </div>
        )}
        <div>
          <h1>{state.profile.name}</h1>
          <p className="muted">@{state.profile.username}</p>
          <p>{state.profile.bio}</p>
        </div>
        <Button
          secondary
          icon={Pencil}
          onClick={() => {
            setForm(state.profile);
            setEdit(!edit);
          }}
        >
          Редактировать
        </Button>
      </section>
      {edit && (
        <form
          className="inline-form profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !form.name.trim() ||
              !/^[a-zA-Z0-9_]{3,24}$/.test(form.username)
            ) {
              setErr(
                "Введи имя и username: 3–24 латинских буквы, цифры или _.",
              );
              return;
            }
            update({ profile: { ...form, name: form.name.trim() } });
            setEdit(false);
            setToast("Профиль сохранён");
          }}
        >
          <h2>О тебе</h2>
          <label>
            Имя
            <input
              aria-label="Имя"
              value={form.name}
              maxLength={40}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Username
            <input
              aria-label="Username"
              value={form.username}
              maxLength={24}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </label>
          <label>
            О себе
            <textarea
              aria-label="О себе"
              maxLength={160}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <label className="upload-label">
            <Upload size={17} />
            Изменить аватар
            <input
              aria-label="Загрузить аватар"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                try {
                  setForm({
                    ...form,
                    avatar: await readIcon(e.target.files[0]),
                  });
                  setErr("");
                } catch (e) {
                  setErr(e.message);
                }
              }}
            />
          </label>
          <p className="field-error" role="alert">
            {err}
          </p>
          <div className="row">
            <Button type="submit">Сохранить профиль</Button>
            <button
              className="text-link"
              type="button"
              onClick={() => setEdit(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
      <div className="profile-shortcuts">
        <button onClick={() => go("/library")}>
          <LibraryBig size={21} />
          <span>
            Библиотека
            <small>
              {plural(state.library.length)} · {state.shelves.length} полок
            </small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => {
            const id = Object.keys(state.progress)[0];
            go(id ? "/reader/" + id : "/catalog");
          }}
        >
          <BookOpen size={21} />
          <span>
            Продолжить
            <small>
              {Object.keys(state.progress).length
                ? "Вернуться к чтению"
                : "Выбрать первую историю"}
            </small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button onClick={() => go("/integrations")}>
          <Plug size={21} />
          <span>
            Интеграции<small>Импорт и экспорт</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button onClick={() => setSettings(!settings)} aria-expanded={settings}>
          <Settings size={21} />
          <span>
            Настройки<small>Язык и оформление</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </div>
      {settings && (
        <section className="inline-form">
          <h2>Настройки</h2>
          <div className="settings-row">
            <label htmlFor="preferred-language">Язык изданий</label>
            <select
              id="preferred-language"
              value={state.language}
              onChange={(e) => update({ language: e.target.value })}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <p className="muted small">
            Если нужного издания нет, показываем фактический язык доступного
            текста.
          </p>
          <p className="muted small">
            Данные хранятся только на этом устройстве.
          </p>
          <button
            className="text-link"
            onClick={() => update({ signedIn: false })}
          >
            <LogOut size={16} />
            Выйти
          </button>
        </section>
      )}
      <section className="analytics">
        <div className="section-head">
          <h2>Твой ритм</h2>
          <select
            aria-label="Период аналитики"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
          </select>
        </div>
        <div className="stat-row">
          <div>
            <strong>{pages}</strong>
            <span>страниц открыто</span>
          </div>
          <div>
            <strong>{audio}</strong>
            <span>запусков аудио</span>
          </div>
          <div>
            <strong>{state.library.length}</strong>
            <span>в библиотеке</span>
          </div>
        </div>
        {days.every((d) => !d.value) ? (
          <p className="lx-chart-empty">Здесь появится ваша активность по дням. Откройте любую главу или включите аудиокнигу.</p>
        ) : (
          <div
          className="activity-chart"
          aria-label="Активность за последние дни"
        >
          {days.map((d, i) => (
            <div key={i}>
              <div className="bar-track">
                <span
                  style={{ height: (d.value / max) * 100 + "%" }}
                  title={`${d.value} действий`}
                />
              </div>
              <small>{d.name}</small>
            </div>
          ))}
        </div>
        )}
        <p className="muted small">
          Фактические действия в этом браузере. Открытая страница не означает
          прочитанную.
        </p>
        <Button
          secondary
          icon={Download}
          onClick={() => {
            csvDownload(
              [
                ["Событие", "Произведение", "Время"],
                ...events.map((e) => [
                  e.type,
                  findBook(e.book).title,
                  new Date(e.time).toISOString(),
                ]),
              ],
              "Luma_Analytics.csv",
            );
            setToast("CSV с аналитикой создан");
          }}
        >
          Экспорт аналитики
        </Button>
      </section>
    </>
  );
}
