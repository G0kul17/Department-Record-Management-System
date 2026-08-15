import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import Toast from "../../components/Toast";
import { FaStar, FaArrowLeft, FaPaperPlane } from "react-icons/fa";

export default function TopAchieversAnnouncement() {
  const nav = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [brochure, setBrochure] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const selectedCount = selectedIds.length;
  const allSelected =
    leaderboard.length > 0 && selectedCount === leaderboard.length;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(
          "/achievements/leaderboard?type=achievements&limit=50"
        );
        if (!mounted) return;
        setLeaderboard(data.leaderboard || []);
      } catch (e) {
        if (mounted) setLeaderboard([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleUser = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leaderboard.map((item) => item.id));
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMessage("");
    setBrochure(null);
    setSelectedIds([]);
  };

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      message.trim().length > 0 &&
      selectedIds.length > 0
    );
  }, [title, message, selectedIds]);

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setToastType("warning");
      setToastMessage("Fill all fields and select at least one user.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append(
        "description",
        description && description.trim() ? description.trim() : ""
      );
      formData.append("message", message.trim());
      formData.append("recipients", JSON.stringify(selectedIds));
      if (brochure) formData.append("brochure", brochure);

      await apiClient.uploadFile("/staff/announcements", formData);
      setToastType("success");
      setToastMessage("Announcement sent to selected users.");
      resetForm();
    } catch (err) {
      setToastType("error");
      setToastMessage("Failed to send announcement. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm flex-shrink-0">
            <FaStar className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Top Achievers Announcements
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Send targeted announcements and invitations to top department achievers.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitAnnouncement}
          className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Announcement Title <span className="text-rose-600">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 shadow-sm"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Summary / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 shadow-sm"
                placeholder="Short summary for recipients"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Brochure (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setBrochure(e.target.files?.[0] || null)}
                className="w-full text-xs font-semibold text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Recipients ({selectedCount} Selected) <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-xs font-bold text-slate-500 p-2">Loading achievers...</div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-xs font-bold text-slate-500 p-2">No top achievers found.</div>
                ) : (
                  leaderboard.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl bg-white p-3 border border-slate-200/80 hover:border-rose-300 transition cursor-pointer shadow-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {user.name || "Unknown"}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 truncate">
                          {user.email}
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-black text-rose-700">
                        {user.achievement_count} Achievements
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Announcement Message <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 shadow-sm"
                placeholder="Write full announcement content..."
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <FaPaperPlane className="w-3.5 h-3.5" />
                {submitting ? "Sending..." : "Send Announcement"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />
    </div>
  );
}
