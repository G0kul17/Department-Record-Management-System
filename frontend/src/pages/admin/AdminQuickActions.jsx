import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBolt,
  FaArrowLeft,
  FaSearch,
  FaCloudUploadAlt,
  FaUserTie,
  FaUserGraduate,
  FaCalendarAlt,
  FaFileExport,
  FaDownload,
  FaUserCog,
  FaTasks,
  FaStar,
  FaAward,
  FaChevronRight,
  FaInfoCircle,
  FaShieldAlt,
  FaHistory,
} from "react-icons/fa";

export default function AdminQuickActions() {
  const nav = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const goTo = (key) => () => {
    if (key === "activeLogs") return nav("/admin/active-logs");
    if (key === "achievements") return nav("/achievements");
    if (key === "customAchievements") return nav("/admin/custom-achievements");
    if (key === "projects") return nav("/projects/upload");
    if (key === "verifyAchievements") return nav("/admin/verify-achievements");
    if (key === "verifyProjects") return nav("/admin/verify-projects");
    if (key === "staffEvents") return nav("/admin/upload-events");
    if (key === "facultyParticipation") return nav("/admin/faculty-participation");
    if (key === "facultyResearch") return nav("/admin/faculty-research");
    if (key === "facultyConsultancy") return nav("/admin/faculty-consultancy");
    if (key === "uploadExtra") return nav("/admin/upload-extra-curricular");
    if (key === "studentsBatch") return nav("/admin/upload-students-batch");
    if (key === "staffBatch") return nav("/admin/upload-staff-batch");
    if (key === "exportRecords") return nav("/admin/reports");
    if (key === "bulkExport") return nav("/admin/bulk-export");
    if (key === "manageUsers") return nav("/admin/users");
    if (key === "activityCoordinators") return nav("/admin/activity-coordinators");
    if (key === "customFacultyEvents") return nav("/admin/custom-faculty-events");
    return nav("/");
  };

  const adminActions = [
    {
      key: "activeLogs",
      title: "Active System Logs",
      desc: "Real-time track of uploads, approvals, and user profiles",
      icon: FaHistory,
    },
    {
      key: "studentsBatch",
      title: "Add Students Batch",
      desc: "Upload CSV to add students in bulk",
      icon: FaUserGraduate,
    },
    {
      key: "staffBatch",
      title: "Staff Batch Upload",
      desc: "Upload CSV to create staff accounts in bulk",
      icon: FaUserTie,
    },
    {
      key: "uploadExtra",
      title: "Other Data Upload",
      desc: "Upload CSV/Excel of activities and save",
      icon: FaCloudUploadAlt,
    },
    {
      key: "staffEvents",
      title: "Upload Events",
      desc: "Create and manage department events",
      icon: FaCalendarAlt,
    },
    {
      key: "exportRecords",
      title: "Export Records",
      desc: "Generate Excel/CSV reports for projects and achievements",
      icon: FaFileExport,
    },
    {
      key: "bulkExport",
      title: "Bulk Export Data",
      desc: "Download complete database backup in Excel format",
      icon: FaDownload,
    },
    {
      key: "manageUsers",
      title: "Manage Users",
      desc: "View, change roles, or remove registered users",
      icon: FaUserCog,
    },
    {
      key: "activityCoordinators",
      title: "Activity Coordinators",
      desc: "Map staff to activity types and permissions",
      icon: FaTasks,
    },
    {
      key: "customAchievements",
      title: "Add Custom Achievements",
      desc: "Create new achievement titles for forms and mappings",
      icon: FaStar,
    },
    {
      key: "customFacultyEvents",
      title: "Add Faculty Participation Events",
      desc: "Create and manage custom event types for faculty participation",
      icon: FaAward,
    },
  ];

  const filteredActions = adminActions.filter(
    (act) =>
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>

        {/* Page Title Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
              <FaBolt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Admin Quick Actions
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Manage users, batch uploads, coordinators, and system data.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search admin actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Action Cards Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <FaShieldAlt className="w-4 h-4 text-blue-600" />
            Admin Operations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.key}
                  onClick={goTo(act.key)}
                  className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 text-left shadow-xs hover:shadow-lg hover:shadow-blue-600/10 hover:border-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer w-full"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-md group-hover:shadow-blue-600/25 transition-all duration-200">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {act.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                  <FaChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
