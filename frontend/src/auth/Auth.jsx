import React, { useState, useRef } from "react";
import {
  Mail,
  Phone,
  UserRound,
  ArrowLeft,
  Check,
  ExternalLink,
} from "lucide-react";
import { Brand, Button, Scene } from "../shared/ui";
import { useStore } from "../shared/store";
export default function Auth() {
  const { state, update } = useStore();
  const [method, setMethod] = useState("");
  const [value, setValue] = useState("");
  const [country, setCountry] = useState("+7");
  const [error, setError] = useState("");
  const [stage, setStage] = useState("welcome");
  const [code, setCode] = useState(["", "", "", ""]);
  const [success, setSuccess] = useState(false);
  const refs = useRef([]);
  const send = (e) => {
    e.preventDefault();
    let v = value.trim();
    if (method === "phone") {
      let digits = v.replace(/\D/g, "");
      if (country === "+7" && digits.length === 11 && /^[78]/.test(digits))
        digits = digits.slice(1);
      else if (v.startsWith(country)) digits = digits.slice(country.length - 1);
      v = country + digits;
      if (
        v.replace(/\D/g, "").length < 10 ||
        v.replace(/\D/g, "").length > 15
      ) {
        setError("Проверь номер: нужно от 10 до 15 цифр с кодом страны.");
        return;
      }
    } else if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Введи почту в формате name@example.com.");
      return;
    } else if (method === "luma" && !/^[a-zA-Z0-9_]{3,24}$/.test(v)) {
      setError("От 3 до 24 латинских букв, цифр или _.");
      return;
    }
    setValue(v);
    setStage("code");
    setError("");
    setCode(["", "", "", ""]);
    setTimeout(() => refs.current[0]?.focus(), 50);
  };
  const verify = (c) => {
    if (c.some((x) => !x)) return;
    if (c.join("") !== "1234") {
      setError("Код не подошёл. Для демо используй 1234.");
      return;
    }
    setError("");
    setSuccess(true);
    setTimeout(() => update({ signedIn: true }), 1100);
  };
  const digit = (i, text) => {
    const digits = text.replace(/\D/g, "");
    let next = [...code];
    if (digits.length > 1) {
      for (let j = 0; j < 4 - i; j++) next[i + j] = digits[j] || "";
    } else next[i] = digits;
    setCode(next);
    setError("");
    refs.current[Math.min(3, i + Math.max(1, digits.length))]?.focus();
    verify(next);
  };
  return (
    <main className="auth-screen">
      <Scene
        name="auth"
        className="auth-scene"
        label="Космический пейзаж из предоставленных фонов"
      />
      <div className="auth-top">
        <Brand />
        <span className="quiet-pill">Демонстрационный прототип</span>
      </div>
      <div className="auth-center">
        <div className={`auth-panel ${stage === "welcome" ? "welcome" : ""}`}>
          {stage === "welcome" ? (
            <>
              <Brand large />
              <h1 className="welcome-tagline">
                Книги. Манга. Комиксы. Аудио.
                <br />В одном пространстве.
              </h1>
              <div className="welcome-actions">
                <Button onClick={() => setStage("choose")}>
                  Зарегистрироваться
                </Button>
                <button
                  className="text-link"
                  onClick={() => {
                    setMethod("email");
                    setStage("form");
                  }}
                >
                  Войти
                </button>
              </div>
            </>
          ) : stage === "choose" ? (
            <>
              <Brand large />
              <h1>
                Истории ближе,
                <br />
                чем кажется.
              </h1>
              <p className="muted">Читать. Слушать. Оставаться в истории.</p>
              <div className="auth-actions">
                <Button
                  onClick={() => {
                    setMethod("yandex");
                    setStage("form");
                  }}
                >
                  Войти с Яндекс ID
                </Button>
                <Button
                  secondary
                  icon={UserRound}
                  onClick={() => {
                    setMethod("luma");
                    setStage("form");
                  }}
                >
                  Продолжить с Luma ID
                </Button>
                <div className="auth-methods">
                  <Button
                    secondary
                    icon={Mail}
                    onClick={() => {
                      setMethod("email");
                      setStage("form");
                    }}
                  >
                    Почта
                  </Button>
                  <Button
                    secondary
                    icon={Phone}
                    onClick={() => {
                      setMethod("phone");
                      setStage("form");
                    }}
                  >
                    Телефон
                  </Button>
                </div>
              </div>
              <p className="muted">
                Уже знакомы?{" "}
                <button
                  className="text-link"
                  onClick={() => {
                    setMethod("email");
                    setStage("form");
                  }}
                >
                  Войти
                </button>
              </p>
              <small>Демо сохраняет данные только в этом браузере.</small>
            </>
          ) : stage === "form" ? (
            <>
              <button
                className="back"
                onClick={() => {
                  setStage("choose");
                  setError("");
                }}
              >
                <ArrowLeft size={18} />
                Назад
              </button>
              <h1>
                {method === "yandex"
                  ? "Яндекс ID"
                  : method === "phone"
                    ? "Твой номер"
                    : method === "luma"
                      ? "Твой Luma ID"
                      : "Твоя почта"}
              </h1>
              {method === "yandex" ? (
                <>
                  <p>
                    Для настоящего входа нужен настроенный OAuth-клиент Яндекса.
                    Доступ к твоему аккаунту здесь не запрашивается.
                  </p>
                  <a
                    className="external-link"
                    href="https://yandex.ru/dev/id/doc/ru/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Как работает Яндекс ID <ExternalLink size={15} />
                  </a>
                  <Button
                    onClick={() => {
                      setMethod("email");
                      setStage("form");
                    }}
                  >
                    Перейти к демовходу
                  </Button>
                </>
              ) : (
                <form onSubmit={send} noValidate>
                  <p className="muted">Попробуй подтверждение в деморежиме.</p>
                  <label htmlFor="identity">
                    {method === "phone"
                      ? "Номер телефона"
                      : method === "luma"
                        ? "Имя пользователя"
                        : "Электронная почта"}
                  </label>
                  <div className="identity-field">
                    {method === "phone" && (
                      <select
                        aria-label="Код страны"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        <option>+7</option>
                        <option>+1</option>
                        <option>+44</option>
                        <option>+49</option>
                        <option>+90</option>
                      </select>
                    )}
                    <input
                      id="identity"
                      name="identity"
                      autoFocus
                      type={
                        method === "email"
                          ? "email"
                          : method === "phone"
                            ? "tel"
                            : "text"
                      }
                      autoComplete={
                        method === "email"
                          ? "email"
                          : method === "phone"
                            ? "tel-national"
                            : "username"
                      }
                      inputMode={
                        method === "phone"
                          ? "tel"
                          : method === "email"
                            ? "email"
                            : "text"
                      }
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setError("");
                      }}
                      placeholder={
                        method === "email"
                          ? "name@example.com"
                          : method === "phone"
                            ? "999 123 45 67"
                            : "your_name"
                      }
                      aria-invalid={!!error}
                      aria-describedby="auth-error"
                    />
                  </div>
                  <div id="auth-error" className="field-error" role="alert">
                    {error}
                  </div>
                  <Button type="submit">Продолжить</Button>
                  <small>
                    Код не отправляется. На следующем шаге будет демокод.
                  </small>
                </form>
              )}
            </>
          ) : (
            <>
              <button
                className="back"
                onClick={() => {
                  setStage("form");
                  setError("");
                  if (method === "phone" && value.startsWith(country))
                    setValue(value.slice(country.length));
                }}
              >
                <ArrowLeft size={18} />
                Изменить {method === "phone" ? "номер" : "данные"}
              </button>
              <div className={`verification ${success ? "verified" : ""}`}>
                <div className="confirmation-symbol">
                  {success ? (
                    <Check size={40} />
                  ) : method === "phone" ? (
                    <Phone size={32} />
                  ) : (
                    <Mail size={32} />
                  )}
                </div>
                <h1>{success ? "Подтверждено" : "Введи код"}</h1>
                <p className="muted">
                  {success
                    ? "Открываем твою библиотеку."
                    : `Демопроверка для ${value}`}
                </p>
                <div
                  className="otp"
                  onPaste={(e) => {
                    e.preventDefault();
                    const t = e.clipboardData
                      .getData("text")
                      .replace(/\D/g, "")
                      .slice(0, 4);
                    const next = Array.from(
                      { length: 4 },
                      (_, i) => t[i] || "",
                    );
                    setCode(next);
                    refs.current[Math.min(t.length, 3)]?.focus();
                    verify(next);
                  }}
                >
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (refs.current[i] = el)}
                      aria-label={`Цифра кода ${i + 1}`}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      value={d}
                      maxLength={4}
                      disabled={success}
                      onChange={(e) => digit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          e.preventDefault();
                          const n = [...code];
                          if (n[i]) n[i] = "";
                          else if (i > 0) {
                            n[i - 1] = "";
                            refs.current[i - 1]?.focus();
                          }
                          setCode(n);
                          setError("");
                        }
                        if (e.key === "ArrowLeft")
                          refs.current[Math.max(0, i - 1)]?.focus();
                        if (e.key === "ArrowRight")
                          refs.current[Math.min(3, i + 1)]?.focus();
                      }}
                    />
                  ))}
                </div>
                <div className="field-error" role="alert">
                  {error}
                </div>
                {!success && (
                  <>
                    <p className="demo-code">
                      Демокод <strong>1234</strong> · SMS и письма не
                      отправляются
                    </p>
                    <button
                      className="text-link"
                      onClick={() => {
                        setCode(["", "", "", ""]);
                        setError("");
                        refs.current[0]?.focus();
                      }}
                    >
                      Попробовать ещё раз
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <footer className="auth-footer">
        <span>Luma Studios</span>
        <span>Твоя личная вселенная историй</span>
      </footer>
    </main>
  );
}
