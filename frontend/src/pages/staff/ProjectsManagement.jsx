import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";

export default function ProjectsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/projects?verified=false&limit=50");
      setItems(data.projects || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    try {
      setBusyId(id);
      await apiClient.post(`/projects/${id}/verify`);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      // ignore for now; could show toast
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    try {
      setBusyId(id);
      await apiClient.post(`/projects/${id}/reject`);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      // ignore for now; could show toast
    } finally {
      setBusyId(null);
    }
  };

  const toggleView = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Projects
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && !loading && (
          <div className="text-slate-600 dark:text-slate-300">
            No projects pending verification.
          </div>
        )}
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {p.title}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {p.mentor_name || ""}{" "}
                  {p.academic_year && `• ${p.academic_year}`}
                </div>
              </div>
              {p.verified ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  Verified
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleView(p.id)}
                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {expandedId === p.id ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    disabled={busyId === p.id}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
                  >
                    {busyId === p.id ? "Processing..." : "Reject"}
                  </button>
                  <button
                    onClick={() => approve(p.id)}
                    disabled={busyId === p.id}
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busyId === p.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              )}
            </div>
            {expandedId === p.id && (
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {p.description && (
                  <div>
                    <span className="font-semibold">Description:</span>{" "}
                    {p.description}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Mentor:</span>{" "}
                  {p.mentor_name || "—"}
                </div>
                <div>
                  <span className="font-semibold">Year:</span>{" "}
                  {p.academic_year || "—"}
                </div>
                {p.github_url && (
                  <div>
                    <span className="font-semibold">GitHub:</span>{" "}
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {p.github_url}
                    </a>
                  </div>
                )}
                {Array.isArray(p.files) && p.files.length > 0 && (
                  <div className="mt-2">
                    <span className="font-semibold">Files:</span>
                    <ul className="mt-1 list-disc pl-5">
                      {p.files.map((f) => (
                        <li key={f.id}>
                          <a
                            href={`/uploads/${f.filename}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {f.original_name || f.filename}
                          </a>
                          {f.mime_type && ` (${f.mime_type})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
