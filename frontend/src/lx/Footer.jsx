import React from "react";
import { all } from "../data/books";
import { go, useStore } from "../shared/store";
import { BrandArt } from "../shared/ui";
import { Poster, ago } from "./ui";

export const infoPages = {
  about: ["О проекте", "Luma Studios — одна библиотека для манги, комиксов, вебтунов, книг и аудиокниг на телефоне, компьютере и телевизоре. Сейчас это рабочий прототип: данные хранятся в браузере, демо-тайтлы помечены."],
  jobs: ["Вакансии", "Открытых вакансий пока нет. Когда команда начнёт расти, список появится здесь."],
  ads: ["Рекламодателям", "Рекламных размещений пока нет."],
  news: ["Новости", "Новостей пока нет. Обновления прототипа описаны в репозитории проекта."],
  rights: ["Правообладателям", "Luma показывает только произведения в общественном достоянии, работы авторов, которые сами их загрузили, и демо-материалы, созданные для прототипа. Если вы считаете, что здесь размещено ваше произведение без разрешения, свяжитесь с владельцем проекта."],
  rules: ["Правила сайта", "Будьте вежливы в комментариях, не публикуйте чужие работы без разрешения и не раскрывайте сюжет без предупреждения."],
  faq: ["Вопросы и ответы", "Где хранятся закладки? В этом браузере. Почему у тайтла пометка «демо»? Он придуман для показа интерфейса. Можно ли читать книги целиком? Да, если произведение в общественном достоянии."],
  authors: ["Как опубликовать работу", "Публикация для авторов появится вместе с сервером. Сейчас загрузка работ недоступна."],
  terms: ["Пользовательское соглашение", "Документ появится перед открытием регистрации."],
  privacy: ["Конфиденциальность", "Прототип ничего не отправляет на сервер: закладки, оценки, комментарии и прогресс остаются в вашем браузере."],
  app: ["Приложение", "Luma работает как веб-приложение. Его можно добавить на главный экран телефона через меню браузера."],
  support: ["Поддержка", "Поддержка появится вместе с аккаунтами. Пока об ошибках можно сообщить владельцу проекта в репозитории."],
};

const groups = [
  ["О Luma", ["about", "jobs", "ads"]],
  ["Общее", ["news", "rights", "rules", "faq"]],
  ["Авторам", ["authors"]],
  ["Читателям", ["terms", "privacy", "app"]],
];

export default function Footer() {
  return (
    <footer className="lx-foot">
      <div className="lx-foot-in">
        <div className="lx-foot-cols">
          {groups.map(([h, links]) => (
            <div key={h}>
              <h3>{h}</h3>
              {links.map((k) => (
                <button key={k} onClick={() => go("/info/" + k)}>
                  {infoPages[k][0]}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="lx-foot-brand">
          <div className="lx-foot-logo">
            <BrandArt mark />
            <strong>Luma</strong>
          </div>
          <p>
            По вопросам работы сайта —{" "}
            <button className="lx-link" onClick={() => go("/info/support")}>
              поддержка
            </button>
          </p>
          <p className="lx-muted">© Luma Studios 2026. Демо-тайтлы и их обложки созданы для прототипа.</p>
        </div>
      </div>
    </footer>
  );
}

export function Info({ id }) {
  const [title, text] = infoPages[id] || ["Страница не найдена", "Такой страницы нет. Вернитесь на главную."];
  return (
    <div className="lx-page lx-info-page">
      <h1 className="lx-h1">{title}</h1>
      <p>{text}</p>
      <button className="lx-btn lx-btn-auto" onClick={() => go("/")}>
        На главную
      </button>
    </div>
  );
}

export function Notifications() {
  const { state } = useStore();
  const ids = Object.keys(state.bookmarks || {});
  const items = all
    .filter((t) => t.comic && (ids.length ? ids.includes(t.id) : true))
    .sort((a, b) => b.updated - a.updated);
  return (
    <div className="lx-page">
      <h1 className="lx-h1">Уведомления</h1>
      <p className="lx-muted">{ids.length ? "Новые главы тайтлов из ваших закладок." : "Добавьте тайтлы в закладки, и здесь останутся только их главы. Пока показываем все обновления."}</p>
      <div className="lx-notes">
        {items.map((t) => (
          <button key={t.id} className="lx-note-row" onClick={() => go(`/reader/${t.id}?chapter=${t.chapterCount - 1}`)}>
            <Poster t={t} className="lx-note-cover" tag={false} />
            <span>
              <strong>{t.title}</strong>
              <small>Вышла глава {t.chapterCount}</small>
            </span>
            <small className="lx-muted">{ago(t.updated)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
