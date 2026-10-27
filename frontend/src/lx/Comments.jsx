import React, { useState } from "react";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useStore } from "../shared/store";
import { ago } from "./ui";

// Local-only discussion thread. Every comment is written by this browser's profile;
// nothing is invented on behalf of other people.
export default function Comments({ thread, title = "Комментарии" }) {
  const { state, update, setToast } = useStore();
  const list = state.comments?.[thread] || [];
  const [text, setText] = useState("");
  const [sort, setSort] = useState("new");
  const [replyTo, setReplyTo] = useState(null);
  const [reply, setReply] = useState("");
  const me = state.profile;
  const save = (fn) =>
    update((s) => ({ comments: { ...(s.comments || {}), [thread]: fn(s.comments?.[thread] || []) } }));
  const post = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    save((l) => [...l, { id: crypto.randomUUID(), text: text.trim(), time: Date.now(), likes: 0, liked: false, replies: [] }]);
    setText("");
    setToast("Комментарий опубликован на этом устройстве");
  };
  const like = (id, parent) =>
    save((l) =>
      l.map((c) =>
        parent
          ? c.id === parent
            ? { ...c, replies: c.replies.map((r) => (r.id === id ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r)) }
            : c
          : c.id === id
            ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
            : c,
      ),
    );
  const remove = (id, parent) =>
    save((l) => (parent ? l.map((c) => (c.id === parent ? { ...c, replies: c.replies.filter((r) => r.id !== id) } : c)) : l.filter((c) => c.id !== id)));
  const sendReply = (e, parent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    save((l) =>
      l.map((c) =>
        c.id === parent ? { ...c, replies: [...c.replies, { id: crypto.randomUUID(), text: reply.trim(), time: Date.now(), likes: 0, liked: false }] } : c,
      ),
    );
    setReply("");
    setReplyTo(null);
  };
  const rows = [...list].sort((a, b) => (sort === "new" ? b.time - a.time : b.likes - a.likes || b.time - a.time));
  const count = list.reduce((n, c) => n + 1 + c.replies.length, 0);
  const Item = ({ c, parent }) => (
    <div className="lx-comment">
      <span className="lx-comment-ava">{me.avatar ? <img src={me.avatar} alt="" /> : me.name[0]}</span>
      <div className="lx-comment-body">
        <div className="lx-comment-head">
          <strong>{me.name}</strong>
          <small>{ago(c.time)}</small>
        </div>
        <p>{c.text}</p>
        <div className="lx-comment-actions">
          <button className={c.liked ? "on" : ""} aria-pressed={c.liked} onClick={() => like(c.id, parent)}>
            <Heart size={15} fill={c.liked ? "currentColor" : "none"} /> {c.likes || ""}
          </button>
          {!parent && (
            <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
              <MessageCircle size={15} /> Ответить
            </button>
          )}
          <button onClick={() => remove(c.id, parent)} aria-label="Удалить комментарий">
            <Trash2 size={15} />
          </button>
        </div>
        {!parent && replyTo === c.id && (
          <form className="lx-comment-form lx-reply-form" onSubmit={(e) => sendReply(e, c.id)}>
            <textarea id={`lx-reply-${c.id}`} aria-label="Текст ответа" placeholder="Ваш ответ" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} autoFocus />
            <div className="lx-comment-send">
              <button type="button" className="lx-link" onClick={() => setReplyTo(null)}>Отмена</button>
              <button type="submit" className="lx-btn lx-btn-sm" disabled={!reply.trim()}>Ответить</button>
            </div>
          </form>
        )}
        {!parent && c.replies.length > 0 && (
          <div className="lx-replies">
            {c.replies.map((r) => (
              <Item key={r.id} c={r} parent={c.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  return (
    <section className="lx-comments" aria-label={title}>
      <div className="lx-comments-head">
        <h3>
          {title} <span className="lx-muted">{count}</span>
        </h3>
        <div className="lx-segment lx-segment-sm" role="tablist" aria-label="Сортировка комментариев">
          {[["new", "Новые"], ["top", "Популярные"]].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={sort === k} className={sort === k ? "active" : ""} onClick={() => setSort(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <form className="lx-comment-form" onSubmit={post}>
        <textarea id={`lx-comment-${thread}`} aria-label="Текст комментария" placeholder="Оставьте комментарий" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
        <div className="lx-comment-send">
          <small>Комментарии хранятся только в этом браузере</small>
          <button type="submit" className="lx-btn lx-btn-sm" disabled={!text.trim()}>Отправить</button>
        </div>
      </form>
      {rows.length ? (
        <div className="lx-comment-list">
          {rows.map((c) => (
            <Item key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <p className="lx-comments-empty">Здесь пока тихо. Напишите первый комментарий.</p>
      )}
    </section>
  );
}
