import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import AttachmentPreview from "../components/AttachmentPreview";

export default function FacultyParticipationApproved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("offset", String((page - 1) * limit));
        if (q.trim()) params.set("q", q.trim());
        const data = await apiClient.get(`/faculty-participations?${params.toString()}`);
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
  }, [q, page, limit]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-6xl p-6">

      {/* Centered search below navbar */}
      <div className="mx-auto max-w-3xl mb-8">
        <div className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 items-start">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Search
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by faculty name, title, department, event type..."
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-10 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading participations...</p>
        </div>
      )}

      {/* Items List */}
      {!loading && items.length > 0 && (
        <div className="space-y-6 mb-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {item.title || "Untitled"}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {item.type_of_event || "N/A"}
                  </span>
                  {item.mode_of_training && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      {item.mode_of_training}
                    </span>
                  )}
                  {item.publications_type && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {item.publications_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {item.faculty_name && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Faculty Name</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{item.faculty_name}</p>
                  </div>
                )}
                {item.department && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Department</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100">{item.department}</p>
                  </div>
                )}
                {item.start_date && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {new Date(item.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.end_date && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">End Date</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {new Date(item.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.conducted_by && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Conducted By</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100">{item.conducted_by}</p>
                  </div>
                )}
              </div>

              {/* Publications Info (if available) */}
              {(item.paper_title || item.journal_name || item.claiming_faculty_name) && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Publication Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.claiming_faculty_name && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Claiming Faculty</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{item.claiming_faculty_name}</p>
                      </div>
                    )}
                    {item.paper_title && (
                      <div className="md:col-span-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Paper Title</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{item.paper_title}</p>
                      </div>
                    )}
                    {item.journal_name && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Journal/Conference</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{item.journal_name}</p>
                      </div>
                    )}
                    {item.publication_indexing && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Indexing</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{item.publication_indexing}</p>
                      </div>
                    )}
                    {item.impact_factor && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Impact Factor</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{item.impact_factor}</p>
                      </div>
                    )}
                    {item.citations_count !== null && item.citations_count !== undefined && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Citations</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{item.citations_count}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {item.details && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Details</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.details}</p>
                </div>
              )}

              {/* Footer with proof */}
              {item.proof_filename && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setPreviewFile({
                      url: `/uploads/${item.proof_filename}`,
                      name: item.proof_original_name || item.proof_filename,
                      type: item.proof_filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
                    })}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="13 2 13 9 20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    View Proof Document
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No participation records found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {q ? "Try adjusting your search query" : "No faculty participation records available yet"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages} • {total} total records
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewFile && (
        <AttachmentPreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
