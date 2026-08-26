import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { loadFacultyEventTypes } from "../../utils/facultyEventTypes";
import { FaAward, FaArrowLeft, FaPlus, FaTrashAlt, FaSync } from "react-icons/fa";

export default function AdminFacultyEventsManagement() {
  const nav = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyName, setBusyName] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const eventTypes = await loadFacultyEventTypes();
      setTypes(eventTypes);
    } catch (err) {
      setTypes([]);
      setError(err?.message || "Failed to load faculty event types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter an event type name");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiClient.post("/faculty-participations/event-types", {
        name: trimmed,
      });
      setName("");
      setMessage(`Added "${trimmed}" to faculty participation event options.`);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add faculty event type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!type || busyName) return;
    if (!window.confirm(`Delete faculty event type "${type}"?`)) return;

    setBusyName(type);
    setError("");
    setMessage("");
    try {
      await apiClient.delete(
        `/faculty-participations/event-types/${encodeURIComponent(type)}`
      );
      setMessage(`Deleted "${type}".`);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to delete faculty event type");
    } finally {
      setBusyName("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/admin/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            Back to Admin Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-xs flex-shrink-0">
            <FaAward className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Add Faculty Participation Events
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Create and manage event types for faculty participation and development programs.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800/40 p-3.5 text-xs font-bold text-rose-800 dark:text-rose-300 shadow-xs">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
          {/* Left Form Card */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FaPlus className="text-blue-500 w-3.5 h-3.5" />
              New Event Type
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Add custom event types to make them immediately available in staff participation forms.
            </p>

            <form onSubmit={handleAdd} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Event Type Name <span className="text-blue-600">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Faculty Internship / Special Honor"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-xs"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <FaPlus className="w-3 h-3" />
                  {saving ? "Saving..." : "Add Event Type"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Available Titles List Card */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Available Event Types ({types.length})
              </h2>
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
              >
                <FaSync className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 max-h-[380px] overflow-y-auto pr-1">
              {types.map((type) => (
                <div
                  key={type}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
                >
                  <span>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(type)}
                    disabled={busyName === type}
                    title="Delete Event Type"
                    className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer ml-1"
                  >
                    <FaTrashAlt className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {!types.length && !loading && (
                <span className="text-xs font-bold text-slate-400 py-4">
                  No event types loaded.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
