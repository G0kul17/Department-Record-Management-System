import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { getFileUrl } from "../../utils/fileUrl";
import DataTableContainer from "../../components/ui/DataTableContainer";
import StatusBadge from "../../components/ui/StatusBadge";
import DataRow from "../../components/ui/DataRow";

export default function AchievementsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState({ open: false, item: null });
  const [view, setView] = useState("pending");
  const [suggestion, setSuggestion] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(
        "/achievements?verified=false&status=pending&limit=50",
      );
      setItems(data.achievements || []);
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
      const resp = await apiClient.post(`/achievements/${id}/verify`, payload);
      if (resp) await load();
    } catch (e) {
      // optionally handle error
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
      const resp = await apiClient.post(`/achievements/${id}/reject`, payload);
      if (resp) await load();
    } catch (e) {
      // optionally handle error
    } finally {
      setBusyId(null);
    }
  };

  const showRejected = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(
        "/achievements?verified=false&status=rejected&limit=200",
      );
      setItems(data.achievements || []);
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
      title="Achievements"
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
            No achievements found.
          </div>
        )}
        {items.map((a) => (
          <DataRow
            key={a.id}
            expanded={expandedId === a.id}
            onToggle={() => toggleView(a.id)}
            header={
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {a.title}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {a.issuer || ""}
                </div>
              </div>
            }
            actions={
              a.verification_status === "approved" ? (
                <StatusBadge status="approved" label="Verified" />
              ) : a.verification_status === "rejected" ? (
                <StatusBadge status="rejected" />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => openModal(a)}
                    className="rounded-md bg-slate-200 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 whitespace-nowrap"
                  >
                    View
                  </button>
                  <button
                    onClick={() => reject(a.id)}
                    disabled={busyId === a.id}
                    className="rounded-md bg-red-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {busyId === a.id ? "Processing..." : "Reject"}
                  </button>
                  <button
                    onClick={() => approve(a.id)}
                    disabled={busyId === a.id}
                    className="rounded-md bg-blue-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {busyId === a.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              )
            }
            details={
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Issuer:</span>{" "}
                  {a.issuer || "—"}
                </div>
                <div>
                  <span className="font-semibold">Award Date:</span>{" "}
                  {a.date_of_award || a.date || "—"}
                </div>
                <div>
                  <span className="font-semibold">Name:</span> {a.name || "—"}
                </div>
                {a.position && (
                  <div>
                    <span className="font-semibold">Position:</span>{" "}
                    {a.position}
                  </div>
                )}
                {a.prize_amount && (
                  <div>
                    <span className="font-semibold">Prize Amount:</span> ₹
                    {parseFloat(a.prize_amount).toFixed(2)}
                  </div>
                )}
                {a.proof_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Main Proof:</span>{" "}
                    {a.proof_mime && a.proof_mime.startsWith("image/") ? (
                      <img
                        src={getFileUrl(a.proof_filename)}
                        alt={a.proof_name || "Proof"}
                        className="mt-2 max-h-64 rounded border"
                      />
                    ) : (
                      <a
                        href={getFileUrl(a.proof_filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {a.proof_name || "Download proof"}
                      </a>
                    )}
                  </div>
                )}
                {a.certificate_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Certificate:</span>{" "}
                    {a.certificate_mime &&
                    a.certificate_mime.startsWith("image/") ? (
                      <img
                        src={getFileUrl(a.certificate_filename)}
                        alt={a.certificate_name || "Certificate"}
                        className="mt-2 max-h-64 rounded border"
                      />
                    ) : (
                      <a
                        href={getFileUrl(a.certificate_filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {a.certificate_name || "Download certificate"}
                      </a>
                    )}
                  </div>
                )}
                {a.event_photos_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Event Photos:</span>{" "}
                    {a.event_photos_mime &&
                    a.event_photos_mime.startsWith("image/") ? (
                      <img
                        src={getFileUrl(a.event_photos_filename)}
                        alt={a.event_photos_name || "Event Photos"}
                        className="mt-2 max-h-64 rounded border"
                      />
                    ) : (
                      <a
                        href={getFileUrl(a.event_photos_filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {a.event_photos_name || "Download photos"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            }
          />
        ))}
      </div>
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-4 sm:p-6 shadow-xl dark:bg-slate-900 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                Achievement Details
              </h3>
              <button
                className="rounded-md bg-slate-200 px-3 py-1.5 text-xs sm:text-sm font-medium dark:bg-slate-800 self-start sm:self-auto"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-h-[50vh] sm:max-h-96 overflow-y-auto">
              <div>
                <span className="font-semibold">Title:</span>{" "}
                {modal.item?.title}
              </div>
              <div>
                <span className="font-semibold">Issuer:</span>{" "}
                {modal.item?.issuer}
              </div>
              <div>
                <span className="font-semibold">Award Date:</span>{" "}
                {modal.item?.date_of_award || modal.item?.date}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {modal.item?.name}
              </div>
              {modal.item?.position && (
                <div>
                  <span className="font-semibold">Position:</span>{" "}
                  {modal.item?.position}
                </div>
              )}
              {modal.item?.prize_amount && (
                <div>
                  <span className="font-semibold">Prize Amount:</span> ₹
                  {parseFloat(modal.item?.prize_amount).toFixed(2)}
                </div>
              )}
              <div>
                <span className="font-semibold">Uploaded By:</span>{" "}
                {modal.item?.user_email}
              </div>
              <div className="mt-3">
                <span className="font-semibold">Main Proof:</span>
                {modal.item?.proof_mime &&
                modal.item?.proof_mime.startsWith("image/") ? (
                  <div className="mt-2">
                    <img
                      alt={modal.item?.proof_name || "proof"}
                      src={getFileUrl(modal.item?.proof_filename)}
                      className="max-h-80 rounded"
                    />
                  </div>
                ) : modal.item?.proof_filename ? (
                  <a
                    href={getFileUrl(modal.item?.proof_filename)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400 ml-2"
                  >
                    Download proof
                  </a>
                ) : (
                  <span className="ml-2">No file</span>
                )}
              </div>
              {modal.item?.certificate_filename && (
                <div className="mt-3">
                  <span className="font-semibold">Certificate:</span>
                  {modal.item?.certificate_mime &&
                  modal.item?.certificate_mime.startsWith("image/") ? (
                    <div className="mt-2">
                      <img
                        alt={modal.item?.certificate_name || "certificate"}
                        src={getFileUrl(modal.item?.certificate_filename)}
                        className="max-h-80 rounded"
                      />
                    </div>
                  ) : (
                    <a
                      href={getFileUrl(modal.item?.certificate_filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 ml-2"
                    >
                      Download certificate
                    </a>
                  )}
                </div>
              )}
              {modal.item?.event_photos_filename && (
                <div className="mt-3">
                  <span className="font-semibold">Event Photos:</span>
                  {modal.item?.event_photos_mime &&
                  modal.item?.event_photos_mime.startsWith("image/") ? (
                    <div className="mt-2">
                      <img
                        alt={modal.item?.event_photos_name || "event photos"}
                        src={getFileUrl(modal.item?.event_photos_filename)}
                        className="max-h-80 rounded"
                      />
                    </div>
                  ) : (
                    <a
                      href={getFileUrl(modal.item?.event_photos_filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 ml-2"
                    >
                      Download photos
                    </a>
                  )}
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
