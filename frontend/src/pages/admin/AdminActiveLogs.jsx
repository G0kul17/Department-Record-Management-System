import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import RecordLoader from "../../components/ui/RecordLoader";
import {
  FaHistory,
  FaArrowLeft,
  FaSearch,
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaFilter,
  FaEye,
  FaTimes,
  FaGraduationCap,
  FaUserTie,
  FaShieldAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaBuilding,
  FaIdCard,
  FaCode,
  FaGithub,
  FaLaptopCode,
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function AdminActiveLogs() {
  const nav = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [period, setPeriod] = useState("all"); // 'all' | 'day' | 'week' | 'month' | 'year'
  const [actionType, setActionType] = useState("all"); // 'all' | 'upload' | 'approval'
  const [searchQuery, setSearchQuery] = useState("");

  // Profile Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.get("/admin/active-logs");
      setLogs(data?.logs || []);
    } catch (err) {
      setError("Failed to load active system logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter logs locally based on period, actionType, and searchQuery
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Period filter
      if (period !== "all") {
        const now = new Date();
        const logDate = new Date(log.timestamp);
        if (!isNaN(logDate.getTime())) {
          if (period === "day") {
            if (logDate.toDateString() !== now.toDateString()) return false;
          } else if (period === "week") {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (logDate < oneWeekAgo) return false;
          } else if (period === "month") {
            if (
              logDate.getMonth() !== now.getMonth() ||
              logDate.getFullYear() !== now.getFullYear()
            )
              return false;
          } else if (period === "year") {
            if (logDate.getFullYear() !== now.getFullYear()) return false;
          }
        }
      }

      // Action type filter
      if (actionType !== "all" && log.action_type !== actionType) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (log.user_name || "").toLowerCase().includes(q);
        const matchEmail = (log.user_email || "").toLowerCase().includes(q);
        const matchRole = (log.user_role || "").toLowerCase().includes(q);
        const matchTitle = (log.item_title || "").toLowerCase().includes(q);
        const matchCat = (log.category || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole && !matchTitle && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [logs, period, actionType, searchQuery]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [period, actionType, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, startIndex, pageSize]);

  // Open profile modal and fetch complete user details
  const handleViewProfile = async (userId) => {
    if (!userId) return;
    setProfileLoading(true);
    setProfileError("");
    setSelectedUser(null);

    try {
      const data = await apiClient.get(`/admin/users/${userId}/profile`);
      setSelectedUser(data);
    } catch (err) {
      setProfileError("Could not load user profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "N/A";
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDepartment = (profileDetails, studentProfile) => {
    const pd = profileDetails || {};
    const sp = studentProfile || {};
    const rawDept = (pd.department || sp.department || "").trim();
    const rawCourse = (
      pd.course ||
      sp.course ||
      pd.branch ||
      sp.branch ||
      ""
    ).trim();

    const cleanTitle = (str) => {
      if (!str) return "";
      let s = str.trim();
      const lower = s.toLowerCase();
      if (lower === "b.tech" || lower === "btech") return "B.Tech";
      if (lower === "m.tech" || lower === "mtech") return "M.Tech";
      if (lower === "b.e" || lower === "be") return "B.E";
      if (lower === "m.e" || lower === "me") return "M.E";

      return s
        .split(" ")
        .map((word) => {
          const wLower = word.toLowerCase();
          if (wLower === "and") return "and";
          if (wLower === "of") return "of";
          if (wLower === "in") return "in";
          if (wLower === "it") return "Information Technology";
          if (wLower === "ai" || wLower === "ai&ds" || wLower === "aids")
            return "Artificial Intelligence and Data Science";
          if (wLower === "cse") return "Computer Science and Engineering";
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    };

    const deptStr = cleanTitle(rawDept);
    const courseStr = cleanTitle(rawCourse);

    if (deptStr && courseStr) {
      if (courseStr.toLowerCase().includes(deptStr.toLowerCase())) {
        return courseStr;
      }
      if (deptStr.toLowerCase().includes(courseStr.toLowerCase())) {
        return deptStr;
      }
      return `${deptStr} - ${courseStr}`;
    }

    if (deptStr) {
      if (
        deptStr === "B.Tech" ||
        deptStr === "B.E" ||
        deptStr === "M.Tech" ||
        deptStr === "M.E"
      ) {
        return `${deptStr} - Information Technology`;
      }
      return deptStr;
    }

    if (courseStr) return courseStr;

    return "B.Tech - Information Technology";
  };

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow-xs flex-shrink-0">
              <FaHistory className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Active System Logs & Audit Trail
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time tracking of user uploads, staff approvals, timestamps, and user profiles.
              </p>
            </div>
          </div>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <FaHistory className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Action Type Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: "all", label: "All Logs" },
                { id: "upload", label: "Uploads / Submissions" },
                { id: "approval", label: "Staff Approvals" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActionType(tab.id)}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                    actionType === tab.id
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Time Period Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <FaFilter className="w-3 h-3 text-slate-400" />
                Time:
              </span>
              {[
                { id: "all", label: "All Time" },
                { id: "day", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
                { id: "year", label: "This Year" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-full border transition cursor-pointer ${
                    period === p.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Search Input */}
          <div className="relative w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by user name, email, role, category, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}

        {/* Active Logs Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden w-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Live Audit Logs ({filteredLogs.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredLogs.length} of {logs.length} total activities
            </span>
          </div>

          {loading ? (
            <RecordLoader text="Fetching live system audit logs..." fullScreen={false} />
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FaHistory className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-700">No activity logs found</h3>
              <p className="text-xs text-slate-400 font-medium">
                Try selecting a different time filter or clearing your search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Category & Details</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedLogs.map((log) => {
                    const isUpload = log.action_type === "upload";
                    const isStudent = log.user_role === "student";
                    const isStaff = log.user_role === "staff";

                    return (
                      <tr key={log.log_id} className="hover:bg-slate-50/80 transition">
                        {/* Action Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-xs ${
                              isUpload
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                : "bg-purple-50 text-purple-700 border border-purple-200/80"
                            }`}
                          >
                            {isUpload ? (
                              <FaCloudUploadAlt className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <FaCheckCircle className="w-3 h-3 text-purple-600" />
                            )}
                            {isUpload ? "Upload" : "Approved"}
                          </span>
                        </td>

                        {/* User Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0 ${
                                isStudent
                                  ? "bg-blue-600"
                                  : isStaff
                                  ? "bg-purple-600"
                                  : "bg-indigo-600"
                              }`}
                            >
                              {(log.user_name || "U")[0].toUpperCase()}
                            </span>
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{log.user_name || "Unknown User"}</span>
                                <span
                                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-extrabold uppercase ${
                                    isStudent
                                      ? "bg-blue-100 text-blue-800"
                                      : isStaff
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {log.user_role}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {log.user_email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Item Title */}
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="inline-block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md mb-1">
                            {log.category}
                          </div>
                          <div className="font-bold text-slate-900 truncate">
                            {log.item_title || "Untitled Entry"}
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-bold">
                          <div className="flex items-center gap-1.5 text-xs text-slate-800">
                            <FaCalendarAlt className="w-3 h-3 text-slate-400" />
                            <span>{formatTimestamp(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleViewProfile(log.user_id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-600 hover:text-white transition cursor-pointer shadow-xs"
                          >
                            <FaEye className="w-3 h-3" />
                            <span>View Profile</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Entries Counter */}
                <div className="text-xs text-slate-500 font-bold">
                  Showing{" "}
                  <span className="text-slate-900 font-extrabold">
                    {filteredLogs.length > 0 ? startIndex + 1 : 0}
                  </span>{" "}
                  to <span className="text-slate-900 font-extrabold">{endIndex}</span> of{" "}
                  <span className="text-slate-900 font-extrabold">
                    {filteredLogs.length}
                  </span>{" "}
                  total entries
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
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer shadow-xs"
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
                      className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
                                  ? "bg-indigo-600 text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
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
                      className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Next Page"
                    >
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Inspection Modal */}
      {(profileLoading || selectedUser || profileError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                  <FaUser className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    User Profile Details
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Verified system account profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setProfileError("");
                  setProfileLoading(false);
                }}
                className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {profileLoading ? (
                <div className="p-10 text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Loading user profile...</p>
                </div>
              ) : profileError ? (
                <div className="p-6 text-center text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
                  {profileError}
                </div>
              ) : selectedUser?.user ? (
                <div className="space-y-5">
                  {/* User Profile Card Header */}
                  <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white text-xl font-black shadow-md ${
                        selectedUser.user.role === "student"
                          ? "bg-blue-600"
                          : selectedUser.user.role === "staff"
                          ? "bg-purple-600"
                          : "bg-indigo-600"
                      }`}
                    >
                      {(selectedUser.user.full_name || "U")[0].toUpperCase()}
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">
                        {selectedUser.user.full_name || "No Name Set"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
                            selectedUser.user.role === "student"
                              ? "bg-blue-100 text-blue-800"
                              : selectedUser.user.role === "staff"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {selectedUser.user.role}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          ID: #{selectedUser.user.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Key Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Email */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                        <FaEnvelope className="w-3 h-3 text-blue-500" />
                        Email Address
                      </span>
                      <p className="font-extrabold text-slate-900 truncate">
                        {selectedUser.user.email}
                      </p>
                    </div>

                    {/* Contact Number */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                        <FaPhoneAlt className="w-3 h-3 text-emerald-500" />
                        Contact Phone
                      </span>
                      <p className="font-extrabold text-slate-900">
                        {selectedUser.user.profile_details?.contact_number ||
                          selectedUser.studentProfile?.contact_number ||
                          "Not specified"}
                      </p>
                    </div>

                    {/* Student Register Number or Staff Designation */}
                    {selectedUser.user.role === "student" ? (
                      <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                        <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                          <FaIdCard className="w-3 h-3 text-purple-500" />
                          Register Number
                        </span>
                        <p className="font-extrabold text-slate-900">
                          {selectedUser.studentProfile?.register_number ||
                            selectedUser.user.profile_details?.register_number ||
                            "N/A"}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                        <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                          <FaUserTie className="w-3 h-3 text-amber-500" />
                          Designation
                        </span>
                        <p className="font-extrabold text-slate-900">
                          {selectedUser.user.profile_details?.designation ||
                            selectedUser.user.profile_details?.role_designation ||
                            selectedUser.user.profile_details?.position ||
                            selectedUser.user.profile_details?.title ||
                            "Not specified"}
                        </p>
                      </div>
                    )}

                    {/* Department */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                        <FaBuilding className="w-3 h-3 text-indigo-500" />
                        Department
                      </span>
                      <p className="font-extrabold text-slate-900">
                        {formatDepartment(
                          selectedUser.user.profile_details,
                          selectedUser.studentProfile
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Student Coding Links if Available */}
                  {selectedUser.studentProfile && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                        Coding & Professional Handles
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedUser.studentProfile.github_url && (
                          <a
                            href={selectedUser.studentProfile.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-slate-800 transition"
                          >
                            <FaGithub className="w-3 h-3" />
                            GitHub
                            <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        )}
                        {selectedUser.studentProfile.leetcode_url && (
                          <a
                            href={selectedUser.studentProfile.leetcode_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-amber-600 transition"
                          >
                            <FaCode className="w-3 h-3" />
                            LeetCode
                            <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        )}
                        {selectedUser.studentProfile.hackerrank_url && (
                          <a
                            href={selectedUser.studentProfile.hackerrank_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-700 transition"
                          >
                            <FaLaptopCode className="w-3 h-3" />
                            HackerRank
                            <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        )}
                        {!selectedUser.studentProfile.github_url &&
                          !selectedUser.studentProfile.leetcode_url &&
                          !selectedUser.studentProfile.hackerrank_url && (
                            <p className="text-xs text-slate-400 font-medium italic">
                              No coding profiles linked yet.
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Account Created Date */}
                  <div className="text-center text-[11px] text-slate-400 font-semibold pt-1">
                    Member since {formatTimestamp(selectedUser.user.created_at)}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setProfileError("");
                }}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold px-5 py-2 text-xs transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
