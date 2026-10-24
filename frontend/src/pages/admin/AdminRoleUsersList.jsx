import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";
import {
  FaSearch,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUserGraduate,
  FaUserTie,
  FaChevronDown,
} from "react-icons/fa";

export default function AdminRoleUsersList({ role }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search, Department & Pagination state
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(
    async (
      currentPage = page,
      currentLimit = limit,
      currentSearch = appliedSearch,
      currentDept = departmentFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          role,
          page: String(currentPage),
          limit: String(currentLimit),
        });
        if (currentSearch && currentSearch.trim()) {
          params.append("search", currentSearch.trim());
        }
        if (currentDept && currentDept.trim()) {
          params.append("department", currentDept.trim());
        }

        const data = await apiClient.get(`/admin/users?${params.toString()}`);
        setUsers(data.users || []);
        const totalCount = Number(data.total ?? (data.users || []).length);
        setTotal(totalCount);
        setTotalPages(data.totalPages || Math.ceil(totalCount / currentLimit) || 1);
      } catch (e) {
        setError(e.message || "Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [role, page, limit, appliedSearch, departmentFilter]
  );

  // Reload when page, limit, search, or department changes
  useEffect(() => {
    load(page, limit, appliedSearch, departmentFilter);
  }, [page, limit, appliedSearch, departmentFilter, role]);

  // Debounced search handling
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const handleResetSearch = () => {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  };

  // Generate pagination page numbers
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <BackButton />

        {/* Top Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {role === "student" ? (
                  <FaUserGraduate className="h-6 w-6" />
                ) : (
                  <FaUserTie className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 capitalize">
                    {role} List
                  </h1>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {total} {role}{total !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  Showing all registered {role}s added in the database.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => load(page, limit, appliedSearch, departmentFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                title="Refresh list"
              >
                <FaSync className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
              {role === "student" && (
                <a
                  href="/register-student"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  Register Student
                </a>
              )}
              {role === "staff" && (
                <a
                  href="/register-staff"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  Register Staff
                </a>
              )}

              {/* Department Filter in that All Users Box */}
              <div className="relative inline-flex items-center">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    if (e.target.value === "__NAV_ALL__") {
                      navigate("/admin/users");
                      return;
                    }
                    setDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none rounded-lg border border-slate-300 bg-slate-100 pl-3.5 pr-8 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition shadow-xs"
                  title="Filter students by department or view all users"
                >
                  <option value="">All Users</option>
                  <option value="ADS">ADS</option>
                  <option value="IT">IT</option>
                  <option value="__NAV_ALL__">All Users Directory ↗</option>
                </select>
                <FaChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 dark:text-slate-400" />
              </div>
            </div>
          </div>

          {/* Search Bar & Page Size Filter */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search by name, email, or ${role === "student" ? "register number" : "department"}...`}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              {search && (
                <button
                  onClick={handleResetSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={handleLimitChange}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>

              <span className="text-xs text-slate-500 dark:text-slate-400">
                {total > 0 ? `${startRecord}–${endRecord} of ${total}` : "0 results"}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Name
                  </th>
                  {role === "student" && (
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                      Register No
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Department
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Verified
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 break-all">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {u.full_name || "—"}
                    </td>
                    {role === "student" && (
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {u.register_number || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {u.department && u.department !== "—" ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                            String(u.department).toUpperCase() === "ADS"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : String(u.department).toUpperCase() === "IT"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {u.department}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.is_verified
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {u.is_verified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={role === "student" ? 6 : 5}
                      className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      {appliedSearch || departmentFilter
                        ? `No ${role}s matched your ${
                            departmentFilter ? `department (${departmentFilter})` : ""
                          }${
                            appliedSearch && departmentFilter ? " and " : ""
                          }${
                            appliedSearch ? `search "${appliedSearch}"` : ""
                          } criteria.`
                        : `No ${role}s found in the database.`}
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={role === "student" ? 6 : 5}
                      className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FaSync className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Loading {role}s...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Showing <span className="font-semibold">{startRecord}</span> to{" "}
                <span className="font-semibold">{endRecord}</span> of{" "}
                <span className="font-semibold">{total}</span> {role}s
              </div>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1 || loading}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  title="First Page"
                >
                  <FaAngleDoubleLeft className="h-3.5 w-3.5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  title="Previous Page"
                >
                  <FaChevronLeft className="h-3.5 w-3.5" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((num, idx) =>
                    num === "..." ? (
                      <span
                        key={`dots-${idx}`}
                        className="px-2 py-1 text-xs text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={`page-${num}`}
                        onClick={() => handlePageChange(num)}
                        disabled={loading}
                        className={`min-w-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          page === num
                            ? "bg-blue-600 text-white shadow-xs"
                            : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {num}
                      </button>
                    )
                  )}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loading}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  title="Next Page"
                >
                  <FaChevronRight className="h-3.5 w-3.5" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages || loading}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  title="Last Page"
                >
                  <FaAngleDoubleRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Note: Role-specific list view with database pagination. For editing roles or deleting users, go to All Users.
        </div>
      </div>
    </div>
  );
}

