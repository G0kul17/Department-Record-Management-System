import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { Link } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";

export default function ProjectsApproved() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  // Status fixed to approved; UI control removed
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshId, setRefreshId] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("verification_status", "approved");
        params.set("limit", String(limit));
        params.set("offset", String((page - 1) * limit));
        if (q.trim()) params.set("q", q.trim());
        const data = await apiClient.get(`/projects?${params.toString()}`);
        if (!mounted) return;
        setProjects(data.projects || []);
      } catch (e) {
        console.error(e);
        if (mounted) setProjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [q, page, limit, refreshId]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Centered search + filters below navbar */}
      <div className="mx-auto max-w-3xl">
        <div className="glitter-card rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 items-start">
            {/* Search input with icon */}
            <div>
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
                  placeholder="Search projects..."
                  className="w-full rounded-md border border-slate-300 pl-9 pr-12 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => {
                    setPage(1);
                    setRefreshId(Date.now());
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded-md text-white shadow"
                  style={{ backgroundColor: "#87CEEB" }}
                >
                  <svg
                    width="12"
                    height="12"
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
            {/* Academic Year filter removed as requested; keep only search */}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Approved Projects
        </h1>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {loading ? "Loading..." : `${projects.length} projects`}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5">
        {projects.map((p) => {
          const files = (() => {
            if (!p.files) return [];
            try {
              return typeof p.files === "string"
                ? JSON.parse(p.files)
                : p.files;
            } catch (e) {
              return Array.isArray(p.files) ? p.files : [];
            }
          })();

          const team = p.team_members || p.teamMembers || p.team || [];
          const teamStr = Array.isArray(team) ? team.join(", ") : team;
          const approvedAt = p.verified_at || p.approvedAt || p.created_at;

          return (
            <div
              key={p.id}
              className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                      {p.title}
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
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {(() => {
                        const name =
                          p.uploader_full_name ||
                          p.user_fullname ||
                          p.studentName ||
                          p.student_name ||
                          p.user_name ||
                          undefined;
                        const emailFull = (p.uploader_email || "").trim();
                        if (p.uploader_role === "student") {
                          return name || emailFull || "Student";
                        }
                        // Staff or unknown role
                        return name || emailFull || "Staff";
                      })()}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                    {p.description || "-"}
                  </p>

                  {p.github_url && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-300 mr-1">
                        GitHub:
                      </span>
                      <a
                        href={p.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {p.github_url}
                      </a>
                    </div>
                  )}

                  {teamStr && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      Team Members: {teamStr}
                    </div>
                  )}

                  {files && files.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Attachments
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {files.map((f, i) => {
                          const filename =
                            f.filename ||
                            f.file ||
                            (typeof f === "string" ? f : undefined);
                          const original =
                            f.original_name || f.name || filename;
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
                                      original_name: original,
                                    })
                                  }
                                  className="text-sm text-blue-600 underline"
                                >
                                  {original || "Attachment"}
                                </button>
                              </div>
                              <div className="ml-4">
                                {filename && (
                                  <a
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="text-sm text-slate-600 dark:text-slate-300"
                                  >
                                    Download
                                  </a>
                                )}
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
                      {p.verified_by_name ||
                        p.approved_by ||
                        p.approvedByName ||
                        "Staff"}
                    </span>
                  </div>
                  <Link
                    to={`/projects/${p.id}`}
                    state={{ project: p }}
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
          disabled={!loading && projects.length < limit}
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
