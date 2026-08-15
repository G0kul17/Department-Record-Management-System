import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { FaCode, FaChevronRight } from "react-icons/fa";

// Recent Projects grid: 3-column, each card has image-left / details-right layout
export default function ProjectsRecentGrid({ limit = 6 }) {
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
          `/projects?verified=true&limit=${limit}`
        );
        if (!mounted) return;
        setItems(data?.projects || []);
      } catch (e) {
        if (!mounted) return;
        console.error("Failed to load projects:", e);
        setError(e?.message || "Failed to load projects");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [limit]);

  return (
    <div>
      {loading ? (
        <div className="text-sm text-slate-600 p-4">Loading projects...</div>
      ) : error ? (
        <div className="text-sm text-rose-600 p-4">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-600 p-4">No projects yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.slice(0, limit).map((p) => {
              const href = `/projects/${p.id}`;
              const caption = p.title || p.name || "Project";
              const author = p.uploader_full_name || p.uploader_email || p.name || "";
              const description = p.description || p.summary || "";
              return (
                <a
                  key={p.id}
                  href={href}
                  className="flex rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  {/* Left: icon panel */}
                  <div className="w-28 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <FaCode className="w-9 h-9 text-blue-500" />
                  </div>

                  {/* Right: details */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1">
                        Project
                      </p>
                      <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-0.5">
                        {caption}
                      </p>
                      {author && (
                        <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                          By {author}
                        </p>
                      )}
                      {description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {description}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 group-hover:bg-slate-700 transition">
                      View Details
                      <FaChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="/projects/approved"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-blue-700"
            >
              View more projects
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
