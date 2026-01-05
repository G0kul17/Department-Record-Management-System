import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function FacultyConsultancyApproved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
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
        const data = await apiClient.get(`/faculty-consultancy?${params.toString()}`);
        if (!mounted) return;
        setItems(data.consultancy || []);
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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <PageHeader title="Faculty Consultancy Projects" />

        {/* Search Box */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by faculty name, project title, organization..."
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        )}

        {/* Items Grid */}
        {!loading && items.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-6 flex flex-col hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {item.project_title || "Untitled Project"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {item.faculty_name || "Unknown Faculty"}
                  </p>
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  {item.organization_name && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Organization:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {item.organization_name}
                      </p>
                    </div>
                  )}
                  {item.project_duration && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Duration:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {item.project_duration}
                      </p>
                    </div>
                  )}
                  {item.project_value && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Value:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">
                        ₹{item.project_value}
                      </p>
                    </div>
                  )}
                  {item.description && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Description:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
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
      </div>
    </div>
  );
}
