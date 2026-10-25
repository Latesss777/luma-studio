# Источники изображений и данных

## Материалы пользователя

Прочитан текстовый промпт «Вставленный текст.txt» (30 192 байта). Визуально изучены два изображения из последующего сообщения: белый знак и надпись luma на чёрном фоне; мобильный стартовый экран с космическим фоном, регистрацией и ссылкой входа. Стартовый сценарий дополнен отдельным экраном «Зарегистрироваться» / «Войти» и указанным набором форматов.

Оба ZIP — «рефернсы luma-studio (6).zip» и «фон для luma studio.zip» — отклонены инструментом загрузки как превышающие 32 MiB. Их содержимое не распаковано и не изучено. Бинарные оригиналы изображений из сообщения в файловой системе отсутствуют. Для точной вставки оригинального логотипа и фона запрошена доступная ссылка на отдельные файлы. Пока применяется временная типографическая надпись, без утверждения, что это предоставленный логотип. Исходные SVG сервисов, видео и дополнительные архивы из перечисления в промпте отдельно не получены.

## Произведения и обложки

Все обложки — **готовые оригинальные cover.svg из репозиториев Standard Ebooks**, 1400×2100. Собственный текст поверх них не добавлен. `*.jpg` — исходная живопись тех же изданий для фоновой композиции. Файлы загружены 25 октября 2026 года. Атрибуция художников взята из `src/epub/content.opf`, машинный список: `asset-provenance.json`.

| ID           | Автор и произведение                                  | Художник обложки      | Репозиторий                                                                                  |
| ------------ | ----------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| alice        | Lewis Carroll, Alice’s Adventures in Wonderland       | Иван Шишкин           | https://github.com/standardebooks/lewis-carroll_alices-adventures-in-wonderland_john-tenniel |
| sherlock     | Arthur Conan Doyle, The Adventures of Sherlock Holmes | Thomas Eakins         | https://github.com/standardebooks/arthur-conan-doyle_the-adventures-of-sherlock-holmes       |
| pride        | Jane Austen, Pride and Prejudice                      | Edmund Blair Leighton | https://github.com/standardebooks/jane-austen_pride-and-prejudice                            |
| frankenstein | Mary Shelley, Frankenstein                            | Giuseppe Arcimboldo   | https://github.com/standardebooks/mary-shelley_frankenstein                                  |
| dracula      | Bram Stoker, Dracula                                  | Joseph Magnus Stäck   | https://github.com/standardebooks/bram-stoker_dracula                                        |
| moby         | Herman Melville, Moby-Dick                            | Albert Pinkham Ryder  | https://github.com/standardebooks/herman-melville_moby-dick                                  |

Пути относительно каждого репозитория: `src/epub/images/cover.svg`, `images/cover.jpg`, `src/epub/text/chapter-N.xhtml`. Sherlock: `a-scandal-in-bohemia.xhtml`, `a-case-of-identity.xhtml`. JSON сохраняет URL первоисточника для каждой главы. У Алисы 12 глав; у других книг 2–3 начальные главы. Разбивка на страницы выполнена интерфейсом; она не воспроизводит пагинацию печатного издания. Тексты на английском, русские описания каталога написаны для прототипа. Рейтинги внешних площадок не импортировались и не выдумывались.

Standard Ebooks публикует издания, свободные от известных ограничений в США; официальная информация: https://standardebooks.org/about . Права на произведения и изображения определяются также применимой юрисдикцией. Оригинальные метаданные каждого издания доступны по ссылкам в `asset-provenance.json`.

## Иллюстрации и аудио

- John Tenniel, оригинальные `illustration-2.svg`, `illustration-3.svg`, `illustration-4.svg` из издания Алисы выше. Демонстрационный лист составлен из этих иллюстраций. Три прямоугольные области заданы вручную в координатах листа 1000×1400. Масштаб и смещение считаются по размерам области и viewport. Это не страница манги, не обложка и не автоматический детектор панелей.
- `alice-audio.mp3` — настоящий синтезированный голосом **Flite SLT** английский фрагмент начала первой главы (около 3:17). Создан локально FFmpeg filter `flite`, не выдаётся за актёрскую запись или полную аудиокнигу. Размер и длительность в интерфейсе получены ffprobe, `audio-meta.json`.
- Для первичной подготовки аудиотекста использовался английский оригинал Project Gutenberg: https://www.gutenberg.org/ebooks/11 , зеркало https://github.com/GITenberg/Alice-s-Adventures-in-Wonderland_11 . Текст интерфейсной читалки взят из Standard Ebooks.

## Иконки и шрифт

- Интерфейс: Lucide React 0.468.0, ISC / лицензия производных Feather. Официальные руководство и лицензия проверены: https://lucide.dev/guide/ , https://lucide.dev/license . Копия лицензии включена в assets/lucide-LICENSE.txt.
- Сервисы: реальные SVG из **Simple Icons**, CC0, не самодельные имитации: https://github.com/simple-icons/simple-icons . Пути `icons/telegram.svg`, `icons/notion.svg`, `icons/googlesheets.svg`, `icons/googledocs.svg`. Эти файлы не выдаются за отсутствующие SVG из архива пользователя. Использование торговых знаков подчиняется правилам соответствующих владельцев.
- Manrope, Google Fonts, SIL Open Font License: https://github.com/google/fonts/tree/main/ofl/manrope . `manrope.ttf`, копия OFL включена. Системные резервные шрифты: Arial; в читалке Georgia / Times New Roman.

## Вход

Официальная документация Яндекс ID прочитана перед реализацией: https://yandex.ru/dev/id/doc/ru/ . Провайдер использует OAuth 2.0 и перенаправление на свою страницу. В прототипе нет client ID, redirect URI и backend обмена токена, поэтому настоящий вход не запускается. Имитация успешного подключения аккаунта отсутствует.
