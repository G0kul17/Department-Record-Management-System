import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/axiosClient";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import AttachmentPreview from "../components/AttachmentPreview";

export default function FacultyResearchApproved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Backend returns { data: rows }
        const data = await apiClient.get(`/faculty-research`);
        if (!mounted) return;
        setItems(Array.isArray(data.data) ? data.data : data.research || []);
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
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) => {
      return [
        it.faculty_name,
        it.principal_investigator,
        it.title,
        it.agency,
        it.current_status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [items, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <PageHeader title="Faculty Research Publications" />

        {/* Search Box */}
        <div className="mx-auto max-w-3xl mb-8">
          <div className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-3 items-start">
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
                    placeholder="Search by faculty, title, PI, agency..."
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
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        )}

        {/* Items Grid */}
        {!loading && pageItems.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {pageItems.map((item) => (
              <Card
                key={item.id}
                className="p-6 flex flex-col hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {item.title || "Untitled Research"}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.funded_type && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {item.funded_type}
                      </span>
                    )}
                    {item.current_status && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        {item.current_status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 flex-grow text-sm">
                  {item.faculty_name && (
                    <p>
                      <span className="font-semibold">Faculty:</span>{" "}
                      {item.faculty_name}
                    </p>
                  )}
                  {item.principal_investigator && (
                    <p>
                      <span className="font-semibold">PI:</span>{" "}
                      {item.principal_investigator}
                    </p>
                  )}
                  {item.agency && (
                    <p>
                      <span className="font-semibold">Agency:</span>{" "}
                      {item.agency}
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
              No research publications found
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
