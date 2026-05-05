import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../api/axiosClient";
import { Link } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";
import { generateAcademicYears } from "../utils/academicYears";
import { getFileUrl } from "../utils/fileUrl";

export default function ProjectsApproved() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  // Status fixed to approved; UI control removed
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshId, setRefreshId] = useState(0);

  const academicYearOptions = useMemo(() => generateAcademicYears(), []);

  const getUploaderLabel = (project) => {
    const name =
      project.uploader_full_name ||
      project.user_fullname ||
      project.studentName ||
      project.student_name ||
      project.user_name ||
      undefined;
    const emailFull = (project.uploader_email || "").trim();

    if (project.uploader_role === "student") {
      return name || emailFull || "Student";
    }

    return name || emailFull || "Staff";
  };

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
        if (academicYear) params.set("year", academicYear);
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
  }, [q, academicYear, page, limit, refreshId]);

  return (
    <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-5 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="glitter-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Search
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search projects..."
                  className="w-full rounded-md border border-slate-300 py-1.5 pl-9 pr-12 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => {
                    setPage(1);
                    setRefreshId(Date.now());
                  }}
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-white shadow"
                  style={{ backgroundColor: "#87CEEB" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All Years</option>
                {academicYearOptions.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
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
              return typeof p.files === "string" ? JSON.parse(p.files) : p.files;
            } catch {
              return Array.isArray(p.files) ? p.files : [];
            }
          })();

          const team = p.team_members || p.teamMembers || p.team || [];
          const teamStr = Array.isArray(team) ? team.join(", ") : team;
          const approvedAt = p.verified_at || p.approvedAt || p.created_at;

          return (
            <div
              key={p.id}
              className="glitter-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
                        {p.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          Approved
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          {approvedAt ? new Date(approvedAt).toLocaleString() : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/60 lg:hidden">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Approved by
                      </div>
                      <div className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">
                        {p.verified_by_name || p.approved_by || p.approvedByName || "Staff"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Uploaded by
                      </div>
                      <div className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-slate-100">
                        {getUploaderLabel(p)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Approved by
                      </div>
                      <div className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.verified_by_name || p.approved_by || p.approvedByName || "Staff"}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 break-words text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
                    {p.description || "-"}
                  </p>

                  {p.github_url && (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        GitHub:
                      </span>{" "}
                      <a
                        href={p.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-medium text-blue-700 hover:underline dark:text-blue-300"
                      >
                        {p.github_url}
                      </a>
                    </div>
                  )}

                  {teamStr && (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Team Members:
                      </span>{" "}
                      <span className="break-words">{teamStr}</span>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Attachments
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {files.map((f, i) => {
                          const filename = f.filename || f.file || (typeof f === "string" ? f : undefined);
                          const original = f.original_name || f.name || filename;
                          const downloadUrl = getFileUrl(filename);

                          return (
                            <div
                              key={i}
                              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewFile({
                                    filename,
                                    original_name: original,
                                  })
                                }
                                className="min-w-0 text-left text-sm font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 dark:text-blue-300"
                              >
                                <span className="break-words">{original || "Attachment"}</span>
                              </button>
                              {filename && (
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 lg:w-48 lg:items-end">
                  <Link
                    to={`/projects/${p.id}`}
                    state={{ project: p }}
                    className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 lg:w-auto"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Prev
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Page {page}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!loading && projects.length < limit}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {previewFile && (
        <AttachmentPreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
