import React, { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api/axiosClient";

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

  const uploadsBase = useMemo(
    () => apiClient.baseURL.replace(/\/api$/, "") + "/uploads/",
    []
  );

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
        const rows = (data?.achievements || []).filter((a) => {
          const mime = (a.proof_mime || "").toLowerCase();
          return a.proof_filename && mime.startsWith("image/");
        });
        setItems(rows);
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
          No achievements with images yet.
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
                const imgUrl =
                  uploadsBase + encodeURIComponent(a.proof_filename);
                const href = `/achievements/${a.id}`;
                const caption = a.title || a.name || "Achievement";
                const author = a.user_fullname || a.user_email || a.name || "";
                return (
                  <div key={a.id} className="flex-shrink-0 w-full p-4">
                    <a
                      href={href}
                      className="block glitter-card bulge-card rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={imgUrl}
                          alt={caption}
                          className="portrait-media w-full"
                          loading="lazy"
                        />
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
