import React, { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api/axiosClient";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import AttachmentPreview from "../components/AttachmentPreview";

export default function FacultyConsultancyApproved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [yearOpen, setYearOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [previewFile, setPreviewFile] = useState(null);
  const yearRef = useRef(null);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 15; y -= 1) {
      years.push(String(y));
    }
    return years;
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!yearRef.current) return;
      if (!yearRef.current.contains(e.target)) setYearOpen(false);
    }
    if (yearOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [yearOpen]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Backend returns { data: rows }
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
        return itemYear === academicYear;
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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PageHeader title="Faculty Consultancy Projects" />

        {/* Search Box */}
        <div className="mx-auto max-w-3xl mb-8">
          <div className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
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
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="m21 21-4.35-4.35"
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
                    placeholder="Search by faculty, members, agency..."
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-10 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
              </div>
              {/* Academic Year dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Academic Year
                </label>
                <div className="relative" ref={yearRef}>
                  <button
                    type="button"
                    onClick={() => setYearOpen((prev) => !prev)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-left text-xs text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:py-2 sm:text-sm"
                  >
                    {academicYear || "All Years"}
                  </button>
                  {yearOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg z-20">
                      <button
                        type="button"
                        onClick={() => {
                          setAcademicYear("");
                          setPage(1);
                          setYearOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs text-black hover:text-black sm:text-sm ${
                          academicYear === ""
                            ? "bg-sky-200"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        All Years
                      </button>
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            setAcademicYear(year);
                            setPage(1);
                            setYearOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs text-black hover:text-black sm:text-sm ${
                            academicYear === year
                              ? "bg-sky-200"
                              : "hover:bg-slate-100"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        )}

        {/* Items Grid */}
        {!loading && pageItems.length > 0 && (
          <div className="space-y-6 mb-8">
            {pageItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 sm:p-6 flex flex-col hover:shadow-lg transition-shadow w-full border-sky-300"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {item.agency || "Consultancy"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {item.faculty_name || "Unknown Faculty"}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 flex-grow text-sm">
                  {item.team_members && (
                    <p>
                      <span className="font-semibold">Team Members:</span>{" "}
                      {item.team_members}
                    </p>
                  )}
                  {item.duration && (
                    <p>
                      <span className="font-semibold">Duration:</span>{" "}
                      {item.duration}
                    </p>
                  )}
                  {(item.start_date || item.end_date) && (
                    <p>
                      <span className="font-semibold">Dates:</span>{" "}
                      {item.start_date
                        ? new Date(item.start_date).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {item.end_date
                        ? new Date(item.end_date).toLocaleDateString()
                        : "—"}
                    </p>
                  )}
                  {item.amount && (
                    <p>
                      <span className="font-semibold">Amount:</span> ₹
                      {item.amount}
                    </p>
                  )}
                </div>

                {/* Proof */}
                {item.proof_filename && (
                  <button
                    onClick={() =>
                      setPreviewFile({
                        filename: item.proof_filename,
                        original_name:
                          item.proof_original_name || item.proof_filename,
                      })
                    }
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Proof Document
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">
              No consultancy projects found
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

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
