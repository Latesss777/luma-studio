import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Timer,
  ChevronRight,
} from "lucide-react";
import { findBook } from "../data/books";
import meta from "../data/audio-meta.json";
import { go, useStore } from "../shared/store";
import {
  Back,
  Cover,
  Button,
  IconButton,
  Community,
  ShelfPicker,
  Rating,
} from "../shared/ui";
const time = (s) =>
  `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, "0")}`;
export default function Audio() {
  const b = findBook("alice");
  const { addLibrary, event } = useStore();
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(Number(meta.format.duration));
  const [speed, setSpeed] = useState(1);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!timer) return;
    const t = setTimeout(() => {
      audio.current?.pause();
      setTimer(0);
    }, timer * 60000);
    return () => clearTimeout(t);
  }, [timer]);
  const play = async () => {
    if (playing) audio.current.pause();
    else {
      try {
        await audio.current.play();
        addLibrary("alice");
        event("audio", "alice");
      } catch {
        setError("Не удалось воспроизвести файл. Попробуй ещё раз.");
      }
    }
  };
  const rate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(speed) + 1) % rates.length];
    setSpeed(next);
    audio.current.playbackRate = next;
  };
  return (
    <>
      <Back to="/title/alice" label="К произведению" />
      <section className="audio-section">
        <div className="audio-art">
          <Cover book={b} />
        </div>
        <div className="audio-controls">
          <div className="audio-top">
            <span className="quiet-pill">Аудиокнига</span>
            <a
              className="text-link"
              href="/assets/alice-audio.mp3"
              download="Alice_excerpt.mp3"
            >
              <Download size={17} />
              Скачать · {(Number(meta.format.size) / 1024 / 1024).toFixed(2)} МБ
            </a>
          </div>
          <h1>{b.title}</h1>
          <button className="author-link" onClick={() => go("/author/carroll")}>
            {b.author}
            <ChevronRight size={16} />
          </button>
          <p className="muted">Глава 1 · Down the Rabbit-Hole</p>
          <p className="small muted">
            Настоящий аудиофайл: синтезированное чтение английского фрагмента,
            голос Flite SLT.
          </p>
          <audio
            ref={audio}
            src="/assets/alice-audio.mp3"
            preload="metadata"
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError("Аудиофайл недоступен.")}
          />
          <input
            className="audio-progress"
            aria-label="Прогресс аудио"
            type="range"
            min="0"
            max={duration || 1}
            step=".1"
            value={current}
            onChange={(e) => {
              audio.current.currentTime = Number(e.target.value);
              setCurrent(Number(e.target.value));
            }}
          />
          <div className="time-row">
            <span>{time(current)}</span>
            <span>{time(duration)}</span>
          </div>
          <div className="playback">
            <IconButton
              label="Назад на 15 секунд"
              icon={RotateCcw}
              onClick={() =>
                (audio.current.currentTime = Math.max(0, current - 15))
              }
            />
            <button
              className="play-button"
              aria-label={playing ? "Пауза" : "Воспроизвести"}
              onClick={play}
            >
              {playing ? (
                <Pause size={29} fill="currentColor" />
              ) : (
                <Play size={29} fill="currentColor" />
              )}
            </button>
            <IconButton
              label="Вперёд на 15 секунд"
              icon={RotateCw}
              onClick={() =>
                (audio.current.currentTime = Math.min(duration, current + 15))
              }
            />
          </div>
          <div className="audio-options">
            <button aria-label="Скорость воспроизведения" onClick={rate}>
              {speed}× <span>Скорость</span>
            </button>
            <button
              aria-label="Таймер сна"
              onClick={() =>
                setTimer((t) => ({ 0: 5, 5: 15, 15: 30, 30: 0 })[t])
              }
            >
              <Timer size={18} />
              {timer ? `${timer} мин` : "Выключен"}
              <span>Таймер сна</span>
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          <ShelfPicker id="alice" />
        </div>
      </section>
      <div className="title-body">
        <div className="section-head">
          <h2>Глава в аудио</h2>
          <span className="muted">1 фрагмент · {time(duration)}</span>
        </div>
        <button
          className="chapter-row"
          onClick={() => {
            audio.current.currentTime = 0;
            play();
          }}
        >
          <Play size={17} />
          <span>01</span>
          <span>Down the Rabbit-Hole — фрагмент</span>
          <small>EN</small>
          <ChevronRight size={17} />
        </button>
        <h2>Главные герои</h2>
        <div className="character-chips">
          {b.characters.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Community id="alice" />
      </div>
    </>
  );
}
