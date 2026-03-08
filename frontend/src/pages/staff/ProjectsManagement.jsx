import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { getFileUrl } from "../../utils/fileUrl";
import DataTableContainer from "../../components/ui/DataTableContainer";
import StatusBadge from "../../components/ui/StatusBadge";
import DataRow from "../../components/ui/DataRow";

export default function ProjectsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState("pending");
  const [modal, setModal] = useState({ open: false, item: null });
  const [suggestion, setSuggestion] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      // Show all unverified projects regardless of status/type
      const data = await apiClient.get("/projects?verified=false&limit=50");
      // Exclude rejected items from the pending view
      const list = (data.projects || []).filter(
        (p) => (p.verification_status || "").toLowerCase() !== "rejected",
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

  const approve = async (id, comment) => {
    try {
      setBusyId(id);
      const payload =
        typeof comment === "string" && comment.trim()
          ? { comment: comment.trim() }
          : {};
      const resp = await apiClient.post(`/projects/${id}/verify`, payload);
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

  const reject = async (id, comment) => {
    try {
      setBusyId(id);
      const payload =
        typeof comment === "string" && comment.trim()
          ? { comment: comment.trim() }
          : {};
      const resp = await apiClient.post(`/projects/${id}/reject`, payload);
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
        "/projects?verification_status=rejected&limit=200",
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
  const openModal = (item) => {
    setSuggestion(item?.verification_comment || "");
    setModal({ open: true, item });
  };
  const closeModal = () => {
    setModal({ open: false, item: null });
    setSuggestion("");
  };
  const approveFromModal = async () => {
    if (!modal.item?.id) return;
    await approve(modal.item.id, suggestion);
    closeModal();
  };
  const rejectFromModal = async () => {
    if (!modal.item?.id) return;
    await reject(modal.item.id, suggestion);
    closeModal();
  };

  return (
    <DataTableContainer
      title="Projects"
      filters={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              setView("pending");
              await load();
            }}
            className={`rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              view === "pending"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={async () => {
              setView("rejected");
              await showRejected();
            }}
            className={`rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              view === "rejected"
                ? "bg-red-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Rejected
          </button>
        </div>
      }
      actions={
        <button
          onClick={() => (view === "pending" ? load() : showRejected())}
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      <div className="space-y-3">
        {items.length === 0 && !loading && (
          <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-300">
            {view === "pending"
              ? "No projects pending verification."
              : "No rejected projects found."}
          </div>
        )}
        {items.map((p) => (
          <DataRow
            key={p.id}
            expanded={expandedId === p.id}
            onToggle={() => toggleView(p.id)}
            header={
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {p.title}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {p.mentor_name || ""}{" "}
                  {p.academic_year && `• ${p.academic_year}`}
                </div>
              </div>
            }
            actions={
              p.verification_status === "approved" ? (
                <StatusBadge status="approved" label="Verified" />
              ) : p.verification_status === "rejected" ? (
                <StatusBadge status="rejected" />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => openModal(p)}
                    className="rounded-md bg-slate-200 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 whitespace-nowrap"
                  >
                    View
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    disabled={busyId === p.id}
                    className="rounded-md bg-red-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {busyId === p.id ? "Processing..." : "Reject"}
                  </button>
                  <button
                    onClick={() => approve(p.id)}
                    disabled={busyId === p.id}
                    className="rounded-md bg-blue-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {busyId === p.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              )
            }
            details={
              <div className="space-y-2">
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
                <div>
                  <span className="font-semibold">GitHub:</span>{" "}
                  {p.github_url ? (
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {p.github_url}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                {Array.isArray(p.files) && p.files.length > 0 && (
                  <div className="mt-2">
                    <span className="font-semibold">Files:</span>
                    <ul className="mt-1 list-disc pl-5">
                      {p.files.map((f) => (
                        <li key={f.id}>
                          <a
                            href={getFileUrl(f.filename)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
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
            }
          />
        ))}
      </div>
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-4 sm:p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                Project Details
              </h3>
              <button
                className="rounded-md bg-slate-200 px-3 py-1.5 text-xs sm:text-sm font-medium dark:bg-slate-800 self-start sm:self-auto"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
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
              <div>
                <span className="font-semibold">GitHub:</span>{" "}
                {modal.item?.github_url ? (
                  <a
                    href={modal.item.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {modal.item.github_url}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
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
                                src={getFileUrl(f.filename)}
                                alt={f.original_name || f.filename}
                                className="max-h-80 rounded border"
                              />
                            </div>
                          ) : (
                            <a
                              href={getFileUrl(f.filename)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline dark:text-blue-400"
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
            <div className="mt-4">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Suggestion to student (optional)
              </label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={3}
                placeholder="Add a suggestion the student will see in notifications"
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs sm:text-sm text-slate-800 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                onClick={rejectFromModal}
                disabled={busyId === modal.item?.id}
                className="rounded-md bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyId === modal.item?.id ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={approveFromModal}
                disabled={busyId === modal.item?.id}
                className="rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyId === modal.item?.id ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DataTableContainer>
  );
}
