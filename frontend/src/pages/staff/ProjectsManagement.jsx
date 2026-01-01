import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";

export default function ProjectsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState("pending");
  const [modal, setModal] = useState({ open: false, item: null });

  const load = async () => {
    setLoading(true);
    try {
      // Show all unverified projects regardless of status/type
      const data = await apiClient.get("/projects?verified=false&limit=50");
      // Exclude rejected items from the pending view
      const list = (data.projects || []).filter(
        (p) => (p.verification_status || "").toLowerCase() !== "rejected"
      );
      setItems(list);
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
      const resp = await apiClient.post(`/projects/${id}/verify`);
      if (resp) {
        // refresh pending list from server to reflect actual DB state
        await load();
      }
    } catch (e) {
      // ignore for now; could show toast
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    try {
      setBusyId(id);
      const resp = await apiClient.post(`/projects/${id}/reject`);
      if (resp) {
        // refresh pending list from server to reflect actual DB state
        await load();
      }
    } catch (e) {
      // ignore for now; could show toast
    } finally {
      setBusyId(null);
    }
  };

  const showRejected = async () => {
    setLoading(true);
    try {
      // Filter by verification_status for rejected items
      const data = await apiClient.get(
        "/projects?verification_status=rejected&limit=200"
      );
      setItems(data.projects || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };
  const openModal = (item) => setModal({ open: true, item });
  const closeModal = () => setModal({ open: false, item: null });

  return (
    <div className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Projects
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={async () => {
                setView("pending");
                await load();
              }}
              className={`text-xs rounded-md px-2 py-0.5 font-semibold ${
                view === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              Pending
            </button>
            <button
              onClick={async () => {
                setView("rejected");
                await showRejected();
              }}
              className={`text-xs rounded-md px-2 py-0.5 font-semibold ${
                view === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        <button
          onClick={() => (view === "pending" ? load() : showRejected())}
          disabled={loading}
          className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && !loading && (
          <div className="text-slate-600 dark:text-slate-300">
            {view === "pending"
              ? "No projects pending verification."
              : "No rejected projects found."}
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
              {p.verification_status === "approved" ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  Verified
                </span>
              ) : p.verification_status === "rejected" ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  Rejected
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(p)}
                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100"
                  >
                    View
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
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-w-2xl w-full rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Project Details
              </h3>
              <button
                className="rounded-md bg-slate-200 px-3 py-1 text-sm dark:bg-slate-800"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-semibold">Title:</span>{" "}
                {modal.item?.title}
              </div>
              {modal.item?.description && (
                <div>
                  <span className="font-semibold">Description:</span>{" "}
                  {modal.item?.description}
                </div>
              )}
              <div>
                <span className="font-semibold">Mentor:</span>{" "}
                {modal.item?.mentor_name}
              </div>
              <div>
                <span className="font-semibold">Year:</span>{" "}
                {modal.item?.academic_year}
              </div>
              {modal.item?.github_url && (
                <div>
                  <span className="font-semibold">GitHub:</span>{" "}
                  <a
                    href={modal.item.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {modal.item.github_url}
                  </a>
                </div>
              )}
              {Array.isArray(modal.item?.files) &&
                modal.item.files.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold">Files:</span>
                    <ul className="mt-1 list-disc pl-5">
                      {modal.item.files.map((f) => (
                        <li key={f.id}>
                          {f.mime_type?.startsWith("image/") ? (
                            <div className="mt-2">
                              <img
                                src={`${apiClient.baseURL.replace(
                                  /\/api$/,
                                  ""
                                )}/uploads/${f.filename}`}
                                alt={f.original_name || f.filename}
                                className="max-h-80 rounded border"
                              />
                            </div>
                          ) : (
                            <a
                              href={`${apiClient.baseURL.replace(
                                /\/api$/,
                                ""
                              )}/uploads/${f.filename}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {f.original_name || f.filename}
                            </a>
                          )}
                          {f.mime_type && ` (${f.mime_type})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
