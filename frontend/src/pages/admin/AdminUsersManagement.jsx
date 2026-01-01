import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import BackButton from "../../components/BackButton";

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get("/admin/users");
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id, role) => {
    setBusyId(id);
    try {
      await apiClient.request(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (e) {
      setError(e.message || "Failed to update role");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    setBusyId(id);
    try {
      await apiClient.delete(`/admin/users/${id}`);
      await load();
    } catch (e) {
      setError(e.message || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
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
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Manage Users
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              View, change roles, or remove accounts.
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
            <a
              href="/register-student"
              className="rounded-md bg-[#87CEEB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7dc0df]"
            >
              Register Student
            </a>
            <a
              href="/register-staff"
              className="rounded-md bg-[#87CEEB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7dc0df]"
            >
              Register Staff
            </a>
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
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-1 rounded border px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              <option value="">All</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {query || roleFilter ? (
            <button
              onClick={() => {
                setQuery("");
                setRoleFilter("");
              }}
              className="rounded-md px-3 py-2 text-sm border bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              Reset Filters
            </button>
          ) : null}
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
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Verified</th>
                <th className="px-3 py-2 font-semibold">Created</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
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
                  <td className="px-3 py-2">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="rounded border px-2 py-1 text-xs bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    >
                      <option value="student">student</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{u.is_verified ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-xs opacity-70">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeUser(u.id)}
                      disabled={busyId === u.id}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {busyId === u.id ? "Working..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No users match current filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
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
          Note: To add new users, use the Register Student / Register Staff
          buttons above. Admin emails are auto-recognized from environment
          configuration.
        </div>
      </div>
    </div>
  );
}
