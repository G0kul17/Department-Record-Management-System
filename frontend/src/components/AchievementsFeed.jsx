import React, { useEffect, useRef, useState } from "react";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";

// Swipeable achievements feed showing one portrait post at a time
// Renders below Events on dashboards for admin, staff, and student
export default function AchievementsFeed({
  title = "Recent Achievements",
  limit = 12,
  intervalMs = 0,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await apiClient.get(
          `/achievements?verified=true&limit=${limit}`
        );
        if (!mounted) return;
        setItems(data?.achievements || []);
        setIndex(0);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load achievements");
        setItems([]);
        setIndex(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  // Optional auto-advance if intervalMs > 0
  useEffect(() => {
    if (!items.length || !intervalMs) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [items.length, intervalMs]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const delta = touchDeltaX.current;
    const threshold = 50; // px
    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        // swipe left -> next
        setIndex((i) => (i + 1) % items.length);
      } else {
        // swipe right -> prev
        setIndex((i) => (i - 1 + items.length) % items.length);
      }
    }
    touchStartX.current = 0;
    touchDeltaX.current = 0;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Swipe to browse achievements
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600 p-4">
          Loading achievements...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600 p-4">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-600 p-4">
          No achievements yet.
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-lg shadow-sm mx-auto max-w-sm">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(${-index * 100}%)` }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {items.map((a) => {
                const href = `/achievements/${a.id}`;
                const caption = a.title || a.name || "Achievement";
                const author = a.user_fullname || a.user_email || a.name || "";
                const imageFilename = [
                  a.proof_mime?.startsWith("image/") ? a.proof_filename : null,
                  a.certificate_mime?.startsWith("image/") ? a.certificate_filename : null,
                  a.event_photos_mime?.startsWith("image/") ? a.event_photos_filename : null,
                ].find(Boolean);
                const imgUrl = imageFilename ? getFileUrl(imageFilename) : null;
                return (
                  <div key={a.id} className="flex-shrink-0 w-full p-4">
                    <a
                      href={href}
                      className="block glitter-card bulge-card rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={caption}
                            className="portrait-media w-full"
                            loading="lazy"
                          />
                        ) : (
                          <div className="portrait-media w-full bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="text-amber-400">
                              <path d="M8 21h8M12 17v4M5 3H3v5c0 2.21 1.79 4 4 4h10c2.21 0 4-1.79 4-4V3h-2M5 3h14M5 3v5M19 3v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 px-1">
                        <div className="text-base font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                          {caption}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {author}
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
            {/* Left/Right arrows */}
            <button
              type="button"
              aria-label="Previous achievement"
              onClick={() =>
                setIndex((i) => (i - 1 + items.length) % items.length)
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 shadow hover:bg-white px-2.5 py-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next achievement"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 shadow hover:bg-white px-2.5 py-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {/* Pagination below the post */}
          <div className="mt-3 flex items-center justify-center gap-4">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {index + 1} / {items.length}
            </span>
            <div className="flex gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`min-w-[24px] h-6 px-1 text-xs rounded ${
                    i === index
                      ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                  aria-label={`Go to achievement ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
