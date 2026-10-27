// Demo titles for Luma. Names, descriptions and covers are original; covers are
// generated in code. Every demo entry carries `demo: true` and is labelled in the UI.
const raw = [
  ["lighthouse", "Хранитель последнего маяка", "Манхва", 2025, ["Фэнтези", "Приключения"], 9.1, 86, "Продолжается", 212, "Последний смотритель маяка на краю мира замечает, что свет его башни видят корабли, которых нет ни на одной карте."],
  ["eclipse", "Сто дней до затмения", "Манга", 2026, ["Мистика", "Драма"], 8.7, 24, "Продолжается", 18, "Школьница получает письмо от себя из будущего с обратным отсчётом до затмения, после которого город исчезнет."],
  ["lanterns", "Город, где не гаснут фонари", "Маньхуа", 2024, ["Фэнтези", "Романтика"], 8.4, 140, "Продолжается", 96, "В городе вечной ночи фонарщица и беглый принц ищут, кто украл у жителей рассвет."],
  ["clockmaker", "Ученица часовщика", "Манга", 2023, ["Повседневность", "Фэнтези"], 9.3, 52, "Завершён", 480, "Мастерская в горном городке чинит не только часы, но и потерянное время своих клиентов."],
  ["nameless", "Восхождение безымянного мечника", "Манхва", 2026, ["Боевик", "Фэнтези"], 8.9, 31, "Продолжается", 30, "Мечник без имени и прошлого поднимается по башне, где каждый этаж отнимает одно воспоминание."],
  ["flat6", "Соседка из шестой квартиры", "Манга", 2025, ["Романтика", "Комедия"], 8.2, 44, "Продолжается", 64, "Тихий иллюстратор и шумная соседка-барабанщица делят одну стену и один дедлайн."],
  ["redsky", "Код красного неба", "Манхва", 2024, ["Фантастика", "Боевик"], 8.6, 118, "Продолжается", 151, "Когда небо над мегаполисом краснеет, хакер-самоучка единственный понимает, что это сообщение."],
  ["dragoncook", "Повар для дракона", "Маньхуа", 2025, ["Комедия", "Фэнтези"], 9.0, 77, "Продолжается", 133, "Деревенский повар попадает в логово дракона и должен каждый день готовить блюдо, которое тот ещё не пробовал."],
  ["backstage", "Тень за кулисами", "Манга", 2022, ["Детектив", "Драма"], 8.8, 40, "Завершён", 260, "В старом театре во время каждой премьеры пропадает одна вещь. Молодой суфлёр ведёт своё расследование."],
  ["northwind", "Академия северных ветров", "Манхва", 2023, ["Фэнтези", "Школа"], 8.5, 165, "Продолжается", 330, "Девочка без магического дара поступает в академию погодных магов по ошибке в списках."],
  ["lastexam", "Последний экзамен", "Манхва", 2026, ["Триллер", "Школа"], 8.3, 22, "Продолжается", 20, "Выпускной экзамен идёт уже третьи сутки, а выйти из аудитории не может никто."],
  ["glassgarden", "Сад из стекла", "Маньхуа", 2021, ["Романтика", "Драма"], 9.2, 120, "Завершён", 410, "Наследница стекольной мануфактуры выращивает сад, который нельзя трогать, и садовника, который всё время его трогает."],
  ["wingless", "Пилот без крыльев", "Комикс", 2024, ["Приключения"], 8.0, 36, "Продолжается", 41, "Бывший пилот воздушных гонок собирает команду из списанных машин и тех, кого списали вместе с ними."],
  ["level9", "Девятый уровень подземелья", "Манхва", 2025, ["Боевик", "Игры"], 8.9, 98, "Продолжается", 288, "Игрок застревает на девятом уровне подземелья, которого не было в патче, и начинает строить там город."],
  ["teahouse", "Чайная на краю света", "Манга", 2024, ["Повседневность"], 9.4, 28, "Продолжается", 150, "Пожилая хозяйка чайной на последней станции поезда выслушивает пассажиров, которым некуда ехать дальше."],
  ["heiress", "Наследница опальной семьи", "Манхва", 2026, ["Романтика", "Исторический"], 8.6, 15, "Продолжается", 74, "Дочь сосланного министра возвращается в столицу под чужим именем, чтобы вернуть семье честь."],
  ["nightbirds", "Охота на ночных птиц", "Маньхуа", 2023, ["Мистика", "Боевик"], 8.1, 102, "Продолжается", 120, "Ночью над городом летают птицы, которых видят только должники. Сборщица долгов видит их всех."],
  ["fivesec", "Пять секунд до финиша", "Манга", 2025, ["Спорт", "Драма"], 8.7, 56, "Продолжается", 92, "Спринтер после травмы учится бегать заново вместе с командой, которую он раньше обгонял."],
  ["archivist", "Архивариус потерянных миров", "Маньхуа", 2026, ["Фэнтези"], 8.4, 12, "Анонс", 9, "В архиве хранятся миры, которые никто не дописал. Новый архивариус решает дописать один."],
  ["exvillain", "Мой сосед — бывший злодей", "Манхва", 2025, ["Комедия", "Фэнтези"], 8.8, 63, "Продолжается", 177, "Тёмный властелин на пенсии снимает квартиру этажом ниже и очень старается быть хорошим соседом."],
  ["polar", "Станция «Полярная»", "Комикс", 2022, ["Фантастика", "Триллер"], 8.2, 24, "Завершён", 66, "Смена на полярной станции заканчивается, но вертолёт за ними прилетает пустым."],
  ["chosensword", "Меч, который выбрал меня", "Маньхуа", 2024, ["Боевик", "Комедия"], 7.9, 154, "Продолжается", 201, "Легендарный меч выбирает хозяина и сразу жалеет: тот боится крови и работает бухгалтером."],
  ["summerletters", "Письма из лета", "Манга", 2021, ["Драма", "Романтика"], 9.1, 33, "Завершён", 240, "Каждое лето в почтовом ящике появляется письмо от девочки, которая уехала десять лет назад."],
  ["coldflame", "Рыцарь холодного пламени", "Манхва", 2024, ["Фэнтези", "Боевик"], 8.6, 129, "Продолжается", 305, "Рыцарь, чьё пламя не греет, охраняет границу от зимы, которая пришла навсегда."],
];

const hues = [212, 28, 268, 186, 4, 330, 150, 44, 236, 300, 196, 18, 120, 252, 36, 344, 176, 58, 284, 8, 200, 316, 92, 224];

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function wrap(title, max) {
  const words = title.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

// Abstract scene: sky gradient, a luminous disc, layered ridges or towers, title type.
export function makeCover(id, title, hue, type) {
  const r = rng(hash(id));
  const h2 = (hue + 40 + r() * 60) % 360;
  const sky1 = `hsl(${hue} 55% ${14 + r() * 8}%)`;
  const sky2 = `hsl(${h2} 60% ${38 + r() * 14}%)`;
  const glow = `hsl(${(hue + 180) % 360} 80% 78%)`;
  const cx = 60 + r() * 180;
  const cy = 90 + r() * 110;
  const rad = 34 + r() * 46;
  let layers = "";
  const towers = r() > 0.5;
  for (let l = 0; l < 3; l++) {
    const base = 250 + l * 55;
    const shade = `hsl(${hue} 40% ${10 + l * 4}% / ${0.7 + l * 0.1})`;
    if (towers) {
      let x = -10;
      let d = `M-10 450 `;
      while (x < 310) {
        const w = 18 + r() * 34;
        const top = base - r() * (70 - l * 15);
        d += `L${x.toFixed(0)} ${top.toFixed(0)} L${(x + w).toFixed(0)} ${top.toFixed(0)} `;
        x += w;
      }
      d += "L310 450 Z";
      layers += `<path d="${d}" fill="${shade}"/>`;
    } else {
      let d = `M-10 ${base} `;
      for (let x = 0; x <= 320; x += 40) d += `Q${x - 20} ${(base - 20 - r() * 60).toFixed(0)} ${x} ${(base - r() * 30).toFixed(0)} `;
      d += "L320 450 L-10 450 Z";
      layers += `<path d="${d}" fill="${shade}"/>`;
    }
  }
  let stars = "";
  for (let i = 0; i < 26; i++)
    stars += `<circle cx="${(r() * 300).toFixed(0)}" cy="${(r() * 220).toFixed(0)}" r="${(r() * 1.4 + 0.3).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  const lines = wrap(title, 13);
  const fs = lines.length > 3 ? 25 : 29;
  const y0 = 392 - (lines.length - 1) * (fs + 4);
  const text = lines
    .map((ln, i) => `<text x="18" y="${y0 + i * (fs + 4)}" font-size="${fs}">${esc(ln)}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="${glow}" stop-opacity=".9"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></linearGradient></defs><rect width="300" height="450" fill="url(#s)"/>${stars}<circle cx="${cx}" cy="${cy}" r="${rad * 2.4}" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="${glow}"/>${layers}<rect width="300" height="450" fill="url(#f)"/><g font-family="Arial, sans-serif" font-weight="700" fill="#fff" letter-spacing="-.5">${text}</g></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const DAY = 86400000;
const NOW = Date.UTC(2026, 9, 27, 9);

export const demoTitles = raw.map(([id, title, type, year, genres, rating, chapterCount, status, views, description], i) => {
  const r = rng(hash(id + "meta"));
  return {
    id,
    title,
    original: title,
    author: "Студия Luma (демо)",
    authorId: "luma",
    format: type === "Комикс" ? "Манга и комиксы" : type === "Манхва" || type === "Маньхуа" ? "Вебтуны" : "Манга и комиксы",
    type,
    genre: genres[0],
    genres,
    year,
    rating,
    chapterCount,
    status,
    views: views * 1000 + Math.round(r() * 999),
    likes: Math.round(views * (40 + r() * 60)),
    bookmarks: Math.round(views * (8 + r() * 12)),
    description,
    age: r() > 0.7 ? "16+" : "12+",
    updated: NOW - Math.round(r() * 9 * DAY) - i * 3600000,
    added: Date.UTC(year, Math.floor(r() * 10), 1 + Math.floor(r() * 27)),
    hue: hues[i % hues.length],
    demo: true,
    comic: true,
    coverData: makeCover(id, title, hues[i % hues.length], type),
  };
});

export function chapterList(t) {
  if (!t.comic) return [];
  return Array.from({ length: t.chapterCount }, (_, i) => ({
    n: i + 1,
    title: i === 0 ? "Начало" : "",
    date: t.updated - (t.chapterCount - 1 - i) * 7 * DAY,
  }));
}

// Tags, rating and bookmark distributions are generated deterministically for the demo.
const tagPool = [
  "Сильный ГГ", "ГГ девушка", "Магия", "Другой мир", "Система", "Монстры", "Дружба", "Месть",
  "Путешествия", "Загадки", "Кулинария", "Исторический сеттинг", "Антигерой", "Медленная романтика",
  "Найдённая семья", "Башня", "Академия", "Город", "Ночь", "Время",
];
export function decorate(t) {
  const r = rng(hash(t.id + "tags"));
  const tags = [];
  while (tags.length < 5 + Math.floor(r() * 4)) {
    const x = tagPool[Math.floor(r() * tagPool.length)];
    if (!tags.includes(x)) tags.push(x);
  }
  const votes = Math.round(t.views / (18 + r() * 10));
  const peak = Math.round(t.rating);
  const dist = Array.from({ length: 10 }, (_, i) => {
    const s = 10 - i;
    return Math.round(votes * Math.max(0.004, Math.exp(-Math.abs(s - peak) * 0.9)) * (0.8 + r() * 0.4));
  });
  const sum = dist.reduce((a, b) => a + b, 0);
  const shelves = [0.34, 0.27, 0.22, 0.09, 0.08].map((k) => Math.round(t.bookmarks * k * (0.8 + r() * 0.4)));
  return Object.assign(t, { tags, votes: sum, dist, shelfStats: shelves, volumeSize: 8 + Math.floor(r() * 5) });
}

// Wide 16:9 backdrop for the home billboard, drawn in code from the title's palette.
const backdropCache = {};
export function makeBackdrop(id, hue) {
  if (backdropCache[id]) return backdropCache[id];
  const r = rng(hash(id + "wide"));
  const W = 1600, H = 900;
  const sky1 = `hsl(${hue} 55% ${10 + r() * 6}%)`;
  const sky2 = `hsl(${(hue + 40 + r() * 50) % 360} 60% ${30 + r() * 14}%)`;
  const glow = `hsl(${(hue + 180) % 360} 80% 78%)`;
  const cx = 900 + r() * 500, cy = 180 + r() * 220, rad = 70 + r() * 70;
  let stars = "";
  for (let i = 0; i < 90; i++) stars += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 520).toFixed(0)}" r="${(r() * 1.6 + 0.3).toFixed(1)}" fill="#fff" opacity="${(0.2 + r() * 0.6).toFixed(2)}"/>`;
  let layers = "";
  const towers = r() > 0.5;
  for (let l = 0; l < 4; l++) {
    const base = 560 + l * 90;
    const shade = `hsl(${hue} 40% ${8 + l * 3}% / ${0.75 + l * 0.08})`;
    let d;
    if (towers) {
      let x = -10;
      d = `M-10 ${H} `;
      while (x < W + 10) {
        const w = 30 + r() * 70;
        const top = base - r() * (180 - l * 35);
        d += `L${x.toFixed(0)} ${top.toFixed(0)} L${(x + w).toFixed(0)} ${top.toFixed(0)} `;
        x += w;
      }
      d += `L${W + 10} ${H} Z`;
    } else {
      d = `M-10 ${base} `;
      for (let x = 0; x <= W + 80; x += 90) d += `Q${x - 45} ${(base - 40 - r() * 150).toFixed(0)} ${x} ${(base - r() * 60).toFixed(0)} `;
      d += `L${W + 10} ${H} L-10 ${H} Z`;
    }
    layers += `<path d="${d}" fill="${shade}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="${glow}" stop-opacity=".85"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/>${stars}<circle cx="${cx}" cy="${cy}" r="${rad * 3}" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="${glow}"/>${layers}</svg>`;
  return (backdropCache[id] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
}
