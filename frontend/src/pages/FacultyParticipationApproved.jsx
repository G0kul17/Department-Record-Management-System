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
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Home
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shadow-xs flex-shrink-0">
            <FaUsers className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Faculty Participations & FDP
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified faculty development programs, workshops, seminars, and certifications.
            </p>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
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
                  placeholder="Search by faculty name, title, department, event type..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 shadow-sm"
                />
              </div>
            </div>

            {/* Academic Year Filter */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
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
              />
            </div>
          </div>
        </div>

        {/* Count Indicator */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500">
            Showing {items.length} of {total} records
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-sm space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading participations...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-sm space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">
              No participation records found
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {q ? "Try adjusting your search criteria" : "No approved faculty participations available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items
              .filter((item) => {
                if (!academicYear) return true;
                const itemYear =
                  toYear(item.academic_year) || toYear(item.start_date) || "";
                return itemYear.includes(academicYear.substring(0, 4));
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="group rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-400 hover:shadow-purple-500/10 transition-all duration-200 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex-shrink-0 shadow-sm">
                          <FaChalkboardTeacher className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                            {item.title || "Untitled Program"}
                          </h3>
                          <p className="text-xs font-bold text-slate-500">
                            {item.faculty_name || "Faculty Member"} • {item.department || "IT Department"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700">
                        {item.type_of_event || "Participation"}
                      </span>
                      {item.mode_of_training && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700">
                          {item.mode_of_training}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-2xl border border-slate-100 font-semibold text-slate-600">
                      {item.start_date && (
                        <div>
                          <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Start Date</span>
                          {new Date(item.start_date).toLocaleDateString()}
                        </div>
                      )}
                      {item.end_date && (
                        <div>
                          <span className="text-[10px] uppercase font-extrabold text-slate-400 block">End Date</span>
                          {new Date(item.end_date).toLocaleDateString()}
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
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {item.details}
                      </p>
                    )}
                  </div>

                  {item.proof_filename && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewFile({
                            filename: item.proof_filename,
                            original_name:
                              item.proof_original_name || item.proof_filename,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 text-xs font-extrabold text-purple-700 transition cursor-pointer"
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
