/** Continuous recording of live browser interactions; no screen montage. */
import { launch, base } from "./browser.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
const mode = process.argv[2] || "desktop";
const mobile = mode === "mobile";
const destination = path.resolve(process.env.LUMA_OUTPUT || "output");
await fs.mkdir(destination, { recursive: true });
const work = path.resolve("work/record-" + mode);
await fs.mkdir(work, { recursive: true });
// A scaled iframe keeps the real 432×768 mobile viewport and lets the
// compositor record a full 1080×1920 frame without resampling a low-res video.
const viewport = mobile
  ? { width: 1080, height: 1920 }
  : { width: 1920, height: 1080 };
const browser = await launch();
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  hasTouch: mobile,
  acceptDownloads: true,
});
const browserPage = await context.newPage();
const errors = [];
browserPage.on("pageerror", (e) => errors.push(e.message));
browserPage.setDefaultTimeout(12000);
let page = browserPage;
if (mobile) {
  await browserPage.goto(base);
  await browserPage.setContent(
    `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}iframe{display:block;width:432px;height:768px;border:0;transform:scale(2.5);transform-origin:top left}</style></head><body><iframe name="luma-camera" src="${base}"></iframe></body></html>`,
    { waitUntil: "load" },
  );
  page = browserPage.frame({ name: "luma-camera" });
} else await page.goto(base);
await page.evaluate(() => document.fonts.ready);
await browserPage.waitForTimeout(800);
const frames = [];
const writes = [];
let recording = true;
let count = 0;
let durationEnd = 0;
const start = performance.now();
const epochStart = Date.now() / 1000;
const camera = await context.newCDPSession(browserPage);
let firstResolve;
const firstFrame = new Promise((resolve) => (firstResolve = resolve));
camera.on("Page.screencastFrame", (frame) => {
  writes.push(
    camera.send("Page.screencastFrameAck", { sessionId: frame.sessionId }),
  );
  if (!recording) return;
  const name = `frame-${String(count++).padStart(6, "0")}.jpg`;
  frames.push({
    name,
    time: Math.max(0, frame.metadata.timestamp - epochStart),
  });
  writes.push(
    fs.writeFile(path.join(work, name), Buffer.from(frame.data, "base64")),
  );
  firstResolve();
});
await camera.send("Page.startScreencast", {
  format: "jpeg",
  quality: 90,
  maxWidth: viewport.width,
  maxHeight: viewport.height,
  everyNthFrame: 1,
});
await firstFrame;
const pace = Number(process.env.LUMA_RECORD_PACE || 1);
const pause = (s = 1.7) => browserPage.waitForTimeout(s * 1000 * pace);
async function view(el) {
  await el.evaluate((e) =>
    e.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    }),
  );
  await pause(0.45);
}
async function tap(name, after = 1.7) {
  const el = page
    .getByRole("button", { name, exact: true })
    .or(page.getByRole("tab", { name, exact: true }))
    .first();
  await view(el);
  await el.click();
  await pause(after);
}
async function fill(label, text) {
  const el = page.getByLabel(label, { exact: true });
  await view(el);
  await el.fill("");
  await el.pressSequentially(text, { delay: 55 });
  await pause(0.6);
}
async function nav(label) {
  const el = page
    .locator(mobile ? ".mobile-nav" : ".sidebar nav")
    .getByRole("button", { name: label, exact: true });
  await el.click();
  await pause(2);
}
const timeline = [];
function scene(name) {
  timeline.push({ name, seconds: (performance.now() - start) / 1000 });
  console.log(mode, name);
}
try {
  scene("Вход");
  await pause(3);
  await tap("Зарегистрироваться", 2);
  await tap("Почта");
  await fill("Электронная почта", "mira@example.com");
  await tap("Продолжить");
  for (let i = 1; i <= 4; i++) {
    await page.getByLabel("Цифра кода " + i).fill("9");
    await pause(0.2);
  }
  await pause(1.8);
  await tap("Попробовать ещё раз", 0.8);
  for (let i = 1; i <= 4; i++) {
    await page.getByLabel("Цифра кода " + i).fill(String(i));
    await pause(0.35);
  }
  await page
    .getByRole("heading", { name: "На каком языке тебе удобно?" })
    .waitFor();
  await pause(2);
  scene("Онбординг");
  await tap("Русский", 0.8);
  await tap("Продолжить");
  await tap("Манга и комиксы", 0.9);
  await tap("Манга и комиксы", 0.8);
  await tap("Аудиокниги", 1);
  await tap("Продолжить");
  await tap("Детектив", 1);
  await tap("Продолжить");
  await fill("Поиск произведений", "Кэрролл");
  await tap("Выбрать: Алиса в Стране чудес");
  await tap("Продолжить");
  await tap("В библиотеку", 3.4);
  scene("Главная и карусель");
  await pause(2.5);
  await tap("Следующее произведение", 1.3);
  await tap("Следующее произведение", 1.3);
  await tap("Предыдущее произведение", 1.3);
  await tap("Предыдущее произведение", 1.3);
  await tap("Открыть историю", 2.5);
  scene("Произведение и главы");
  await pause(1);
  const chapter = page.locator(".chapter-row").first();
  await view(chapter);
  await pause(1.5);
  await chapter.click();
  await pause(3);
  scene("Читалка");
  await tap("Увеличить шрифт", 1);
  await tap("Светлая тема читалки", 1.5);
  await tap("Дальше", 2);
  await tap("Оглавление", 1.5);
  await page.locator(".reader-toc button").nth(1).click();
  await pause(1.8);
  await tap("Иллюстрации", 2.5);
  await tap("Следующий кадр", 2);
  await tap("Следующий кадр", 2);
  await tap("Следующий кадр", 2);
  await tap("Вся страница", 1.8);
  await tap("Закрыть читалку", 1.8);
  scene("Аудио");
  await tap("Слушать", 2);
  await tap("Воспроизвести", 3);
  await tap("Скорость воспроизведения", 1.4);
  await tap("Вперёд на 15 секунд", 1.3);
  await tap("Таймер сна", 1.4);
  await tap("Пауза", 1.5);
  scene("Заметки и отзывы");
  await fill("Текст заметки", "Любопытство открывает новые миры.");
  await tap("Сохранить заметку", 1.4);
  await fill("Текст отзыва", "История, к которой хочется вернуться.");
  await page.getByLabel("Оценка", { exact: true }).selectOption("9");
  await tap("Сохранить отзыв", 2);
  scene("Библиотека и полка");
  await nav("Библиотека");
  await tap("Создать полку", 1);
  await fill("Название полки", "Для долгих вечеров");
  const icon = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jcwAAAABJRU5ErkJggg==",
    "base64",
  );
  await page
    .getByLabel("Загрузить иконку новой полки")
    .setInputFiles({ name: "icon.png", mimeType: "image/png", buffer: icon });
  await pause(0.7);
  await tap("Создать", 1.8);
  await page.locator(".shelf-card").click();
  await pause(1.5);
  await tap("Выбрать: Алиса в Стране чудес", 1);
  await tap("Выбрать: Приключения Шерлока Холмса", 1.2);
  await tap("Все полки", 2);
  scene("Профиль и аналитика");
  await nav("Профиль");
  await tap("Редактировать", 1);
  await fill("Имя", "Мира");
  await fill("Username", "mira_reader");
  await tap("Сохранить профиль", 1.5);
  const settings = page.getByRole("button", { name: /^Настройки/ });
  await view(settings);
  await settings.click();
  await pause(1.5);
  await page.getByLabel("Язык изданий").selectOption("en");
  await pause(1);
  const chart = page.locator(".analytics");
  await view(chart);
  await pause(2.5);
  await page.getByLabel("Период аналитики").selectOption("30");
  await pause(1.5);
  scene("Telegram");
  const integration = page
    .locator(".profile-shortcuts>button")
    .filter({ hasText: "Интеграции" });
  await view(integration);
  await integration.click();
  await pause(2);
  await tap("Настроить демосвязь", 2);
  await tap("Проверить выбранное", 2);
  await tap("Добавить в библиотеку", 2.5);
  scene("Notion");
  const notion = page
    .locator(".service-list button")
    .filter({ hasText: "Notion" });
  await view(notion);
  await notion.click();
  await pause(1.5);
  await tap("Настроить демосвязь", 1.5);
  await page.getByLabel("Поле: Название произведения").selectOption("Автор");
  await pause(1.5);
  await page.getByLabel("Поле: Название произведения").selectOption("Название");
  await tap("Проверить выбранное", 1.5);
  await tap("Добавить в библиотеку", 2);
  scene("Экспорт");
  await tap("Экспорт", 1.5);
  const sheets = page
    .locator(".service-list button")
    .filter({ hasText: "Google Sheets" });
  await view(sheets);
  await sheets.click();
  await pause(1.5);
  await tap("Предпросмотр", 2.3);
  await tap("Подтвердить демоэкспорт", 2);
  const download = browserPage.waitForEvent("download");
  await tap("Скачать CSV", 2);
  await (await download).saveAs(path.join(work, "Luma_Studios.csv"));
  scene("Финал");
  await nav("Главная");
  await pause(4);
} catch (e) {
  console.error(e);
  errors.push(e.message);
} finally {
  durationEnd = (performance.now() - start) / 1000;
  recording = false;
  await camera.send("Page.stopScreencast");
  await Promise.all(writes);
  await fs.writeFile(
    path.join(work, "timeline.json"),
    JSON.stringify(
      {
        mode,
        timeline,
        errors,
        frames: frames.length,
        duration: durationEnd,
        captureMethod: "Chromium compositor frames on paints",
      },
      null,
      2,
    ),
  );
  await context.close();
  await browser.close();
}
if (errors.length) throw Error(errors.join("\n"));
const end = durationEnd;
const concat =
  frames
    .map(
      (f, i) =>
        `file '${f.name}'\nduration ${Math.max(0.001, (frames[i + 1]?.time ?? end) - f.time).toFixed(6)}`,
    )
    .join("\n") + `\nfile '${frames.at(-1).name}'\n`;
await fs.writeFile(path.join(work, "frames.txt"), concat);
const output = path.join(
  destination,
  `Luma_Studios_${mobile ? "Mobile" : "Desktop"}.mp4`,
);
console.log("Encoding", output, frames.length, "frames");
const result = await new Promise((resolve) => {
  const ff = spawn(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "warning",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      path.join(work, "frames.txt"),
      "-vf",
      "fps=30,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      "-color_range",
      "tv",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
    { stdio: "inherit" },
  );
  ff.on("exit", resolve);
});
if (result !== 0) throw Error("ffmpeg failed");
console.log("DONE", output);
