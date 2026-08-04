import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import BackButton from "../../components/BackButton";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { loadAchievementTypes } from "../../utils/achievementTypes";

export default function AdminCustomAchievements() {
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
      const achievementTypes = await loadAchievementTypes();
      setTypes(achievementTypes);
    } catch (err) {
      setTypes([]);
      setError(err?.message || "Failed to load achievement types");
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
      setError("Please enter an achievement name");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiClient.post("/activity-coordinators/achievement-types", {
        name: trimmed,
      });
      setName("");
      setMessage(`Added ${trimmed} to achievement options.`);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add achievement type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!type || busyName) return;
    if (!window.confirm(`Delete achievement type "${type}"?`)) return;

    setBusyName(type);
    setError("");
    setMessage("");
    try {
      await apiClient.delete(
        `/activity-coordinators/achievement-types/${encodeURIComponent(type)}`,
      );
      setMessage(`Deleted ${type}.`);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to delete achievement type");
    } finally {
      setBusyName("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <BackButton />
        <PageHeader
          title="Add Custom Achievements"
          subtitle="Create new achievement titles that appear in the student form and coordinator mapping."
        />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              New Achievement Title
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Add a new title once, and it will be available in the achievement
              add form and activity coordinator mapping.
            </p>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
                {message}
              </div>
            )}

            <form
              onSubmit={handleAdd}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Best Poster Presentation"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Saving..." : "Add Achievement"}
              </button>
            </form>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Available Titles
              </h2>
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="btn btn-primary btn-sm w-full sm:w-auto disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {types.map((type) => (
                <div
                  key={type}
                  className="flex w-full items-center justify-between gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto sm:py-1"
                >
                  <span className="min-w-0 flex-1 break-words">{type}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(type)}
                    disabled={busyName === type}
                    className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {busyName === type ? "..." : "Delete"}
                  </button>
                </div>
              ))}
              {!types.length && !loading && (
                <span className="text-sm text-slate-500">
                  No titles available.
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
