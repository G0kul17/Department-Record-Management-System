import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";

// Recent Achievements grid: shows latest N image achievements
export default function AchievementsRecentGrid({ limit = 6 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await apiClient.get(
          `/achievements?verified=true&order=latest&limit=${limit}`,
        );
        if (!mounted) return;
        setItems((data?.achievements || []).slice(0, limit));
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
    <div className="">
      <div></div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {items.slice(0, limit).map((a) => {
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
                <a
                  key={a.id}
                  href={href}
                  className="block rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200 glitter-card bulge-card"
                >
                  <div className="p-4">
                    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center h-44">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={caption}
                          className="max-h-full w-auto object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="text-amber-400">
                          <path d="M8 21h8M12 17v4M5 3H3v5c0 2.21 1.79 4 4 4h10c2.21 0 4-1.79 4-4V3h-2M5 3h14M5 3v5M19 3v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="text-xs font-semibold tracking-wide text-blue-600 uppercase">
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
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-blue-700"
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
