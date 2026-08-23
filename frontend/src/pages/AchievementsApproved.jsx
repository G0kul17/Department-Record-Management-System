import React, { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";
import CustomSelect from "../components/ui/CustomSelect";
import ShareableProofLink from "../components/ShareableProofLink";
import { generateAcademicYears } from "../utils/academicYears";
import { getFileUrl } from "../utils/fileUrl";
import { loadAchievementTypes } from "../utils/achievementTypes";
import {
  FaTrophy,
  FaArrowLeft,
  FaSearch,
  FaCheckCircle,
  FaUser,
  FaFileAlt,
  FaDownload,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaAward,
} from "react-icons/fa";

export default function AchievementsApproved() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshId, setRefreshId] = useState(0);
  const [achievementTypes, setAchievementTypes] = useState([]);

  const academicYearOptions = useMemo(() => generateAcademicYears(), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const types = await loadAchievementTypes();
      if (mounted) setAchievementTypes(types);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getUploadedByLabel = (item) =>
    (item.user_email || item.student_email || "").trim() ||
    item.user_fullname ||
    item.studentName ||
    item.name ||
    "Student";

  const getApprovedByLabel = (item) =>
    item.verified_by_fullname ||
    item.verified_by_name ||
    item.approved_by_fullname ||
    item.approved_by_name ||
    item.approved_by ||
    item.approvedBy ||
    item.approvedByName ||
    item.verified_by_email ||
    item.approved_by_email ||
    "Staff";

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
        if (academicYear) params.set("year", academicYear);

        const data = await apiClient.get(`/achievements?${params.toString()}`);
        if (!mounted) return;
        setItems(data.achievements || []);
      } catch (error) {
        console.error(error);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [q, academicYear, category, page, limit, refreshId]);

  useEffect(() => {
    if (!items.length) return;

    const missing = items.filter((item) => !item?.user_email);
    if (!missing.length) return;

    let cancelled = false;

    (async () => {
      try {
        const updates = [];

        for (const item of missing) {
          try {
            const res = await apiClient.get(`/achievements/${item.id}`);
            const detail = res.achievement || res;
            if (!detail) continue;

            updates.push({
              id: item.id,
              user_email: detail.user_email || item.user_email,
              user_fullname: detail.user_fullname || item.user_fullname,
            });
          } catch {
            // Ignore per-item enrichment failures.
          }
        }

        if (!cancelled && updates.length) {
          setItems((prev) =>
            prev.map((current) => {
              const update = updates.find(
                (candidate) => candidate.id === current.id,
              );
              return update ? { ...current, ...update } : current;
            }),
          );
        }
      } catch {
        // Ignore enrichment failures.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>

        {/* Title Header Box */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaTrophy className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Approved Achievements
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Browse verified student certificates, awards, and achievements.
            </p>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Search Achievements
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search achievements by title, student, or detail..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-xs"
                />
              </div>
            </div>

            {/* Category Select */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Achievement Type
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  setPage(1);
                }}
                options={achievementTypes.map((t) => ({ value: t, label: t }))}
                placeholder="All Types"
                buttonClassName="rounded-xl border-slate-300 dark:border-slate-700 py-2.5 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            {/* Academic Year Select */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                buttonClassName="rounded-xl border-slate-300 dark:border-slate-700 py-2.5 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {loading ? "Loading..." : `Showing ${items.length} verified achievement${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Achievements List */}
        {!loading && items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 mx-auto">
              <FaTrophy className="w-6 h-6" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              No approved achievements found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Try adjusting your search query or type filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {items.map((item) => {
              const attachments = [];

              if (item.proof_filename) {
                attachments.push({
                  name: item.proof_name || item.proof_filename,
                  filename: item.proof_filename,
                });
              }

              if (item.attachments) {
                try {
                  const arr =
                    typeof item.attachments === "string"
                      ? JSON.parse(item.attachments)
                      : item.attachments;
                  if (Array.isArray(arr)) {
                    arr.forEach((file) => {
                      if (!file) return;
                      if (typeof file === "string") {
                        attachments.push({ name: file, filename: file });
                      } else {
                        attachments.push({
                          name: file.original_name || file.name || file.filename,
                          filename: file.filename || file.file,
                        });
                      }
                    });
                  }
                } catch {
                  // Ignore malformed payloads
                }
              }

              const team = item.team_members || item.teamMembers || item.team || [];
              const teamStr = Array.isArray(team) ? team.join(", ") : team;
              const approvedAt =
                item.verified_at || item.approvedAt || item.created_at;

              return (
                <div
                  key={item.id}
                  className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500/50 dark:hover:border-blue-700 transition-all duration-200 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-0.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <FaCheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                        {approvedAt && (
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            {new Date(approvedAt).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Uploader & Approver Pill Badges */}
                      <div className="flex flex-wrap gap-3 text-xs pt-1">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FaUser className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>Student: <strong>{getUploadedByLabel(item)}</strong></span>
                        </div>
                        <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 px-3 py-1.5 font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                          <FaCheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Approved by: <strong>{getApprovedByLabel(item)}</strong></span>
                        </div>
                      </div>

                      {/* Team Members */}
                      {teamStr && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <strong className="text-slate-900 dark:text-white">Team:</strong> {teamStr}
                        </div>
                      )}

                      {/* Attachments / Proof Files */}
                      {attachments.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Proof Documents ({attachments.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((attachment, index) => {
                              const filename = attachment.filename;
                              const original =
                                attachment.name ||
                                attachment.original_name ||
                                filename;
                              const downloadUrl = getFileUrl(filename);

                              return (
                                <div
                                  key={`${filename || original || "attachment"}-${index}`}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 text-xs font-semibold"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewFile({
                                        filename,
                                        original_name: original,
                                      })
                                    }
                                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1.5"
                                  >
                                    <FaFileAlt className="w-3 h-3" />
                                    {original || "Proof File"}
                                  </button>
                                  {filename && (
                                    <>
                                      <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        download
                                        className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-0.5"
                                        title="Download file"
                                      >
                                        <FaDownload className="w-3 h-3" />
                                      </a>
                                      <ShareableProofLink type="achievement" id={item.id} filename={filename} className="ml-1" />
                                    </>
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
                        to={`/achievements/${item.id}`}
                        state={{ achievement: item }}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2 text-xs shadow-md shadow-blue-600/25 transition"
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
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
          >
            <FaChevronLeft className="w-3 h-3" /> Prev
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!loading && items.length < limit}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
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
