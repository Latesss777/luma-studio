// Официальные трейлеры: ссылка на видео на YouTube или VK Видео.
// Видео не скачивается и не хранится в приложении: показывается официальный плеер платформы.
// Ключ — id произведения (или "alice-audio" для аудиокниги).
// Пример: alice: { title: "…", kind: "Трейлер фильма", url: "https://vkvideo.ru/video-123456_789012" }
export const trailers = {};

// Возвращает адрес официального плеера (YouTube без cookies или VK Видео) или null.
export function trailerEmbed(url) {
  const s = String(url || "");
  const yt = s.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vkExt = s.match(/video_ext\.php\?[^#]*?oid=(-?\d+)[^#]*?id=(\d+)(?:[^#]*?hash=([0-9a-f]+))?/);
  const vk =
    vkExt ||
    s.match(/(?:vk\.com|vkvideo\.ru)\/(?:video|clip)(-?\d+)_(\d+)(?:_([0-9a-f]+))?/);
  if (vk) {
    const [, oid, id, hash] = vk;
    const q = new URLSearchParams({ oid, id, hd: "2" });
    if (hash) q.set("hash", hash);
    return `https://vk.com/video_ext.php?${q}`;
  }
  return null;
}
