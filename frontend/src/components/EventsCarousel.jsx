import React, { useEffect, useState, useRef } from "react";
import { getFileUrl } from "../utils/fileUrl";

export default function EventsCarousel({ events = [], intervalMs = 4000 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const length = events.length;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pauseTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!length) return;
    if (prefersReducedMotion) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, intervalMs);
  }

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [length, intervalMs]);

  useEffect(() => {
    setIndex(0);
  }, [events]);

  function prev() {
    setIndex((i) => (i - 1 + length) % length);
    resetTimer();
  }

  function next() {
    setIndex((i) => (i + 1) % length);
    resetTimer();
  }

  if (!length) return null;

  const normalizeMediaUrl = (u) => {
    if (!u) return null;
    const raw = String(u).trim();
    if (!raw) return null;

    // Legacy paths may still be stored as /uploads/* or full backend URLs.
    const uploadsMarker = "/uploads/";
    if (raw.includes(uploadsMarker)) {
      return getFileUrl(raw.split(uploadsMarker)[1]);
    }
    if (/^https?:\/\//i.test(raw)) return raw;

    // Bare filename fallback (legacy payload shape)
    return getFileUrl(raw);
  };

  return (
    <div className="w-full max-w-[90%] sm:max-w-none mr-auto">
      <div
        className="relative overflow-hidden rounded-lg shadow-sm"
        role="region"
        aria-label="Events carousel"
        aria-live="polite"
        onMouseEnter={pauseTimer}
        onMouseLeave={resetTimer}
        onFocus={pauseTimer}
        onBlur={resetTimer}
      >
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(${-index * 100}%)` }}
        >
          {events.map((ev, slideIndex) => {
            const thumb =
              normalizeMediaUrl(ev.image) ||
              normalizeMediaUrl(ev.thumbnail) ||
              (ev.thumbnail_filename
                ? getFileUrl(ev.thumbnail_filename)
                : null);
            const href = ev.event_url ? ev.event_url : `/events/${ev.id}`;
            const external = Boolean(ev.event_url);
            return (
              <div key={ev.id} className="flex-shrink-0 w-full p-2 sm:p-4">
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="block rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:p-6 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 line-clamp-2">
                    {ev.title}
                  </h3>
                  {thumb ? (
                    <div className="mt-2 sm:mt-3 overflow-hidden rounded-lg bg-white">
                      <img
                        src={thumb}
                        alt={ev.title}
                        className="w-full h-auto max-h-[140px] sm:max-h-[240px] md:max-h-[420px] object-contain"
                        loading={slideIndex === 0 ? "eager" : "lazy"}
                        fetchPriority={slideIndex === 0 ? "high" : "low"}
                        decoding={slideIndex === 0 ? "sync" : "async"}
                        width="800"
                        height="450"
                        style={{ aspectRatio: "16 / 9" }}
                      />
                    </div>
                  ) : (
                    <div
                      className="mt-2 sm:mt-3 h-24 sm:h-40 md:h-56 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--color-accent-soft)",
                        border: "1px solid var(--color-border)",
                      }}
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        style={{ color: "var(--color-ink-muted)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75zM3 12h18"
                        />
                      </svg>
                    </div>
                  )}
                </a>
              </div>
            );
          })}
        </div>

        {/* Prev / Next arrows */}
        {length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition"
              aria-label="Previous event"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-6 sm:right-3 md:right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition"
              aria-label="Next event"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIndex(i);
                  resetTimer();
                }}
                className={`w-2 h-2 rounded-full transition-[background-color,transform] duration-200 ${
                  i === index ? "bg-[var(--color-accent)] scale-125" : "bg-slate-300"
                }`}
                aria-label={`Show event ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
