import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axiosClient";
import AttachmentPreview from "../components/AttachmentPreview";
import CustomSelect from "../components/ui/CustomSelect";
import ShareableProofLink from "../components/ShareableProofLink";
import { generateAcademicYears } from "../utils/academicYears";
import {
  FaUsers,
  FaArrowLeft,
  FaSearch,
  FaFileAlt,
  FaBuilding,
  FaCalendarAlt,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { calculateDuration } from "../utils/duration";

export default function FacultyParticipationApproved() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  const academicYearOptions = useMemo(() => generateAcademicYears(), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("offset", String((page - 1) * limit));
        if (q.trim()) params.set("q", q.trim());
        if (academicYear) params.set("year", academicYear);
        const data = await apiClient.get(
          `/faculty-participations?${params.toString()}`,
        );
        if (!mounted) return;
        setItems(data.participation || []);
        setTotal(data.total || 0);
      } catch (e) {
        console.error(e);
        if (mounted) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [q, academicYear, page, limit]);

  const toYear = (value) => {
    if (!value) return "";
    const match = String(value).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : "";
  };

  const totalPages = Math.ceil(total / limit);

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

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaUsers className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Faculty Participations & FDP
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Verified faculty development programs, workshops, seminars, and certifications.
            </p>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Search Participations
              </label>
              <div className="relative flex items-center">
                <FaSearch className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by faculty, program title, organizer..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>

            {/* Academic Year Filter */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Academic Year
              </label>
              <CustomSelect
                options={academicYearOptions}
                value={academicYear}
                onChange={(val) => {
                  setAcademicYear(val);
                  setPage(1);
                }}
                placeholder="All Years"
                buttonClassName="rounded-2xl border-slate-200 dark:border-slate-800 py-2.5 text-slate-900 dark:text-white font-semibold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Loading participations...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              No participation records found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {q ? "Try adjusting your search criteria" : "No approved faculty participation records available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-lg hover:shadow-blue-600/10 hover:border-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex-shrink-0 shadow-xs">
                        <FaChalkboardTeacher className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {item.title || "Untitled Program"}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {item.faculty_name || "Faculty Member"} • {item.department || "IT Department"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700 dark:text-blue-300">
                      {item.type_of_event || "Participation"}
                    </span>
                    {item.mode_of_training && (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                        {item.mode_of_training}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    {item.start_date && (
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                          <FaCalendarAlt className="w-2.5 h-2.5 text-blue-500" /> Start Date
                        </span>
                        {new Date(item.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {item.end_date && (
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                          <FaCalendarAlt className="w-2.5 h-2.5 text-purple-500" /> End Date
                        </span>
                        {new Date(item.end_date).toLocaleDateString()}
                      </div>
                    )}
                    {(item.duration || (item.start_date && item.end_date)) && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Duration</span>
                        {item.duration || calculateDuration(item.start_date, item.end_date)}
                      </div>
                    )}
                    {item.conducted_by && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Conducted By</span>
                        {item.conducted_by}
                      </div>
                    )}
                  </div>

                  {item.details && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {item.details}
                    </p>
                  )}
                </div>

                {item.proof_filename && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewFile({
                          filename: item.proof_filename,
                          original_name:
                            item.proof_original_name || item.proof_filename,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/40 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-300 transition cursor-pointer"
                    >
                      <FaFileAlt className="w-3.5 h-3.5" />
                      View Proof Document
                    </button>
                    <ShareableProofLink type="participation" id={item.id} filename={item.proof_filename} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-extrabold text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
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
