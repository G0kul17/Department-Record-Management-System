import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";

export default function AdminRoleUsersList({ role }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get("/admin/users");
      const all = data.users || [];
      setUsers(all.filter((u) => u.role === role));
    } catch (e) {
      setError(e.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const filtered = users.filter((u) => {
    if (query) {
      const q = query.toLowerCase();
      if (
        !u.email.toLowerCase().includes(q) &&
        !(u.full_name || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 capitalize">
              {role} List
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Showing all registered {role}s.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            {role === "student" && (
              <a
                href="/register-student"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Register Student
              </a>
            )}
            {role === "staff" && (
              <a
                href="/register-staff"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Register Staff
              </a>
            )}
            <button
              onClick={() => navigate("/admin/users")}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
            >
              All Users
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Search
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Email or name"
              className="mt-1 rounded border px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-md px-3 py-2 text-sm border bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              Reset
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Verified</th>
                <th className="px-3 py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-3 py-2 whitespace-nowrap">{u.email}</td>
                  <td className="px-3 py-2">{u.full_name || "—"}</td>
                  <td className="px-3 py-2">{u.is_verified ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-xs opacity-70">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : ""}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No {role}s match current filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Note: Role-specific list view. For editing or deleting users, go to
          All Users.
        </div>
      </div>
    </div>
  );
}
