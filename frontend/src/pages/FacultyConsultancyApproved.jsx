import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axiosClient";
import AttachmentPreview from "../components/AttachmentPreview";
import CustomSelect from "../components/ui/CustomSelect";
import { generateAcademicYears } from "../utils/academicYears";
import {
  FaBriefcase,
  FaArrowLeft,
  FaSearch,
  FaFileAlt,
  FaBuilding,
  FaUsers,
  FaCalendarAlt,
} from "react-icons/fa";

export default function FacultyConsultancyApproved() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [previewFile, setPreviewFile] = useState(null);

  const academicYearOptions = useMemo(() => generateAcademicYears(), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/faculty-consultancy`);
        if (!mounted) return;
        setItems(Array.isArray(data.data) ? data.data : data.consultancy || []);
      } catch (e) {
        console.error(e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    const toYear = (value) => {
      if (!value) return "";
      const match = String(value).match(/\b(19|20)\d{2}\b/);
      return match ? match[0] : "";
    };
    const query = q.trim().toLowerCase();
    let result = items;
    if (query) {
      result = result.filter((it) =>
        [it.faculty_name, it.team_members, it.agency, it.duration]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query)),
      );
    }
    if (academicYear) {
      result = result.filter((it) => {
        const itemYear =
          toYear(it.academic_year) || toYear(it.start_date) || "";
        return itemYear.includes(academicYear.substring(0, 4));
      });
    }
    return result;
  }, [items, q, academicYear]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

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
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 shadow-xs flex-shrink-0">
            <FaBriefcase className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Faculty Consultancy Projects
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified corporate consulting, industry projects, and advisory services.
            </p>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Search Consultancy
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
                  placeholder="Search by faculty, team members, agency..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-600 shadow-sm"
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
            Showing {pageItems.length} of {filtered.length} consultancy projects
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-sm space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading consultancy projects...</p>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-sm space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">
              No consultancy projects found
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {q ? "Try adjusting your search criteria" : "No approved faculty consultancy records available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pageItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md hover:border-cyan-400 hover:shadow-cyan-500/10 transition-all duration-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex-shrink-0 shadow-sm">
                        <FaBriefcase className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-1">
                          {item.agency || "Corporate Consultancy"}
                        </h3>
                        <p className="text-xs font-bold text-slate-500">
                          {item.faculty_name || "Faculty Lead"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-2xl border border-slate-100 font-semibold text-slate-600">
                    {item.team_members && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Team Members</span>
                        {item.team_members}
                      </div>
                    )}
                    {item.amount && (
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Amount Received</span>
                        ₹{Number(item.amount).toLocaleString()}
                      </div>
                    )}
                    {item.duration && (
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Duration</span>
                        {item.duration}
                      </div>
                    )}
                  </div>
                </div>

                {item.proof_filename && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewFile({
                          filename: item.proof_filename,
                          original_name:
                            item.proof_original_name || item.proof_filename,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 text-xs font-extrabold text-cyan-700 transition cursor-pointer"
                    >
                      <FaFileAlt className="w-3.5 h-3.5" />
                      View Consultancy Proof
                    </button>
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
