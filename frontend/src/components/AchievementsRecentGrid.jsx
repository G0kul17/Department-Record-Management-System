import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/axiosClient";

// Recent Achievements grid: shows latest N image achievements
export default function AchievementsRecentGrid({ limit = 6 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          `/achievements?verified=true&order=latest&limit=${limit}`
        );
        if (!mounted) return;
        const rows = (data?.achievements || []).filter((a) => {
          const mime = (a.proof_mime || "").toLowerCase();
          return a.proof_filename && mime.startsWith("image/");
        });
        setItems(rows);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load achievements");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Recent Achievements
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Latest verified submissions
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600 p-4">
          Loading achievements...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600 p-4">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-600 p-4">No achievements yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.slice(0, limit).map((a) => {
              const imgUrl = uploadsBase + encodeURIComponent(a.proof_filename);
              const href = `/achievements/${a.id}`;
              const caption = a.title || a.name || "Achievement";
              const author = a.user_fullname || a.user_email || a.name || "";
              return (
                <a
                  key={a.id}
                  href={href}
                  className="block rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow glitter-card bulge-card"
                >
                  <div className="p-4">
                    <div className="relative rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center h-44">
                      <img
                        src={imgUrl}
                        alt={caption}
                        className="max-h-full w-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-4">
                      <div className="text-xs font-semibold tracking-wide text-sky-600 uppercase">
                        Achievement
                      </div>
                      <div className="mt-1 text-base font-semibold text-slate-900 line-clamp-2">
                        {caption}
                      </div>
                      {author && (
                        <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {author}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="mt-2">
                      <span className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white text-xs font-semibold px-3 py-2 hover:bg-slate-700">
                        View Details
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="/achievements/approved"
              className="inline-flex items-center gap-2 rounded-md bg-[#87CEEB] text-white text-sm font-semibold px-4 py-2 shadow-sm hover:bg-[#5dbce3] focus:outline-none focus:ring-2 focus:ring-[#87CEEB]/50 border border-[#5dbce3]"
            >
              View more achievements
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
            </a>
          </div>
        </>
      )}
    </div>
  );
}
