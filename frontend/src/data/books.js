import { demoTitles, decorate } from "./titles";
import chapters from "./chapters.json";
export const books = [
  {
    id: "alice",
    title: "Алиса в Стране чудес",
    original: "Alice’s Adventures in Wonderland",
    author: "Льюис Кэрролл",
    authorId: "carroll",
    format: "Книги",
    genre: "Фэнтези",
    language: "en",
    color: "#b4b69b",
    description:
      "Однажды Алиса замечает Белого Кролика с карманными часами — и следует за ним в мир, где привычные правила больше не действуют. История о любопытстве, взрослении и свободе воображения.",
    characters: ["Алиса", "Белый Кролик", "Чеширский Кот"],
    year: 1865,
  },
  {
    id: "sherlock",
    title: "Приключения Шерлока Холмса",
    original: "The Adventures of Sherlock Holmes",
    author: "Артур Конан Дойл",
    authorId: "doyle",
    format: "Книги",
    genre: "Детектив",
    language: "en",
    color: "#d6bd92",
    description:
      "Знаменитый сыщик и доктор Ватсон распутывают загадки викторианского Лондона. Точность наблюдения, неожиданные детали и истории, с которых начинается знакомство с Бейкер-стрит.",
    characters: ["Шерлок Холмс", "Доктор Ватсон", "Ирэн Адлер"],
    year: 1892,
  },
  {
    id: "pride",
    title: "Гордость и предубеждение",
    original: "Pride and Prejudice",
    author: "Джейн Остин",
    authorId: "austen",
    format: "Книги",
    genre: "Роман",
    language: "en",
    color: "#cab8ce",
    description:
      "Элизабет Беннет и мистер Дарси встречаются в мире строгих условностей. Их первое впечатление друг о друге оказывается лишь началом тонкой истории о достоинстве, чувствах и умении менять своё мнение.",
    characters: ["Элизабет Беннет", "Фицуильям Дарси", "Джейн Беннет"],
    year: 1813,
  },
  {
    id: "frankenstein",
    title: "Франкенштейн",
    original: "Frankenstein",
    author: "Мэри Шелли",
    authorId: "shelley",
    format: "Книги",
    genre: "Фантастика",
    language: "en",
    color: "#aac1c9",
    description:
      "Молодой учёный Виктор Франкенштейн открывает секрет создания жизни. Его открытие превращается в вопрос об ответственности, одиночестве и том, что делает нас людьми.",
    characters: ["Виктор Франкенштейн", "Создание", "Роберт Уолтон"],
    year: 1818,
  },
  {
    id: "dracula",
    title: "Дракула",
    original: "Dracula",
    author: "Брэм Стокер",
    authorId: "stoker",
    format: "Книги",
    genre: "Готика",
    language: "en",
    color: "#c7b3a9",
    description:
      "Путешествие молодого юриста в Трансильванию открывает историю, рассказанную в дневниках, письмах и записях. Древняя тень постепенно добирается до Лондона.",
    characters: ["Граф Дракула", "Мина Мюррей", "Джонатан Харкер"],
    year: 1897,
  },
  {
    id: "moby",
    title: "Моби Дик",
    original: "Moby-Dick",
    author: "Герман Мелвилл",
    authorId: "melville",
    format: "Книги",
    genre: "Приключения",
    language: "en",
    color: "#a1bec2",
    description:
      "Измаил нанимается на китобойное судно «Пекод». Капитан Ахав ведёт корабль навстречу белому киту, превращая плавание в историю одержимости, моря и человеческой воли.",
    characters: ["Измаил", "Капитан Ахав", "Квикег"],
    year: 1851,
  },
];
const bookExtra = {
  alice: [9.5, 2810, "Сказка"],
  sherlock: [9.3, 2150, "Детектив"],
  pride: [9.2, 1980, "Роман"],
  frankenstein: [8.9, 1420, "Готика"],
  dracula: [9.0, 1730, "Готика"],
  moby: [8.6, 1110, "Приключения"],
};
books.forEach((b, i) => {
  const [rating, views, g2] = bookExtra[b.id];
  Object.assign(b, {
    type: "Книга",
    genres: [...new Set([b.genre, g2, "Классика"])],
    rating,
    chapterCount: (chapters[b.id] || []).length,
    status: "Завершён",
    views: views * 100 + i * 37,
    likes: views * 31,
    bookmarks: views * 9,
    age: "12+",
    updated: Date.UTC(2026, 9, 20 - i * 2, 12),
    added: Date.UTC(2026, 9, 1),
    comic: false,
    demo: false,
  });
});
export const all = [...books, ...demoTitles].map(decorate);
export const allTags = [...new Set(all.flatMap((b) => b.tags))].sort((a, b) => a.localeCompare(b, "ru"));
export const findBook = (id) => all.find((b) => b.id === id) || books[0];
export const cover = (book) => book.coverData || `/assets/${book.id}-cover.svg`;
export const types = ["Манга", "Манхва", "Маньхуа", "Комикс", "Книга"];
export const allGenres = [...new Set(all.flatMap((b) => b.genres))].sort((a, b) => a.localeCompare(b, "ru"));
export const formats = ["Книги", "Манга и комиксы", "Вебтуны", "Аудиокниги"];
export const genres = [
  "Фэнтези",
  "Детектив",
  "Роман",
  "Фантастика",
  "Готика",
  "Приключения",
];
export const authorBio = {
  carroll:
    "Английский писатель, математик и фотограф. Автор историй об Алисе и мастер литературного абсурда.",
  doyle: "Британский писатель и врач, создатель Шерлока Холмса.",
  austen:
    "Английская писательница, чьи романы исследуют характер, отношения и общество.",
  shelley:
    "Английская писательница, одна из основоположниц научной фантастики.",
  stoker:
    "Ирландский писатель, автор классического готического романа «Дракула».",
  melville: "Американский писатель и моряк, автор романа «Моби Дик».",
};
