import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useRoute } from "./shared/store";
import { Author } from "./title/Title";
import Audio from "./audio/Audio";
import Library from "./library/Library";
import Profile from "./profile/Profile";
import Integrations from "./integrations/Integrations";
import Header, { MobileNav } from "./lx/Header";
import Home from "./lx/Home";
import Catalog from "./lx/Catalog";
import Top from "./lx/Top";
import Title from "./lx/Title";
import ComicReader from "./lx/ComicReader";
import Bookmarks from "./lx/Bookmarks";
import Footer, { Info, Notifications } from "./lx/Footer";
import "@fontsource-variable/unbounded";
import "./styles.css";
import "./lx/lx.css";
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
  const route = useRoute();
  const [path, query = ""] = route.split("?");
  const [, page, id] = path.split("/");
  useEffect(() => {
    document.title = "Luma — читать мангу, комиксы и книги";
  }, []);
  if (page === "reader") {
    return <ComicReader key={id + query} id={id} query={query} />;
  }
  return (
    <div className="lx-app">
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
      <Header path={path} query={query} />
      <main id="main-content" tabIndex={-1} className="lx-main" key={page || "home"}>
        {!page ? (
          <Home query={query} />
        ) : page === "catalog" ? (
          <Catalog query={query} />
        ) : page === "top" ? (
          <Top query={query} />
        ) : page === "title" ? (
          <Title key={id} id={id} query={query} />
        ) : page === "bookmarks" ? (
          <Bookmarks query={query} />
        ) : page === "notifications" ? (
          <Notifications />
        ) : page === "info" ? (
          <Info key={id} id={id} />
        ) : page === "author" ? (
          <div className="lx-page lx-legacy"><Author id={id} /></div>
        ) : page === "audio" ? (
          <div className="lx-page lx-legacy"><Audio /></div>
        ) : page === "library" ? (
          <div className="lx-page lx-legacy"><Library /></div>
        ) : page === "profile" ? (
          <div className="lx-page lx-legacy"><Profile /></div>
        ) : page === "integrations" ? (
          <div className="lx-page lx-legacy"><Integrations /></div>
        ) : (
          <Home />
        )}
      </main>
      <Footer />
      <MobileNav path={path} />
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
