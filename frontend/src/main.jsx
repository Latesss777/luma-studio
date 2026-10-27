import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  House,
  Search,
  LibraryBig,
  UserRound,
  Plug,
  ChevronRight,
} from "lucide-react";
import { Provider, useStore, useRoute, go } from "./shared/store";
import { Brand, BrandArt } from "./shared/ui";
import { isTvDevice, useTvNavigation } from "./shared/tv";
import { books, cover } from "./data/books";
import Auth from "./auth/Auth";
import Onboarding from "./onboarding/Onboarding";
import Home from "./home/Home";
import Catalog from "./catalog/Catalog";
import Title, { Author } from "./title/Title";
import Reader from "./reader/Reader";
import Audio from "./audio/Audio";
import Library from "./library/Library";
import Profile from "./profile/Profile";
import Integrations from "./integrations/Integrations";
import "./styles.css";
const nav = [
  ["/", "Главная", House],
  ["/catalog", "Каталог", Search],
  ["/library", "Библиотека", LibraryBig],
  ["/profile", "Профиль", UserRound],
];
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(e) {
    console.error(e);
  }
  render() {
    return this.state.error ? (
      <main className="empty">
        <h1>Не удалось открыть экран</h1>
        <p>Локальные данные сохранены. Перезагрузи страницу.</p>
        <button className="button" onClick={() => location.reload()}>
          Перезагрузить
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const { state, update } = useStore();
  const [launching, setLaunching] = useState(false);
  const completeOnboarding = useCallback(() => {
    setLaunching(true);
    update((s) => ({
      onboarded: true,
      library: [...new Set([...s.library, ...s.favorites])],
    }));
    go("/");
  }, [update]);
  useEffect(() => {
    if (!launching) return;
    const timer = setTimeout(() => setLaunching(false), 1200);
    return () => clearTimeout(timer);
  }, [launching]);
  const route = useRoute();
  const [path, query = ""] = route.split("?");
  const [, page, id] = path.split("/");
  const tv =
    state.settings.tv === "on" ||
    (state.settings.tv !== "off" && isTvDevice());
  useEffect(() => {
    document.documentElement.classList.toggle("tv-mode", tv);
  }, [tv]);
  useTvNavigation(tv && page !== "reader");
  useEffect(() => {
    books.forEach((b) => {
      const im = new Image();
      im.src = cover(b);
      im.decode().catch(() => {});
    });
    const orientation = window.matchMedia("(max-width: 600px)").matches
      ? "mobile"
      : "desktop";
    ["onboarding", "home"].forEach((name) => {
      const im = new Image();
      im.src = `/assets/backgrounds/${name}-${orientation}.jpg`;
      im.decode().catch(() => {});
    });
  }, []);
  if (!state.signedIn) return <Auth />;
  if (!state.onboarded) return <Onboarding onComplete={completeOnboarding} />;
  if (page === "reader")
    return <Reader key={id + query} id={id} query={query} />;
  return (
    <div className={"app-shell" + (tv ? " tv" : "")}>
      {launching && (
        <div className="launch-transition" aria-hidden="true">
          <BrandArt mark />
        </div>
      )}
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector("main")?.focus();
        }}
      >
        К содержимому
      </a>
      <aside className="sidebar">
        <button
          className="brand-button"
          aria-label="Luma Studios — главная"
          onClick={() => go("/")}
        >
          <Brand />
        </button>
        <nav aria-label="Основная навигация">
          {nav.map(([url, label, Icon]) => (
            <button
              key={url}
              className={
                (url === "/" ? path === "/" : path.startsWith(url))
                  ? "active"
                  : ""
              }
              onClick={() => go(url)}
            >
              <Icon size={21} strokeWidth={1.6} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            onClick={() => go("/integrations")}
            className={page === "integrations" ? "active" : ""}
          >
            <Plug size={20} />
            <span>Интеграции</span>
          </button>
          <div className="sidebar-profile">
            <span>{state.profile.name[0]}</span>
            <button onClick={() => go("/profile")}>
              <strong>{state.profile.name}</strong>
              <small>Личная библиотека</small>
            </button>
            <ChevronRight size={16} />
          </div>
          <small>Данные на этом устройстве</small>
        </div>
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className={`workspace ${page ? "" : "home-workspace"}`}
        key={page === "catalog" ? route : page || "home"}
      >
        {!page ? (
          <Home />
        ) : page === "catalog" ? (
          <Catalog query={query} />
        ) : page === "title" ? (
          <Title key={id} id={id} />
        ) : page === "author" ? (
          <Author id={id} />
        ) : page === "audio" ? (
          <Audio />
        ) : page === "library" ? (
          <Library />
        ) : page === "profile" ? (
          <Profile />
        ) : page === "integrations" ? (
          <Integrations />
        ) : (
          <Home />
        )}
      </main>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {nav.map(([url, label, Icon]) => (
          <button
            key={url}
            className={
              (url === "/" ? path === "/" : path.startsWith(url))
                ? "active"
                : ""
            }
            onClick={() => go(url)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <Boundary>
    <Provider>
      <App />
    </Provider>
  </Boundary>,
);
