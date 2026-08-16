import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import CustomSelect from "../../components/ui/CustomSelect";
import RecordLoader from "../../components/ui/RecordLoader";
import { FaUserCog, FaArrowLeft, FaSync, FaUserPlus, FaTrashAlt, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function AdminUsersManagement() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Auto-reset page when query or role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, roleFilter]);

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
      await apiClient.patch(`/admin/users/${id}`, { role });
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

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedUsers = filtered.slice(startIndex, endIndex);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/admin/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Admin Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-xs flex-shrink-0">
              <FaUserCog className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Manage Users
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                View, modify system roles, or remove registered student and staff accounts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              <FaSync className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => nav("/register-student")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-rose-500/20 transition cursor-pointer"
            >
              <FaUserPlus className="w-3 h-3" />
              Register Student
            </button>
            <button
              onClick={() => nav("/register-staff")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <FaUserPlus className="w-3 h-3" />
              Register Staff
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 shadow-xs">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 w-full">
          {/* Search & Role Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 shadow-xs"
                />
              </div>

              <CustomSelect
                className="min-w-[130px]"
                value={roleFilter}
                onChange={(value) => setRoleFilter(value)}
                options={["student", "staff", "admin"]}
                placeholder="All Roles"
                buttonClassName="rounded-xl px-3 py-2 text-xs font-semibold border-slate-300"
                menuClassName="min-w-[130px]"
              />

              {(query || roleFilter) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setRoleFilter("");
                  }}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <span className="text-xs font-extrabold text-slate-500">
              Showing {filtered.length} Users
            </span>
          </div>

          {/* Desktop Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">User Email</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <RecordLoader text="Fetching registered user directory..." fullScreen={false} />
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                      No registered users match your search query.
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{u.email}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{u.full_name || "—"}</td>
                    <td className="px-4 py-3">
                      <CustomSelect
                        className="min-w-[120px]"
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(value) => updateRole(u.id, value)}
                        options={["student", "staff", "admin"]}
                        buttonClassName="rounded-lg px-2.5 py-1 text-xs font-extrabold border-slate-300"
                        menuClassName="min-w-[120px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          u.is_verified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {u.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeUser(u.id)}
                        disabled={busyId === u.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <FaTrashAlt className="w-2.5 h-2.5" />
                        {busyId === u.id ? "Working..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Entries Counter */}
              <div className="text-xs text-slate-500 font-bold">
                Showing{" "}
                <span className="text-slate-900 font-extrabold">
                  {filtered.length > 0 ? startIndex + 1 : 0}
                </span>{" "}
                to <span className="text-slate-900 font-extrabold">{endIndex}</span> of{" "}
                <span className="text-slate-900 font-extrabold">
                  {filtered.length}
                </span>{" "}
                users
              </div>

              {/* Right: Controls & Page Numbers */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition cursor-pointer shadow-xs"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                {/* Prev / Next Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Previous Page"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                    )
                    .map((p, idx, arr) => {
                      const prevP = arr[idx - 1];
                      const showEllipsis = prevP && p - prevP > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-slate-400 font-bold text-xs">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 w-8 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                              currentPage === p
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Next Page"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
