import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { Link } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";

export default function AchievementsApproved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  // Status fixed to approved; UI control removed
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshId, setRefreshId] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("status", "approved");
        params.set("limit", String(limit));
        params.set("offset", String((page - 1) * limit));
        const qCombined = `${q.trim()} ${category.trim()}`.trim();
        if (qCombined) params.set("q", qCombined);
        const data = await apiClient.get(`/achievements?${params.toString()}`);
        if (!mounted) return;
        setItems(data.achievements || []);
      } catch (e) {
        console.error(e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [q, category, page, limit, refreshId]);

  // Enrich any items missing user_email by fetching details
  useEffect(() => {
    if (!items || !items.length) return;
    const missing = items.filter((a) => !a?.user_email);
    if (!missing.length) return;
    let cancelled = false;
    (async () => {
      try {
        const updates = [];
        for (const a of missing) {
          try {
            const res = await apiClient.get(`/achievements/${a.id}`);
            const detail = res.achievement || res;
            if (!detail) continue;
            updates.push({
              id: a.id,
              user_email: detail.user_email || a.user_email,
              user_fullname: detail.user_fullname || a.user_fullname,
            });
          } catch (_) {}
        }
        if (!cancelled && updates.length) {
          setItems((prev) =>
            prev.map((it) => {
              const u = updates.find((x) => x.id === it.id);
              return u ? { ...it, ...u } : it;
            })
          );
        }
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Centered search + filters below navbar */}
      <div className="mx-auto max-w-3xl">
        <div className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* Search input with icon */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Search
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 20l-3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search achievements..."
                  className="w-full rounded-md border border-slate-300 pl-9 pr-12 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => {
                    setPage(1);
                    setRefreshId(Date.now());
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-md text-white shadow"
                  style={{ backgroundColor: "#87CEEB" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 20l-3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Category dropdown with filter icon */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Filter by Title
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M3 5h18M6 10h12M10 15h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">All titles</option>
                  <option>Hackathon</option>
                  <option>Paper presentation</option>
                  <option>Coding competition</option>
                  <option>Conference presentation</option>
                  <option>Journal publications</option>
                  <option>NPTEL certificate</option>
                  <option>Internship certificate</option>
                  <option>Other MOOC courses</option>
                </select>
              </div>
            </div>
            {/* Status filter removed as requested */}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Approved Achievements
        </h1>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {loading ? "Loading..." : `${items.length} achievements`}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5">
        {items.map((a) => {
          const attachments = [];
          // support proof file + attachments array
          if (a.proof_filename) {
            attachments.push({
              name: a.proof_name || a.proof_filename,
              filename: a.proof_filename,
            });
          }
          if (a.attachments) {
            try {
              const arr =
                typeof a.attachments === "string"
                  ? JSON.parse(a.attachments)
                  : a.attachments;
              if (Array.isArray(arr)) {
                arr.forEach((f) => {
                  if (!f) return;
                  if (typeof f === "string")
                    attachments.push({ name: f, filename: f });
                  else
                    attachments.push({
                      name: f.original_name || f.name || f.filename,
                      filename: f.filename || f.file,
                    });
                });
              }
            } catch (_) {}
          }

          const team = a.team_members || a.teamMembers || a.team || [];
          const teamStr = Array.isArray(team) ? team.join(", ") : team;

          const approvedAt = a.verified_at || a.approvedAt || a.created_at;

          return (
            <div
              key={a.id}
              className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                      {a.title}
                    </h3>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {approvedAt
                          ? new Date(approvedAt).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    Uploaded by:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100 break-all">
                      {(a.user_email || a.student_email || "").trim() ||
                        a.user_fullname ||
                        a.studentName ||
                        a.name ||
                        "Student"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                    {a.description || "-"}
                  </p>

                  {teamStr && (
                    <div className="mt-3 text-sm text-slate-600">
                      Team Members: {teamStr}
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Attachments
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {attachments.map((f, i) => {
                          const filename = f.filename || f.name;
                          const downloadUrl = `${
                            apiClient && apiClient.baseURL
                              ? String(apiClient.baseURL).replace(
                                  /\/?api\/?$/,
                                  ""
                                )
                              : window.location.origin
                          }/uploads/${filename}`;
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-3"
                            >
                              <div>
                                <button
                                  onClick={() =>
                                    setPreviewFile({
                                      filename,
                                      original_name: f.name || f.original_name,
                                    })
                                  }
                                  className="text-sm text-blue-600 underline"
                                >
                                  {f.name || f.original_name || filename}
                                </button>
                              </div>
                              <div className="ml-4">
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="text-sm text-slate-600 dark:text-slate-300"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Approved by:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {a.verified_by_name ||
                        a.approved_by ||
                        a.approvedBy ||
                        a.approvedByName ||
                        "Staff"}
                    </span>
                  </div>
                  <Link
                    to={`/achievements/${a.id}`}
                    state={{ achievement: a }}
                    className="inline-block rounded-md bg-blue-600 px-3 py-1 text-white text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Pagination controls */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
          Prev
        </button>
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Page {page}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!loading && items.length < limit}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Next
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
      {previewFile && (
        <AttachmentPreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
