import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  FaBolt,
  FaArrowLeft,
  FaSearch,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaFileExport,
  FaEllipsisH,
  FaThLarge,
  FaUserGraduate,
  FaUserTie,
  FaFlask,
  FaBuilding,
  FaTrophy,
  FaFolder,
  FaUserPlus,
  FaExchangeAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaStar,
  FaInfoCircle,
  FaEnvelope,
  FaChevronRight,
  FaFolderOpen,
  FaDownload,
} from "react-icons/fa";

export default function QuickActions({ embedded = false }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'students' | 'faculty' | 'research' | 'department'
  const [activeStaffMode, setActiveStaffMode] = useState("all"); // 'all' | 'upload' | 'verify' | 'export'
  const [searchQuery, setSearchQuery] = useState("");

  const goTo = (key) => () => {
    if (key === "achievements") return nav("/achievements");
    if (key === "projects") return nav("/projects/upload");
    if (key === "hackathons") return nav("/hackathons");
    if (key === "events") return nav("/events");

    // Staff / Admin standalone actions
    if (key === "verifyAchievements")
      return nav(isAdmin ? "/admin/verify-achievements" : "/verify-achievements");
    if (key === "verifyProjects")
      return nav(isAdmin ? "/admin/verify-projects" : "/verify-projects");
    if (key === "verifyHackathonProgress")
      return nav("/verify-hackathon-progress");
    if (key === "staffEvents")
      return nav(isAdmin ? "/admin/upload-events" : "/upload-events");
    if (key === "facultyParticipation")
      return nav(isAdmin ? "/admin/faculty-participation" : "/faculty-participation");
    if (key === "facultyResearch")
      return nav(isAdmin ? "/admin/faculty-research" : "/faculty-research");
    if (key === "facultyConsultancy")
      return nav(isAdmin ? "/admin/faculty-consultancy" : "/faculty-consultancy");
    if (key === "uploadExtra")
      return nav(isAdmin ? "/admin/upload-extra-curricular" : "/upload-extra-curricular");
    if (key === "studentsBatch")
      return nav(isAdmin ? "/admin/upload-students-batch" : "/upload-students-batch");
    if (key === "staffBatch") return nav("/admin/upload-staff-batch");
    if (key === "topAchieversAnnouncement")
      return nav("/top-achievers-announcement");
    if (key === "exportRecords")
      return nav(isAdmin ? "/admin/reports" : "/staff/reports");
    if (key === "bulkExport")
      return nav(isAdmin ? "/admin/bulk-export" : "/staff/bulk-export");
    return nav("/");
  };

  // Actions available for students
  const studentOnlyActions = [
    {
      key: "achievements",
      title: "Add Achievement",
      desc: "Showcase accomplishments and milestones",
      icon: FaTrophy,
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
    {
      key: "projects",
      title: "Upload Project",
      desc: "Share your latest projects with the department",
      icon: FaFolder,
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
    {
      key: "hackathons",
      title: "Hackathon Entry & Progress",
      desc: "Upload participation and track progress",
      icon: FaBolt,
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
    {
      key: "events",
      title: "View Events",
      desc: "Stay updated on upcoming department events",
      icon: FaCalendarAlt,
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
  ];

  // Actions requiring staff or admin
  const staffStudentActions = [
    ...studentOnlyActions,
    {
      key: "studentsBatch",
      title: "Add Students Batch",
      desc: "Upload CSV/Excel to add students in bulk",
      icon: FaUserPlus,
      mode: "upload",
      category: "students",
      staffOnly: true,
    },
  ];

  // Faculty Actions List (Section 2) - Staff / Admin only
  const facultyActions = [
    {
      key: "facultyParticipation",
      title: "Faculty Participation",
      desc: "Add faculty training/participation details",
      icon: FaExchangeAlt,
      mode: "upload",
      category: "faculty",
      staffOnly: true,
    },
    {
      key: "facultyResearch",
      title: "Faculty Research",
      desc: "Add research funding and projects",
      icon: FaFlask,
      mode: "upload",
      category: "research",
      staffOnly: true,
    },
    {
      key: "facultyConsultancy",
      title: "Faculty Consultancy",
      desc: "Add consultancy engagements and proof",
      icon: FaBriefcase,
      mode: "upload",
      category: "faculty",
      staffOnly: true,
    },
  ];

  // Department Actions List (Section 3) - Staff / Admin only
  const departmentActions = [
    {
      key: "staffEvents",
      title: "Upload Events",
      desc: "Create and manage department events",
      icon: FaCalendarAlt,
      mode: "upload",
      category: "department",
      staffOnly: true,
    },
    {
      key: "uploadExtra",
      title: "Other Data Upload",
      desc: "Upload CSV/Excel of activities and save",
      icon: FaCloudUploadAlt,
      mode: "upload",
      category: "department",
      staffOnly: true,
    },
    {
      key: "topAchieversAnnouncement",
      title: "Top Achievers",
      desc: "Send announcements to selected achievers",
      icon: FaStar,
      mode: "upload",
      category: "department",
      staffOnly: true,
    },
  ];

  const verifyActions = [
    {
      key: "verifyAchievements",
      title: "Verify Achievement",
      desc: "Review and verify student achievements",
      icon: FaCheckCircle,
      mode: "verify",
      category: "students",
      staffOnly: true,
    },
    {
      key: "verifyProjects",
      title: "Verify Project",
      desc: "Approve or reject submitted projects",
      icon: FaFolderOpen,
      mode: "verify",
      category: "students",
      staffOnly: true,
    },
    {
      key: "verifyHackathonProgress",
      title: "Verify Hackathon Progress",
      desc: "Review mapped hackathons and update progress & prize",
      icon: FaBolt,
      mode: "verify",
      category: "students",
      staffOnly: true,
    },
  ];

  const exportActions = [
    {
      key: "exportRecords",
      title: "Export Records",
      desc: "Generate Excel/CSV reports for projects and achievements",
      icon: FaFileExport,
      mode: "export",
      category: "department",
      staffOnly: true,
    },
    {
      key: "bulkExport",
      title: "Bulk Export Data",
      desc: "Download complete database backup in Excel format",
      icon: FaDownload,
      mode: "export",
      category: "department",
      staffOnly: true,
    },
  ];

  // Helper search filter
  const filterBySearch = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    );
  };

  const studentActionsList = isStudent ? studentOnlyActions : staffStudentActions;

  const visibleStudentActions = filterBySearch(
    studentActionsList.filter(
      (a) =>
        (activeStaffMode === "all" || a.mode === activeStaffMode) &&
        (activeTab === "all" || activeTab === a.category)
    )
  );

  const visibleFacultyActions = isStudent
    ? []
    : filterBySearch(
        facultyActions.filter(
          (a) =>
            (activeStaffMode === "all" || a.mode === activeStaffMode) &&
            (activeTab === "all" || activeTab === a.category)
        )
      );

  const visibleDeptActions = isStudent
    ? []
    : filterBySearch(
        departmentActions.filter(
          (a) =>
            (activeStaffMode === "all" || a.mode === activeStaffMode) &&
            (activeTab === "all" || activeTab === a.category)
        )
      );

  const visibleVerifyActions = isStudent
    ? []
    : filterBySearch(
        verifyActions.filter(
          (a) =>
            (activeStaffMode === "all" || a.mode === activeStaffMode) &&
            (activeTab === "all" || activeTab === a.category)
        )
      );

  const visibleExportActions = isStudent
    ? []
    : filterBySearch(
        exportActions.filter(
          (a) =>
            (activeStaffMode === "all" || a.mode === activeStaffMode) &&
            (activeTab === "all" || activeTab === a.category)
        )
      );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* Top Navigation Row */}
        {!embedded && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => nav("/")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
              <FaBolt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Quick Actions
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Access and manage department data quickly.
              </p>
            </div>
          </div>

          {/* Search & Top Action Mode Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Mode Controls Bar - Staff/Admin only */}
            {!isStudent && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <button
                  onClick={() => setActiveStaffMode("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeStaffMode === "upload"
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FaCloudUploadAlt className="w-3.5 h-3.5" />
                  Upload
                </button>

                <button
                  onClick={() => setActiveStaffMode("verify")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeStaffMode === "verify"
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FaCheckCircle className="w-3.5 h-3.5" />
                  Verify
                </button>

                <button
                  onClick={() => setActiveStaffMode("export")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeStaffMode === "export"
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FaFileExport className="w-3.5 h-3.5" />
                  Export
                </button>

                <button
                  onClick={() => setActiveStaffMode("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeStaffMode === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FaEllipsisH className="w-3.5 h-3.5 text-slate-400" />
                  More
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Nav Category Filter Tabs (Staff/Admin only) */}
        {!isStudent && (
          <div className="inline-flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FaThLarge className="w-3.5 h-3.5" />
              All Actions
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "students"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FaUserGraduate className="w-3.5 h-3.5" />
              Students
            </button>

            <button
              onClick={() => setActiveTab("faculty")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "faculty"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FaUserTie className="w-3.5 h-3.5" />
              Faculty
            </button>

            <button
              onClick={() => setActiveTab("research")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "research"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FaFlask className="w-3.5 h-3.5" />
              Research
            </button>

            <button
              onClick={() => setActiveTab("department")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "department"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FaBuilding className="w-3.5 h-3.5" />
              Department
            </button>
          </div>
        )}

        {/* Categorized Action Sections */}
        <div className="space-y-6">
          {/* Section 1: Student Activities */}
          {visibleStudentActions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <FaUserGraduate className="w-4 h-4 text-blue-600" />
                  Student Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visibleStudentActions.map((act) => (
                  <ActionTileCard
                    key={act.key}
                    title={act.title}
                    desc={act.desc}
                    icon={act.icon}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Faculty & Research (Staff/Admin only) */}
          {!isStudent && visibleFacultyActions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <FaUserTie className="w-4 h-4 text-blue-600" />
                  Faculty & Research
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visibleFacultyActions.map((act) => (
                  <ActionTileCard
                    key={act.key}
                    title={act.title}
                    desc={act.desc}
                    icon={act.icon}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Department Management (Staff/Admin only) */}
          {!isStudent && visibleDeptActions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <FaBuilding className="w-4 h-4 text-blue-600" />
                  Department Management
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visibleDeptActions.map((act) => (
                  <ActionTileCard
                    key={act.key}
                    title={act.title}
                    desc={act.desc}
                    icon={act.icon}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Verification Actions (Staff/Admin only) */}
          {!isStudent && (activeStaffMode === "verify" || activeStaffMode === "all") && visibleVerifyActions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <FaCheckCircle className="w-4 h-4 text-blue-600" />
                  Verification & Approvals
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visibleVerifyActions.map((act) => (
                  <ActionTileCard
                    key={act.key}
                    title={act.title}
                    desc={act.desc}
                    icon={act.icon}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Export Actions (Staff/Admin only) */}
          {!isStudent && (activeStaffMode === "export" || activeStaffMode === "all") && visibleExportActions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <FaFileExport className="w-4 h-4 text-blue-600" />
                  Reports & Exports
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {visibleExportActions.map((act) => (
                  <ActionTileCard
                    key={act.key}
                    title={act.title}
                    desc={act.desc}
                    icon={act.icon}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Professional Tile Card Component
function ActionTileCard({ title, desc, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 text-left shadow-xs hover:shadow-lg hover:shadow-blue-600/10 hover:border-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer w-full"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-md group-hover:shadow-blue-600/25 transition-all duration-200"
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <FaChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
    </button>
  );
}
