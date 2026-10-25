import { launch, base } from "./browser.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const out = process.env.LUMA_TEST_DIR || "work/verification";
await fs.mkdir(out, { recursive: true });
const checks = [];
const errors = [];
const browser = await launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const state = async () => {
  await page.waitForTimeout(80);
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("luma-studios-v1")),
  );
};
const click = async (label, exact = true) => {
  await page
    .getByRole("button", { name: label, exact })
    .or(page.getByRole("tab", { name: label, exact }))
    .click();
  await page.waitForTimeout(90);
};
async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, passed: true });
    console.log("PASS", name);
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
    await page.screenshot({ path: out + "/failure.png", fullPage: true });
    throw e;
  }
}
async function route(path) {
  await page.goto(base + "/#" + path);
  await page.waitForTimeout(180);
}
async function noOverflow() {
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "horizontal overflow",
  );
}
try {
  await page.goto(base);
  await page.waitForTimeout(500);
  await check("Центрирование входа на ПК", async () => {
    const b = await page.locator(".auth-panel").boundingBox();
    assert(Math.abs(b.x + b.width / 2 - 720) < 1);
  });
  await check("Яндекс ID не имитирует настоящий OAuth", async () => {
    await click("Зарегистрироваться");
    await click("Войти с Яндекс ID");
    assert(
      await page
        .getByText(
          "Для настоящего входа нужен настроенный OAuth-клиент Яндекса.",
          { exact: false },
        )
        .isVisible(),
    );
    await click("Назад");
  });
  await check("Ошибочная почта, корректная почта, резерв ошибки", async () => {
    await click("Почта");
    await page.getByLabel("Электронная почта").fill("bad");
    const y = (
      await page
        .getByRole("button", { name: "Продолжить", exact: true })
        .boundingBox()
    ).y;
    await click("Продолжить");
    assert(await page.getByRole("alert").textContent());
    assert.equal(
      (
        await page
          .getByRole("button", { name: "Продолжить", exact: true })
          .boundingBox()
      ).y,
      y,
    );
    await page.getByLabel("Электронная почта").fill("reader@example.com");
    await click("Продолжить");
    assert(await page.getByLabel("Цифра кода 1").isVisible());
  });
  await check("Неверный код, повтор, ввод и backspace", async () => {
    for (let i = 1; i <= 4; i++)
      await page.getByLabel("Цифра кода " + i).fill("9");
    assert(
      (await page.getByRole("alert").textContent()).includes("Код не подошёл"),
    );
    await click("Попробовать ещё раз");
    await page.getByLabel("Цифра кода 1").fill("1");
    await page.getByLabel("Цифра кода 2").fill("2");
    await page.getByLabel("Цифра кода 3").press("Backspace");
    assert.equal(await page.getByLabel("Цифра кода 2").inputValue(), "");
  });
  await check("Вставка кода целиком и успешное подтверждение", async () => {
    await page.locator(".otp").evaluate((el) => {
      const e = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(e, "clipboardData", {
        value: { getData: () => "1234" },
      });
      el.dispatchEvent(e);
    });
    await page
      .getByRole("heading", { name: "На каком языке тебе удобно?" })
      .waitFor();
  });
  await check("Язык, мультивыбор и отмена всех четырёх форматов", async () => {
    await click("English");
    assert.equal((await state()).language, "en");
    await click("Русский");
    await click("Продолжить");
    for (const name of ["Книги", "Манга и комиксы", "Вебтуны", "Аудиокниги"]) {
      const b = page.getByRole("button", { name, exact: true });
      let before = await b.getAttribute("aria-pressed");
      await b.click();
      assert.notEqual(await b.getAttribute("aria-pressed"), before);
      await b.click();
      assert.equal(await b.getAttribute("aria-pressed"), before);
    }
    await click("Аудиокниги");
    await click("Продолжить");
    await click("Детектив");
    await click("Продолжить");
  });
  await check("Поиск избранных по автору, пустая выдача, выбор", async () => {
    await page.getByLabel("Поиск произведений").fill("несуществующее");
    assert(await page.getByText("Не нашли. Можно выбрать позже.").isVisible());
    await page.getByLabel("Поиск произведений").fill("Кэрролл");
    await click("Выбрать: Алиса в Стране чудес");
    assert((await state()).favorites.includes("alice"));
    await click("Продолжить");
    await click("В библиотеку");
    await page
      .getByRole("heading", { name: "Для тебя", exact: true })
      .waitFor();
    assert((await state()).library.includes("alice"));
  });
  await check(
    "Карусель: стрелки, клавиатура, циклический перенос, постоянные img",
    async () => {
      const original = await page
        .locator(".carousel-poster img")
        .evaluateAll((els) =>
          els.map((x) => {
            x.dataset.identity = "stable";
            return x.src;
          }),
        );
      for (let i = 0; i < 6; i++) await click("Следующее произведение");
      await page.waitForTimeout(700);
      assert(
        (await page.locator(".carousel-caption h2").textContent()).includes(
          "Алиса",
        ),
      );
      assert.equal(
        await page
          .locator(".carousel-poster img[data-identity=stable]")
          .count(),
        6,
      );
      await page.keyboard.press("ArrowRight");
      assert(
        (await page.locator(".carousel-caption h2").textContent()).includes(
          "Шерлока",
        ),
      );
      await page.keyboard.press("ArrowLeft");
      assert.deepEqual(
        await page
          .locator(".carousel-poster img")
          .evaluateAll((els) => els.map((x) => x.src)),
        original,
      );
      assert(
        await page
          .locator(".carousel-poster img")
          .evaluateAll((els) =>
            els.every((i) => i.complete && i.naturalWidth > 0),
          ),
      );
    },
  );
  await check("Каталог: автор, пусто, фильтры, сортировка, сброс", async () => {
    await route("/catalog");
    await page.getByLabel("Поиск произведений").fill("Остин");
    assert.equal(await page.locator(".book-card").count(), 1);
    await page.getByLabel("Поиск произведений").fill("abracadabra");
    assert(
      await page
        .getByRole("heading", { name: "История ещё не нашлась" })
        .isVisible(),
    );
    await page
      .getByRole("button", { name: "Сбросить фильтры", exact: true })
      .last()
      .click();
    assert.equal(await page.locator(".book-card").count(), 6);
    await page.getByText("Аудиокниги", { exact: true }).click();
    assert.equal(await page.locator(".book-card").count(), 1);
    await page
      .getByRole("button", { name: "Сбросить фильтры", exact: true })
      .first()
      .click();
    await page.getByText("Детектив", { exact: true }).click();
    assert.equal(await page.locator(".book-card").count(), 1);
    await page
      .getByRole("button", { name: "Сбросить фильтры", exact: true })
      .first()
      .click();
    await page.getByLabel("Сортировка").selectOption("По названию");
    assert(
      (await page.locator(".card-title").first().textContent()).includes(
        "Алиса",
      ),
    );
  });
  await check(
    "Глава, реальный текст, страницы, шрифт, темы, оглавление",
    async () => {
      await route("/title/alice");
      assert.equal(await page.locator(".chapter-row").count(), 12);
      await page.locator(".chapter-row").first().click();
      assert(
        (await page.locator(".reading-page").textContent()).includes("Alice"),
      );
      await click("Дальше");
      assert.equal((await state()).progress.alice.page, 1);
      const old = await page
        .locator(".reading-page")
        .evaluate((el) => getComputedStyle(el).fontSize);
      await click("Увеличить шрифт");
      assert.notEqual(
        await page
          .locator(".reading-page")
          .evaluate((el) => getComputedStyle(el).fontSize),
        old,
      );
      await click("Светлая тема читалки");
      assert(await page.locator(".reader-light").count());
      await click("Оглавление");
      await page.locator(".reader-toc button").nth(1).click();
      assert.equal((await state()).progress.alice.chapter, 1);
    },
  );
  await check(
    "Иллюстрации: реальные области, вписывание и масштаб",
    async () => {
      await click("Иллюстрации");
      await click("Следующий кадр");
      await page.waitForTimeout(500);
      const fit = await page.evaluate(() => {
        const vp = document
          .querySelector(".illustration-viewport")
          .getBoundingClientRect();
        const p = document
          .querySelector(".illustrated-panel")
          .getBoundingClientRect();
        return (
          p.left >= vp.left &&
          p.right <= vp.right &&
          p.top >= vp.top &&
          p.bottom <= vp.bottom
        );
      });
      assert(fit);
      await click("Увеличить страницу");
      await click("Вся страница");
      await page.getByLabel("Направление чтения").selectOption("rtl");
      await click("Следующий кадр");
      await click("Закрыть читалку");
    },
  );
  await check(
    "Заметки и отзывы сохраняются, рейтинг основан на отзыве",
    async () => {
      await click("Заметки и отзывы");
      await page
        .getByLabel("Текст заметки")
        .fill('Вниз по кроличьей норе; "цитата"\nНовая строка');
      await click("Сохранить заметку");
      await page.getByLabel("Текст отзыва").fill("Удивительная история.");
      await page.getByLabel("Оценка", { exact: true }).selectOption("9");
      await click("Сохранить отзыв");
      await page.reload();
      await click("Заметки и отзывы");
      assert(
        (await page.getByLabel("Текст заметки").inputValue()).includes(
          "Новая строка",
        ),
      );
      assert(
        await page
          .getByText("Удивительная история.", { exact: true })
          .isVisible(),
      );
      assert(
        (await page.locator(".title-info .rating").textContent()).includes(
          "9.0",
        ),
      );
    },
  );
  await check(
    "Аудио: реальный play/pause, seek, скорость, таймер, download metadata",
    async () => {
      await route("/audio/alice");
      await click("Воспроизвести");
      await page.waitForTimeout(1000);
      assert(
        await page
          .locator("audio")
          .evaluate((el) => !el.paused && el.currentTime > 0),
      );
      await click("Скорость воспроизведения");
      assert.equal(
        await page.locator("audio").evaluate((el) => el.playbackRate),
        1.25,
      );
      await click("Вперёд на 15 секунд");
      assert(await page.locator("audio").evaluate((el) => el.currentTime > 15));
      await click("Таймер сна");
      assert(
        (
          await page.getByRole("button", { name: "Таймер сна" }).textContent()
        ).includes("5 мин"),
      );
      await click("Пауза");
      assert(await page.locator("audio").evaluate((el) => el.paused));
      assert(
        (
          await page.getByRole("link", { name: /Скачать/ }).textContent()
        ).includes("1.08"),
      );
    },
  );
  await check("Страница автора", async () => {
    await page
      .getByRole("button", { name: "Льюис Кэрролл", exact: false })
      .first()
      .click();
    await page
      .getByRole("heading", { name: "Льюис Кэрролл", exact: true })
      .waitFor();
    assert.equal(await page.locator(".book-card").count(), 1);
  });
  await check(
    "Полка: создание, иконка, добавление, удаление, счётчики",
    async () => {
      await route("/library");
      await click("Создать полку");
      await page.getByLabel("Название полки").fill("На вечер");
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jcwAAAABJRU5ErkJggg==",
        "base64",
      );
      await page.getByLabel("Загрузить иконку новой полки").setInputFiles({
        name: "icon.png",
        mimeType: "image/png",
        buffer: png,
      });
      await click("Создать");
      assert.equal((await state()).shelves.length, 1);
      assert((await state()).shelves[0].icon.startsWith("data:image/png"));
      await page.locator(".shelf-card").click();
      await click("Выбрать: Алиса в Стране чудес");
      await click("Выбрать: Приключения Шерлока Холмса");
      assert.equal((await state()).shelves[0].books.length, 2);
      await click("Отменить выбор: Приключения Шерлока Холмса");
      assert.equal((await state()).shelves[0].books.length, 1);
      assert((await state()).library.includes("sherlock"));
    },
  );
  await check(
    "Архив и восстановление согласованы с полками и библиотекой",
    async () => {
      await route("/profile");
      await route("/library");
      await page
        .locator(".library-grid>div")
        .filter({
          has: page.getByRole("button", {
            name: "Открыть: Алиса в Стране чудес",
            exact: true,
          }),
        })
        .getByRole("button", { name: "В архив", exact: true })
        .click();
      let s = await state();
      assert(
        !s.library.includes("alice") &&
          s.archive.includes("alice") &&
          !s.shelves[0].books.includes("alice"),
      );
      await page.getByRole("tab", { name: /Архив/ }).click();
      await click("Восстановить");
      s = await state();
      assert(s.library.includes("alice") && !s.archive.includes("alice"));
    },
  );
  await check(
    "Профиль: редактирование, настройки языка и темы, аналитика",
    async () => {
      await route("/profile");
      await click("Редактировать");
      await page.getByLabel("Имя", { exact: true }).fill("Мира");
      await page.getByLabel("Username", { exact: true }).fill("mira_reader");
      await click("Сохранить профиль");
      assert.equal((await state()).profile.name, "Мира");
      await page
        .getByRole("button", { name: "Настройки", exact: false })
        .click();
      await page.getByLabel("Язык изданий").selectOption("en");
      await page.getByLabel("Оформление").selectOption("light");
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "light",
      );
      await page.getByLabel("Оформление").selectOption("dark");
      await page.getByLabel("Период аналитики").selectOption("30");
      const dl = page.waitForEvent("download");
      await click("Экспорт аналитики");
      const file = await dl;
      assert(
        (await fs.readFile(await file.path(), "utf8")).includes("reading"),
      );
    },
  );
  await check(
    "Telegram: подключение демо, выбор, проверка, результат, дедупликация",
    async () => {
      await route("/integrations");
      await click("Настроить демосвязь");
      await click("Проверить выбранное");
      await click("Добавить в библиотеку");
      assert(
        await page
          .getByRole("heading", { name: "Демоимпорт завершён" })
          .isVisible(),
      );
      const s = await state();
      assert.equal(new Set(s.library).size, s.library.length);
      assert(s.library.includes("pride"));
      assert.equal(s.connections.telegram, "demo");
    },
  );
  await check("Notion: изменяемый mapping, предпросмотр и импорт", async () => {
    await page
      .locator(".service-list button")
      .filter({ hasText: "Notion" })
      .click();
    await click("Настроить демосвязь");
    await page.getByLabel("Поле: Название произведения").selectOption("Автор");
    assert(
      await page
        .getByRole("button", { name: "Проверить выбранное", exact: true })
        .isDisabled(),
    );
    assert(
      (await page.locator(".mapping-preview").textContent()).includes("Артур"),
    );
    await page
      .getByLabel("Поле: Название произведения")
      .selectOption("Название");
    await click("Проверить выбранное");
    await click("Добавить в библиотеку");
  });
  await check(
    "Экспорт: сервис, состав, preview, подтверждение, настоящий CSV с BOM и кавычками",
    async () => {
      await page.getByRole("tab", { name: "Экспорт", exact: true }).click();
      await page
        .locator(".service-list button")
        .filter({ hasText: "Google Sheets" })
        .click();
      await page.getByText("Аналитика", { exact: true }).click();
      await click("Предпросмотр");
      assert(await page.locator("table").isVisible());
      await click("Подтвердить демоэкспорт");
      const dl = page.waitForEvent("download");
      await click("Скачать CSV");
      const file = await dl;
      const csv = await fs.readFile(await file.path(), "utf8");
      assert.equal(csv.charCodeAt(0), 0xfeff);
      assert(csv.includes('""цитата""'));
      assert(csv.includes("Новая строка"));
      assert(csv.includes("Библиотека"));
      await fs.copyFile(await file.path(), out + "/export.csv");
    },
  );
  await check("Сохранение после перезагрузки", async () => {
    const before = await state();
    await page.reload();
    const after = await state();
    assert.deepEqual(after.library, before.library);
    assert.deepEqual(after.notes, before.notes);
    assert.deepEqual(after.shelves, before.shelves);
  });
  await check(
    "Адаптивность 1920×1080 / 1440×900 / 390×844 / 390×600 без горизонтального переполнения",
    async () => {
      for (const [width, height] of [
        [1920, 1080],
        [1440, 900],
        [390, 844],
        [390, 600],
      ]) {
        await page.setViewportSize({ width, height });
        for (const path of [
          "/",
          "/catalog",
          "/title/alice",
          "/reader/alice",
          "/audio/alice",
          "/library",
          "/profile",
          "/integrations",
        ]) {
          await route(path);
          await noOverflow();
          await page.screenshot({
            path: `${out}/${width}x${height}-${path.split("/")[1] || "home"}.png`,
          });
        }
      }
    },
  );
  await check("Мобильный swipe и фильтры", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await route("/");
    await page.locator(".hero-carousel").evaluate((el) => {
      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: [
            new Touch({
              identifier: 1,
              target: el,
              clientX: 300,
              clientY: 200,
            }),
          ],
        }),
      );
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          changedTouches: [
            new Touch({
              identifier: 1,
              target: el,
              clientX: 100,
              clientY: 200,
            }),
          ],
        }),
      );
    });
    assert(
      (await page.locator(".carousel-caption h2").textContent()).includes(
        "Шерлока",
      ),
    );
    await route("/catalog");
    await click("Фильтры");
    assert(await page.getByText("Все форматы", { exact: true }).isVisible());
    await page.getByText("Манга и комиксы", { exact: true }).click();
    assert(
      await page
        .getByRole("heading", { name: "История ещё не нашлась" })
        .isVisible(),
    );
  });
  await check("prefers-reduced-motion, увеличенный текст, фокус", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await route("/profile");
    await page.addStyleTag({ content: "html{font-size:20px}" });
    await noOverflow();
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement !== document.body));
    await page.screenshot({ path: out + "/reduced-motion-text.png" });
  });
  await check(
    "Окончания: 1 произведение, 2 произведения, 5 произведений",
    async () => {
      const original = await state();
      for (const [n, label] of [
        [1, "1 произведение"],
        [2, "2 произведения"],
        [5, "5 произведений"],
      ]) {
        await page.evaluate((n) => {
          const s = JSON.parse(localStorage.getItem("luma-studios-v1"));
          s.library = ["alice", "sherlock", "pride", "dracula", "moby"].slice(
            0,
            n,
          );
          localStorage.setItem("luma-studios-v1", JSON.stringify(s));
        }, n);
        await page.reload();
        await route("/library");
        assert.equal(await page.locator(".page-head p").textContent(), label);
      }
      await page.evaluate(
        (s) => localStorage.setItem("luma-studios-v1", JSON.stringify(s)),
        original,
      );
      await page.reload();
    },
  );
  await check(
    "Телефон: код страны внутри поля, валидация, нормализация",
    async () => {
      await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("luma-studios-v1"));
        s.signedIn = false;
        localStorage.setItem("luma-studios-v1", JSON.stringify(s));
      });
      await page.reload();
      await click("Зарегистрироваться");
      await click("Телефон");
      await page.getByLabel("Код страны").selectOption("+44");
      await page.getByLabel("Номер телефона").fill("12");
      await click("Продолжить");
      assert(
        (await page.getByRole("alert").textContent()).includes("Проверь номер"),
      );
      await page.getByLabel("Код страны").selectOption("+7");
      await page.getByLabel("Номер телефона").fill("(999) 123-45-67");
      await click("Продолжить");
      assert(
        (await page.locator(".verification p").first().textContent()).includes(
          "+79991234567",
        ),
      );
      await click("Изменить номер");
      assert(await page.getByLabel("Код страны").isVisible());
      await noOverflow();
    },
  );
  await check("Компоновка при масштабе 200% на ПК", async () => {
    const zoomContext = await browser.newContext({
      viewport: { width: 720, height: 450 },
      deviceScaleFactor: 2,
    });
    const zoomPage = await zoomContext.newPage();
    zoomPage.on("pageerror", (e) => errors.push(e.message));
    await zoomPage.addInitScript(() =>
      localStorage.setItem(
        "luma-studios-v1",
        JSON.stringify({ signedIn: true, onboarded: true }),
      ),
    );
    for (const p of [
      "/",
      "/catalog",
      "/title/alice",
      "/reader/alice",
      "/audio/alice",
      "/library",
      "/profile",
      "/integrations",
    ]) {
      await zoomPage.goto(base + "/#" + p);
      await zoomPage.waitForTimeout(120);
      assert(
        await zoomPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "overflow at 200%: " + p,
      );
    }
    await zoomPage.screenshot({ path: out + "/zoom-200-1440x900.png" });
    await zoomContext.close();
  });
  await check(
    "Предоставленные фоны: исходники и выбор ориентации",
    async () => {
      for (const width of [1440, 390]) {
        const ctx = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
        });
        const p = await ctx.newPage();
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(base);
        for (const role of ["auth", "onboarding", "home"]) {
          await p.evaluate((role) => {
            const s = JSON.parse(localStorage.getItem("luma-studios-v1"));
            s.signedIn = role !== "auth";
            s.onboarded = role === "home";
            localStorage.setItem("luma-studios-v1", JSON.stringify(s));
            location.hash = "/";
          }, role);
          await p.reload();
          const scene = p.locator("picture.scene");
          await scene.waitFor();
          await scene.locator("img").evaluate((el) => el.decode());
          await p.waitForTimeout(300);
          const meta = await scene.evaluate((el) => ({
            src: el.querySelector("img").currentSrc,
            width: el.querySelector("img").naturalWidth,
            fit: getComputedStyle(el.querySelector("img")).objectFit,
            opacity: getComputedStyle(el).opacity,
            filter: getComputedStyle(el).filter,
          }));
          assert(
            meta.src.endsWith(
              `/assets/backgrounds/${role}-${width === 390 ? "mobile" : "desktop"}.jpg`,
            ),
          );
          assert.equal(meta.width, width === 390 ? 941 : 1672);
          assert.equal(meta.fit, "cover");
          assert.equal(meta.opacity, "1");
          assert.equal(meta.filter, "none");
          assert(
            await p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
          await p.screenshot({
            path: `${out}/background-${role}-${width}.png`,
          });
        }
        await ctx.close();
      }
    },
  );
  await check("JS: ошибок нет", async () => assert.deepEqual(errors, []));
} catch (e) {
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await fs.writeFile(
    out + "/results.json",
    JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2),
  );
  await browser.close();
  console.log(
    `${checks.filter((c) => c.passed).length}/${checks.length} passed`,
  );
}
