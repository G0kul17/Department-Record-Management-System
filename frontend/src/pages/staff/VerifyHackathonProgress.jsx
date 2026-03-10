import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/axiosClient";
import DataTableContainer from "../../components/ui/DataTableContainer";
import DataRow from "../../components/ui/DataRow";
import StatusBadge from "../../components/ui/StatusBadge";
import { getFileUrl } from "../../utils/fileUrl";

const progressOptions = [
  "Registered",
  "Round 1 Qualified",
  "Round 2 Qualified",
  "Round 3 Qualified",
  "Finalist",
  "Winner",
  "Runner-up",
  "Shortlisted",
  "Completed",
  "Not shortlisted",
];

function toDateInputValue(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function isExpired(dateValue) {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(dateValue);
  endDate.setHours(0, 0, 0, 0);
  return endDate < today;
}

export default function VerifyHackathonProgress() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [view, setView] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState({ open: false, item: null });
  const [warningsInfo, setWarningsInfo] = useState("");
  const [form, setForm] = useState({
    duration_end_date: "",
    no_of_rounds: "",
    progress: "Registered",
    prize: "",
    verification_comment: "",
  });

  const load = async (status = view) => {
    setLoading(true);
    try {
      const data = await apiClient.get(
        `/hackathons/coordinator/queue?status=${encodeURIComponent(status)}&limit=100`,
      );
      const list = data?.hackathons || [];
      setItems(list);
      if ((data?.warningsSent || 0) > 0) {
        setWarningsInfo(
          `${data.warningsSent} expired hackathon warning notification(s) were sent to students.`,
        );
      } else {
        setWarningsInfo("");
      }
    } catch (e) {
      setItems([]);
      setWarningsInfo("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (item) => {
    setForm({
      duration_end_date: toDateInputValue(item.duration_end_date),
      no_of_rounds: item.no_of_rounds || "",
      progress: item.progress || "Registered",
      prize: item.prize || "",
      verification_comment: item.verification_comment || "",
    });
    setModal({ open: true, item });
  };

  const closeModal = () => {
    setModal({ open: false, item: null });
  };

  const saveProgress = async () => {
    if (!modal.item?.id) return;
    try {
      setBusyId(modal.item.id);
      await apiClient.patch(`/hackathons/${modal.item.id}/progress`, {
        duration_end_date: form.duration_end_date || null,
        no_of_rounds: form.no_of_rounds ? Number(form.no_of_rounds) : null,
        progress: form.progress,
        prize: form.prize,
        verification_comment: form.verification_comment,
      });
      await load(view);
      closeModal();
    } catch (e) {
      // no-op
    } finally {
      setBusyId(null);
    }
  };

  const approve = async () => {
    if (!modal.item?.id) return;
    try {
      setBusyId(modal.item.id);
      const payload =
        form.verification_comment && form.verification_comment.trim()
          ? { comment: form.verification_comment.trim() }
          : {};
      await apiClient.post(`/hackathons/${modal.item.id}/verify`, payload);
      await load(view);
      closeModal();
    } catch (e) {
      // no-op
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!modal.item?.id) return;
    try {
      setBusyId(modal.item.id);
      await apiClient.post(`/hackathons/${modal.item.id}/reject`, {
        comment: (form.verification_comment || "").trim(),
      });
      await load(view);
      closeModal();
    } catch (e) {
      // no-op
    } finally {
      setBusyId(null);
    }
  };

  const viewLabel = useMemo(() => {
    if (view === "pending") return "Pending";
    if (view === "approved") return "Approved";
    if (view === "rejected") return "Rejected";
    return "All";
  }, [view]);

  return (
    <DataTableContainer
      title="Verify Hackathon Progress"
      subtitle="Review mapped hackathon entries, send deadline-based reminders, and update rounds/progress/prize."
      filters={
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "all", label: "All" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={async () => {
                setView(f.key);
                await load(f.key);
              }}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                view === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
      actions={
        <button
          onClick={() => load(view)}
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      {warningsInfo && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {warningsInfo}
        </div>
      )}

      <div className="space-y-3">
        {!loading && items.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
            No hackathon entries found for {viewLabel.toLowerCase()} view.
          </div>
        )}

        {items.map((item) => (
          <DataRow
            key={item.id}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
            header={
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.hackathon_name}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.student_name} • {item.user_email || "Unknown user"}
                </div>
              </div>
            }
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                {item.verification_status === "approved" ? (
                  <StatusBadge status="approved" label="Verified" />
                ) : item.verification_status === "rejected" ? (
                  <StatusBadge status="rejected" />
                ) : (
                  <StatusBadge status="pending" />
                )}
                <button
                  onClick={() => openModal(item)}
                  className="rounded-md bg-slate-200 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 whitespace-nowrap"
                >
                  Preview / Edit
                </button>
              </div>
            }
            details={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">Team Leader:</span> {item.team_leader_name}
                </div>
                <div>
                  <span className="font-semibold">Hosted By:</span> {item.hosted_by}
                </div>
                <div>
                  <span className="font-semibold">Location:</span> {item.location}
                </div>
                <div>
                  <span className="font-semibold">Duration:</span>{" "}
                  {toDateInputValue(item.duration_start_date)}
                  {item.duration_end_date ? ` to ${toDateInputValue(item.duration_end_date)}` : ""}
                </div>
                <div>
                  <span className="font-semibold">Rounds:</span> {item.no_of_rounds || "-"}
                </div>
                <div>
                  <span className="font-semibold">Progress:</span> {item.progress}
                </div>
                <div>
                  <span className="font-semibold">Prize:</span> {item.prize || "-"}
                </div>
                <div>
                  <span className="font-semibold">Deadline Status:</span>{" "}
                  {isExpired(item.duration_end_date) ? (
                    <span className="text-red-600 font-semibold">Expired</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Active</span>
                  )}
                </div>
              </div>
            }
          />
        ))}
      </div>

      {modal.open && modal.item && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-white p-4 sm:p-6 shadow-xl dark:bg-slate-900 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                {modal.item.hackathon_name}
              </h3>
              <button
                className="rounded-md bg-slate-200 px-3 py-1.5 text-xs sm:text-sm font-medium dark:bg-slate-800"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
              <div>
                <span className="font-semibold">Student:</span> {modal.item.student_name}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {modal.item.user_email || "-"}
              </div>
              <div>
                <span className="font-semibold">Team Members:</span> {modal.item.team_member_names}
              </div>
              <div>
                <span className="font-semibold">Mobile:</span> {modal.item.mobile_number}
              </div>
              {modal.item.proof_filename && (
                <div className="sm:col-span-2">
                  <span className="font-semibold">Proof:</span>{" "}
                  <a
                    href={getFileUrl(modal.item.proof_filename)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {modal.item.proof_name || "Open document"}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Duration End Date
                </label>
                <input
                  type="date"
                  value={form.duration_end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration_end_date: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  No. of Rounds
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.no_of_rounds}
                  onChange={(e) => setForm((prev) => ({ ...prev, no_of_rounds: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Progress
                </label>
                <select
                  value={form.progress}
                  onChange={(e) => setForm((prev) => ({ ...prev, progress: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {progressOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Prize
                </label>
                <input
                  type="text"
                  value={form.prize}
                  onChange={(e) => setForm((prev) => ({ ...prev, prize: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="e.g. Winner / Runner-up / Cash Prize"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Coordinator Comment
                </label>
                <textarea
                  value={form.verification_comment}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, verification_comment: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Optional feedback for student"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={saveProgress}
                disabled={busyId === modal.item.id}
                className="rounded-md bg-slate-700 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {busyId === modal.item.id ? "Saving..." : "Save Progress"}
              </button>
              <button
                onClick={reject}
                disabled={busyId === modal.item.id || !(form.verification_comment || "").trim()}
                className="rounded-md bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {busyId === modal.item.id ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={approve}
                disabled={busyId === modal.item.id}
                className="rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {busyId === modal.item.id ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DataTableContainer>
  );
}
