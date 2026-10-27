// Официальные трейлеры. Ключ — id произведения, издания или аудиокниги.
// Запись показывается только если указана ссылка на видео (YouTube).
// Пример: alice: { title: "Алиса в Стране чудес", kind: "Трейлер издания", url: "https://www.youtube.com/watch?v=…" }
// Для манги, маньхуа, комиксов и аудиокниг работает та же запись: достаточно добавить ссылку.
export const trailers = {};

// Возвращает ссылку для встраивания (без cookies) или null для неизвестного адреса.
export function youtubeEmbed(url) {
  const m = String(url || "").match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}
