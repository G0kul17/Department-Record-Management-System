import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/axiosClient";
import PageHeader from "../../components/ui/PageHeader";
import Toast from "../../components/Toast";

export default function TopAchieversAnnouncement() {
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
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="mx-auto max-w-5xl w-full px-6 py-10">
        <PageHeader
          title="Top Achievers Announcement"
          subtitle="Send a targeted announcement to selected top achievers."
        />

        <form
          onSubmit={submitAnnouncement}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                placeholder="Short summary for recipients"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Brochure (optional)
              </label>
              <input
                type="file"
                onChange={(e) => setBrochure(e.target.files?.[0] || null)}
                className="mt-2 w-full text-sm text-slate-700"
              />
              {brochure && (
                <div className="mt-2 text-xs text-slate-600">
                  Selected: {brochure.name}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Users selection (Top Achievers)
                </label>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="text-sm text-slate-600">Loading users...</div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No top achievers found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 rounded-md bg-white px-3 py-2 border border-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {user.name || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {user.email}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-blue-600">
                          {user.achievement_count}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Selected: {selectedCount}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Announcement message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                placeholder="Write the announcement message"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="btn btn-primary btn-sm"
              >
                {submitting ? "Sending..." : "Submit"}
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
