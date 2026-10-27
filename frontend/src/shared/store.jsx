import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
const KEY = "luma-studios-v2";
const initial = {
  signedIn: true,
  onboarded: true,
  bookmarks: {},
  readChapters: {},
  profile: {
    name: "Алекс",
    username: "alex",
    bio: "Собираю истории, к которым хочется возвращаться.",
    avatar: "",
  },
  language: "ru",
  theme: "dark",
  formats: ["Книги"],
  genres: ["Фэнтези"],
  favorites: [],
  library: [],
  archive: [],
  shelves: [],
  notes: {},
  reviews: {},
  progress: {},
  events: [],
  connections: {},
  imports: [],
};
const Context = createContext(null);
export function Provider({ children }) {
  const [state, setState] = useState(() => {
    try {
      let saved = JSON.parse(localStorage.getItem(KEY));
      return saved
        ? {
            ...initial,
            ...saved,
            profile: { ...initial.profile, ...saved.profile },
          }
        : initial;
    } catch {
      return initial;
    }
  });
  const [toast, setToast] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setToast("Память браузера заполнена. Изменения пока не сохранены.");
    }
    document.documentElement.dataset.theme = state.theme;
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  const update = useCallback(
    (patch) =>
      setState((s) => ({
        ...s,
        ...(typeof patch === "function" ? patch(s) : patch),
      })),
    [],
  );
  const addLibrary = (id) =>
    update((s) => ({
      library: [...new Set([...s.library, id])],
      archive: s.archive.filter((x) => x !== id),
    }));
  const event = (type, book, extra = {}) =>
    update((s) => ({
      events: [...s.events, { type, book, time: Date.now(), ...extra }],
    }));
  return (
    <Context.Provider
      value={{ state, update, toast, setToast, addLibrary, event }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
export function go(path) {
  location.hash = path;
  window.scrollTo({ top: 0, behavior: "instant" });
}
export function useRoute() {
  const [r, setR] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const f = () => setR(location.hash.slice(1) || "/");
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return r;
}
export const plural = (n) =>
  `${n} ${n % 100 >= 11 && n % 100 <= 14 ? "произведений" : n % 10 === 1 ? "произведение" : n % 10 >= 2 && n % 10 <= 4 ? "произведения" : "произведений"}`;
export function csvDownload(rows, name = "Luma_Studios.csv") {
  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
          .join(";"),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return csv;
}
export const stamp = (s) =>
  new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" }).format(s);
