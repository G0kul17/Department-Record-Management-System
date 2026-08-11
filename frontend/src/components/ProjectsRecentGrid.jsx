import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";

// Recent Projects grid: shows latest N projects
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
        const rows = data?.projects || [];
        setItems(rows);
      } catch (e) {
        if (!mounted) return;
        console.error("Failed to load projects:", e);
        setError(e?.message || "Failed to load projects");
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
          Loading projects...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600 p-4">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-600 p-4">No projects yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {items.slice(0, limit).map((p, idx) => {
              const href = `/projects/${p.id}`;
              const caption = p.title || p.name || "Project";
              const author = p.uploader_full_name || p.uploader_email || p.name || "";
              const description = p.description || p.summary || "";
              const spanClass =
                idx === 0
                  ? "col-span-12 md:col-span-7"
                  : idx === 1
                    ? "col-span-12 md:col-span-5"
                    : "col-span-12 md:col-span-6";
              return (
                <a
                  key={p.id}
                  href={href}
                  className={`block rounded-2xl border bg-white shadow-sm hover:shadow-lg glitter-card ${spanClass}`}
                  style={{
                    borderColor: "var(--color-border)",
                    transition: "box-shadow var(--dur-short) var(--ease-out)",
                  }}
                >
                  <div className="p-4">
                    <div
                      className="relative rounded-xl overflow-hidden flex items-center justify-center h-44"
                      style={{
                        backgroundColor: "var(--color-accent-soft)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div className="flex items-center justify-center w-full h-full text-cyan-400">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <path
                            d="M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6m-1-2h-2M8 4H6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs font-semibold tracking-wide text-cyan-600 uppercase">
                        Project
                      </div>
                      <div className="mt-1 text-base font-semibold text-slate-900 line-clamp-2">
                        {caption}
                      </div>
                      {author && (
                        <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {author}
                        </div>
                      )}
                      {description && (
                        <div className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {description}
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
              href="/projects/approved"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-blue-700"
            >
              View more projects
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
