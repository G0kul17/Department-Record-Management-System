import React, { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";
import CustomSelect from "../components/ui/CustomSelect";
import { generateAcademicYears } from "../utils/academicYears";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaFolderOpen,
  FaArrowLeft,
  FaSearch,
  FaCheckCircle,
  FaUser,
  FaGithub,
  FaFileAlt,
  FaDownload,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaLaptopCode,
} from "react-icons/fa";

export default function ProjectsApproved() {
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  const [academicYear, setAcademicYear] = useState("");
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

  const getApprovedByLabel = (project) =>
    project.verified_by_fullname ||
    project.verified_by_name ||
    project.approved_by_fullname ||
    project.approved_by_name ||
    project.approved_by ||
    project.approvedBy ||
    project.approvedByName ||
    project.verified_by_email ||
    project.approved_by_email ||
    "Staff";

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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Home
          </button>
        </div>

        {/* Title Header Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-xs flex-shrink-0">
            <FaLaptopCode className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Approved Projects
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Browse verified student and staff projects.
            </p>
          </div>
        </div>

        {/* Search & Academic Year Filter Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Search Projects
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search projects by title, description, or student..."
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            {/* Academic Year Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Year
              </label>
              <CustomSelect
                value={academicYear}
                onChange={(value) => {
                  setAcademicYear(value);
                  setPage(1);
                }}
                options={academicYearOptions.map((year) => ({
                  value: year.value,
                  label: year.label,
                }))}
                placeholder="All Years"
                buttonClassName="rounded-xl border-slate-300 py-2.5 text-slate-900 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500">
            {loading ? "Loading..." : `Showing ${projects.length} verified projects`}
          </p>
        </div>

        {/* Projects List */}
        {!loading && projects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-sm space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">
              No approved projects found
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Try adjusting your search query or academic year filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((p) => {
              const files = (() => {
                if (!p.files) return [];
                try {
                  return typeof p.files === "string"
                    ? JSON.parse(p.files)
                    : p.files;
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
                  className="group rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500 transition-all duration-200 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.title}
                        </h3>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                          <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                        {approvedAt && (
                          <span className="text-xs font-bold text-slate-400">
                            {new Date(approvedAt).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        {p.description || "No description provided."}
                      </p>

                      {/* Uploader & Approver Pill Badges */}
                      <div className="flex flex-wrap gap-3 text-xs pt-1">
                        <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 font-semibold text-slate-700 flex items-center gap-2">
                          <FaUser className="w-3 h-3 text-blue-500" />
                          <span>Uploaded by: <strong>{getUploaderLabel(p)}</strong></span>
                        </div>
                        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 px-3 py-1.5 font-semibold text-emerald-900 flex items-center gap-2">
                          <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Approved by: <strong>{getApprovedByLabel(p)}</strong></span>
                        </div>
                      </div>

                      {/* GitHub Link */}
                      {p.github_url && (
                        <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-800 min-w-0 overflow-hidden">
                          <FaGithub className="w-3.5 h-3.5 text-slate-900 flex-shrink-0 mt-0.5" />
                          <span className="flex-shrink-0">Repo:</span>
                          <a
                            href={p.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline break-all min-w-0 flex-1"
                          >
                            {p.github_url}
                          </a>
                        </div>
                      )}

                      {/* Team Members */}
                      {teamStr && (
                        <div className="text-xs text-slate-600 font-medium">
                          <strong className="text-slate-900">Team:</strong> {teamStr}
                        </div>
                      )}

                      {/* Attachments */}
                      {files.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Attachments ({files.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {files.map((f, i) => {
                              const filename =
                                f.filename ||
                                f.file ||
                                (typeof f === "string" ? f : undefined);
                              const original =
                                f.original_name || f.name || filename;
                              const downloadUrl = getFileUrl(filename);

                              return (
                                <div
                                  key={i}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewFile({
                                        filename,
                                        original_name: original,
                                      })
                                    }
                                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1.5"
                                  >
                                    <FaFileAlt className="w-3 h-3" />
                                    {original || "Attachment"}
                                  </button>
                                  {filename && (
                                    <a
                                      href={downloadUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="text-slate-500 hover:text-blue-600 p-0.5"
                                      title="Download file"
                                    >
                                      <FaDownload className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <Link
                        to={`/projects/${p.id}`}
                        state={{ project: p }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2 text-xs shadow-md shadow-blue-500/20 transition"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
          >
            <FaChevronLeft className="w-3 h-3" /> Prev
          </button>
          <span className="text-xs font-bold text-slate-600">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!loading && projects.length < limit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
          >
            Next <FaChevronRight className="w-3 h-3" />
          </button>
        </div>

        {previewFile && (
          <AttachmentPreview
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </div>
    </div>
  );
}
