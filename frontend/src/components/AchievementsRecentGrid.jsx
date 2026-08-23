import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";
import { FaTrophy, FaCheckCircle, FaChevronRight } from "react-icons/fa";

// Recent Achievements grid: 3-column, each card has image-left / details-right layout
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
    return () => { mounted = false; };
  }, [limit]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      {loading ? (
        <div className="text-sm text-slate-600 p-4">Loading achievements...</div>
      ) : error ? (
        <div className="text-sm text-rose-600 p-4">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-600 p-4">No achievements yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

              const isApproved =
                a.verified === true ||
                a.verified === 1 ||
                a.status === "approved" ||
                a.status === "verified";

              const awardedDate =
                a.awarded_date || a.event_date || a.date || a.created_at;

              return (
                <a
                  key={a.id}
                  href={href}
                  className="flex rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group min-w-0"
                >
                  {/* Left: image panel */}
                  <div className="w-20 sm:w-28 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={caption}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FaTrophy className="w-7 h-7 sm:w-9 sm:h-9 text-blue-600" />
                    )}
                  </div>

                  {/* Right: details */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1">
                        Achievement
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-0.5">
                        {caption}
                      </p>
                      {author && (
                        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mb-1.5 sm:mb-2">
                          By {author}
                        </p>
                      )}
                      {/* Approved badge */}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 mb-1.5">
                          <FaCheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      {/* Awarded date */}
                      {awardedDate && (
                        <p className="text-[10px] text-slate-500 mb-2 truncate">
                          Awarded: {formatDate(awardedDate)}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-blue-600 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 group-hover:bg-blue-700 shadow-sm transition">
                      View Details
                      <FaChevronRight className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                    </span>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
