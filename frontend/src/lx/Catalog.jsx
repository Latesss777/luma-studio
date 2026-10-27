import React, { useMemo, useState } from "react";
import { SlidersHorizontal, X, ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, Search, Sparkles, Plus, Minus } from "lucide-react";
import { all, types, allGenres, allTags } from "../data/books";
import { go, useStore } from "../shared/store";
import { TitleCard } from "./ui";
import { collections } from "./Home";

const sorts = [
  ["views", "По популярности"],
  ["rating", "По рейтингу"],
  ["votes", "По количеству оценок"],
  ["likes", "По лайкам"],
  ["bookmarks", "По закладкам"],
  ["added", "По дате добавления"],
  ["updated", "По дате обновления"],
  ["chapterCount", "По количеству глав"],
];
const statuses = ["Продолжается", "Завершён", "Анонс"];
const ages = ["12+", "16+"];
const listKeys = ["type", "genre", "nogenre", "tag", "notag", "status", "age"];
const numKeys = ["chFrom", "chTo", "yFrom", "yTo", "rFrom", "rTo"];

function parse(query) {
  const p = new URLSearchParams(query);
  const f = { q: p.get("q") || "", sort: p.get("sort") || "views", dir: p.get("dir") || "desc", collection: p.get("collection") || "", hideBm: p.get("hidebm") === "1" };
  listKeys.forEach((k) => (f[k] = p.getAll(k)));
  numKeys.forEach((k) => (f[k] = p.get(k) || ""));
  return f;
}
function build(f) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.sort !== "views") p.set("sort", f.sort);
  if (f.dir !== "desc") p.set("dir", f.dir);
  if (f.collection) p.set("collection", f.collection);
  if (f.hideBm) p.set("hidebm", "1");
  listKeys.forEach((k) => f[k].forEach((v) => p.append(k, v)));
  numKeys.forEach((k) => f[k] !== "" && p.set(k, f[k]));
  const s = p.toString();
  return "/catalog" + (s ? "?" + s : "");
}
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const inRange = (v, a, b) => (a === "" || v >= Number(a)) && (b === "" || v <= Number(b));

function Group({ title, count, children, open: init = false }) {
  const [open, setOpen] = useState(init);
  return (
    <div className={`lx-acc ${open ? "open" : ""}`}>
      <button className="lx-acc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          {title}
          {count > 0 && <i className="lx-acc-count">{count}</i>}
        </span>
        <ChevronDown size={18} />
      </button>
      {open && <div className="lx-acc-body">{children}</div>}
    </div>
  );
}

// Three-state chip: off → include → exclude → off.
function TriChips({ items, inc, exc, onChange }) {
  return (
    <div className="lx-chips lx-chips-wrap">
      {items.map((g) => {
        const st = inc.includes(g) ? "inc" : exc.includes(g) ? "exc" : "";
        return (
          <button
            key={g}
            className={`lx-tri ${st}`}
            aria-label={`${g}: ${st === "inc" ? "включён" : st === "exc" ? "исключён" : "не выбран"}`}
            onClick={() => onChange(g, st)}
          >
            {st === "inc" && <Plus size={13} />}
            {st === "exc" && <Minus size={13} />}
            {g}
          </button>
        );
      })}
    </div>
  );
}

function Range({ label, from, to, onFrom, onTo, quick, step = 1 }) {
  return (
    <div className="lx-range">
      {label && <span className="lx-range-label">{label}</span>}
      <div className="lx-range-inputs">
        <input type="number" step={step} inputMode="decimal" placeholder="От" aria-label={`${label || ""} от`} value={from} onChange={(e) => onFrom(e.target.value)} />
        <span>—</span>
        <input type="number" step={step} inputMode="decimal" placeholder="До" aria-label={`${label || ""} до`} value={to} onChange={(e) => onTo(e.target.value)} />
      </div>
      {quick && (
        <div className="lx-chips lx-chips-wrap lx-quick">
          {quick.map(([l, a, b]) => (
            <button key={l} className={from === a && to === b ? "active" : ""} onClick={() => (onFrom(a), onTo(b))}>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Catalog({ query }) {
  const f = parse(query);
  const { state, update, setToast } = useStore();
  const [panel, setPanel] = useState(() => window.matchMedia?.("(min-width: 1100px)").matches ?? true);
  const set = (patch) => go(build({ ...f, ...patch }));
  const coll = collections.find((c) => c.id === f.collection);
  const bm = state.bookmarks || {};
  const list = useMemo(() => {
    const s = f.q.toLowerCase();
    const out = all.filter(
      (t) =>
        (!s || (t.title + " " + t.original + " " + t.author).toLowerCase().includes(s)) &&
        (!f.type.length || f.type.includes(t.type)) &&
        f.genre.every((g) => t.genres.includes(g)) &&
        !f.nogenre.some((g) => t.genres.includes(g)) &&
        f.tag.every((g) => t.tags.includes(g)) &&
        !f.notag.some((g) => t.tags.includes(g)) &&
        (!f.status.length || f.status.includes(t.status)) &&
        (!f.age.length || f.age.includes(t.age)) &&
        inRange(t.chapterCount, f.chFrom, f.chTo) &&
        inRange(t.year, f.yFrom, f.yTo) &&
        inRange(t.rating, f.rFrom, f.rTo) &&
        (!f.hideBm || !bm[t.id]) &&
        (!coll || coll.pick(t)),
    );
    out.sort((a, b) => (f.dir === "asc" ? a[f.sort] - b[f.sort] : b[f.sort] - a[f.sort]));
    return out;
  }, [query, state.bookmarks]);
  const tri = (incKey, excKey) => (g, st) =>
    set(st === "" ? { [incKey]: [...f[incKey], g] } : st === "inc" ? { [incKey]: toggle(f[incKey], g), [excKey]: [...f[excKey], g] } : { [excKey]: toggle(f[excKey], g) });
  const presets = state.filterPresets || [];
  const savePreset = () => {
    const q = build(f).split("?")[1];
    if (!q) return setToast("Сначала выберите фильтры");
    const name = `Шаблон ${presets.length + 1}`;
    update((s) => ({ filterPresets: [...(s.filterPresets || []), { id: crypto.randomUUID(), name, query: q }] }));
    setToast(`Сохранено: ${name}`);
  };
  const active =
    f.genre.length + f.nogenre.length + f.tag.length + f.notag.length + f.status.length + f.age.length + numKeys.filter((k) => f[k] !== "").length + (f.hideBm ? 1 : 0);
  return (
    <div className="lx-page lx-catalog2">
      <h1 className="lx-h1 lx-h1-center">{coll ? coll.name : "Каталог"}</h1>
      <div className="lx-ctoolbar">
        <div className="lx-sort">
          <label className="lx-select">
            <span className="lx-sr">Сортировка</span>
            <select id="lx-sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
              {sorts.map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </label>
          <button
            className="lx-icon"
            aria-label={f.dir === "desc" ? "По убыванию, переключить на возрастание" : "По возрастанию, переключить на убывание"}
            onClick={() => set({ dir: f.dir === "desc" ? "asc" : "desc" })}
          >
            {f.dir === "desc" ? <ArrowDownWideNarrow size={18} /> : <ArrowUpNarrowWide size={18} />}
          </button>
        </div>
        <div className="lx-chips lx-chips-scroll lx-ctypes">
          {types.map((t) => (
            <button key={t} className={f.type.includes(t) ? "active" : ""} aria-pressed={f.type.includes(t)} onClick={() => set({ type: toggle(f.type, t) })}>
              {t === "Книга" ? "Книги" : t}
            </button>
          ))}
        </div>
        <button className={`lx-pill ${panel ? "active" : ""}`} aria-expanded={panel} onClick={() => setPanel(!panel)}>
          <SlidersHorizontal size={17} />
          Фильтры{active ? ` · ${active}` : ""}
        </button>
      </div>
      <div className="lx-colls">
        <Sparkles size={18} className="lx-muted" aria-hidden="true" />
        {collections.map((c) => (
          <button key={c.id} className={f.collection === c.id ? "active" : ""} onClick={() => set({ collection: f.collection === c.id ? "" : c.id })}>
            {c.name}
          </button>
        ))}
      </div>
      <div className={`lx-cbody ${panel ? "with-panel" : ""}`}>
        <div className="lx-cresults">
          {(f.q || active > 0 || f.type.length > 0 || coll) && (
            <p className="lx-found">
              Найдено: {list.length}
              <button className="lx-link" onClick={() => go("/catalog")}>Сбросить всё</button>
            </p>
          )}
          <div className="lx-grid">
            {list.map((t) => (
              <TitleCard key={t.id} t={t} />
            ))}
            {!list.length && (
              <div className="lx-empty">
                <h2>По этим условиям ничего нет</h2>
                <p>Уберите часть фильтров или поищите по другому названию.</p>
                <button className="lx-btn" onClick={() => go("/catalog")}>Сбросить фильтры</button>
              </div>
            )}
          </div>
        </div>
        {panel && (
          <aside className="lx-fpanel" aria-label="Фильтры">
            <div className="lx-fpanel-top">
              <button className="lx-link" onClick={savePreset}>Сохранить шаблон</button>
              <button className="lx-link" onClick={() => go("/catalog")}>Сбросить фильтры</button>
              <button className="lx-icon lx-fclose" aria-label="Закрыть фильтры" onClick={() => setPanel(false)}>
                <X size={18} />
              </button>
            </div>
            {presets.length > 0 && (
              <div className="lx-chips lx-chips-wrap lx-presets">
                {presets.map((p) => (
                  <span key={p.id} className="lx-preset">
                    <button onClick={() => go("/catalog?" + p.query)}>{p.name}</button>
                    <button aria-label={`Удалить ${p.name}`} onClick={() => update((s) => ({ filterPresets: s.filterPresets.filter((x) => x.id !== p.id) }))}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <form className="lx-fsearch" onSubmit={(e) => e.preventDefault()}>
              <Search size={16} aria-hidden="true" />
              <input id="lx-fsearch" type="search" placeholder="Поиск по названию" aria-label="Поиск по названию" defaultValue={f.q} onChange={(e) => set({ q: e.target.value })} />
            </form>
            <Group title="Жанры" count={f.genre.length + f.nogenre.length}>
              <p className="lx-hint">Нажмите один раз, чтобы включить, второй раз, чтобы исключить.</p>
              <TriChips items={allGenres} inc={f.genre} exc={f.nogenre} onChange={tri("genre", "nogenre")} />
            </Group>
            <Group title="Категории" count={f.tag.length + f.notag.length}>
              <TriChips items={allTags} inc={f.tag} exc={f.notag} onChange={tri("tag", "notag")} />
            </Group>
            <Group title="Статус" count={f.status.length}>
              <div className="lx-chips lx-chips-wrap">
                {statuses.map((s) => (
                  <button key={s} className={f.status.includes(s) ? "active" : ""} aria-pressed={f.status.includes(s)} onClick={() => set({ status: toggle(f.status, s) })}>
                    {s}
                  </button>
                ))}
              </div>
            </Group>
            <div className="lx-acc open lx-acc-static">
              <div className="lx-acc-head"><span>Количество глав</span></div>
              <div className="lx-acc-body">
                <Range
                  from={f.chFrom}
                  to={f.chTo}
                  onFrom={(v) => set({ chFrom: v })}
                  onTo={(v) => set({ chTo: v })}
                  quick={[["<20", "", "19"], ["<50", "", "49"], ["50+", "50", ""], ["100+", "100", ""]]}
                />
              </div>
            </div>
            <Group title="Расширенная фильтрация" count={["yFrom", "yTo", "rFrom", "rTo"].filter((k) => f[k] !== "").length + f.age.length}>
              <Range label="Год выпуска" from={f.yFrom} to={f.yTo} onFrom={(v) => set({ yFrom: v })} onTo={(v) => set({ yTo: v })} />
              <Range label="Оценка" step={0.1} from={f.rFrom} to={f.rTo} onFrom={(v) => set({ rFrom: v })} onTo={(v) => set({ rTo: v })} />
              <span className="lx-range-label">Возраст</span>
              <div className="lx-chips lx-chips-wrap">
                {ages.map((a) => (
                  <button key={a} className={f.age.includes(a) ? "active" : ""} aria-pressed={f.age.includes(a)} onClick={() => set({ age: toggle(f.age, a) })}>
                    {a}
                  </button>
                ))}
              </div>
            </Group>
            <Group title="Исключения" count={f.hideBm ? 1 : 0}>
              <label className="lx-switch">
                <input type="checkbox" checked={f.hideBm} onChange={(e) => set({ hideBm: e.target.checked })} />
                <span>Скрыть тайтлы из моих закладок</span>
              </label>
            </Group>
          </aside>
        )}
      </div>
    </div>
  );
}
