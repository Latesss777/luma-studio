import { useEffect } from "react";

// Элементы, на которые может встать фокус пультом.
const FOCUSABLE =
  'button:not([disabled]), a[href], select:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Телевизоры (Android TV / Google TV, Samsung, LG, Sony) и большой экран без наведения.
export function isTvDevice() {
  return (
    /Android TV|GoogleTV|AFT[A-Z]|BRAVIA|SMART-TV|SmartTV|Tizen|Web0S|Viera/i.test(
      navigator.userAgent,
    ) ||
    (matchMedia("(hover: none)").matches && innerWidth >= 1200)
  );
}

const visible = (el) => {
  const r = el.getBoundingClientRect();
  return (
    r.width > 0 &&
    r.height > 0 &&
    el.tabIndex >= 0 &&
    !el.closest("[aria-hidden='true'], [inert]")
  );
};

// Навигация пультом: стрелки переводят фокус к ближайшему элементу в нужном направлении,
// Enter нажимает (это делает браузер), Esc или Backspace возвращают назад.
export function useTvNavigation(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const vectors = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const onKey = (e) => {
      const tag = e.target.tagName || "";
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag);
      if (
        e.key === "Escape" ||
        (e.key === "Backspace" && !typing)
      ) {
        if (location.hash.length > 2) {
          e.preventDefault();
          history.back();
        }
        return;
      }
      const v = vectors[e.key];
      if (!v || typing) return;
      // Карусель на главной сама обрабатывает стрелки влево/вправо.
      if (document.activeElement?.closest?.(".hero-carousel")) return;

      const all = [...document.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.matches(":focus") === false && visible(el),
      );
      const cur = document.activeElement;
      if (!cur || cur === document.body || !cur.matches(FOCUSABLE)) {
        const first = all[0];
        if (first) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      const c = cur.getBoundingClientRect();
      const cx = c.left + c.width / 2;
      const cy = c.top + c.height / 2;
      let best = null;
      let bestScore = Infinity;
      for (const el of all) {
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx;
        const dy = r.top + r.height / 2 - cy;
        const primary = dx * v[0] + dy * v[1];
        if (primary <= 4) continue;
        const perp = Math.abs(dx * v[1] - dy * v[0]);
        const score = primary + perp * 2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }
      if (best) {
        e.preventDefault();
        best.focus({ preventScroll: true });
        best.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [enabled]);
}
