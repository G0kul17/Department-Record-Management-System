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
      iconBg: "bg-blue-600 text-white",
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
    {
      key: "projects",
      title: "Upload Project",
      desc: "Share your latest projects with the department",
      icon: FaFolder,
      iconBg: "bg-blue-600 text-white",
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
    {
      key: "hackathons",
      title: "Hackathon Entry & Progress",
      desc: "Upload participation and track progress",
      icon: FaBolt,
      iconBg: "bg-purple-600 text-white",
      mode: "upload",
      category: "students",
      staffOnly: false,
    },
    {
      key: "events",
      title: "View Events",
      desc: "Stay updated on upcoming department events",
      icon: FaCalendarAlt,
      iconBg: "bg-orange-500 text-white",
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
      iconBg: "bg-emerald-600 text-white",
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
      iconBg: "bg-purple-600 text-white",
      mode: "upload",
      category: "faculty",
      staffOnly: true,
    },
    {
      key: "facultyResearch",
      title: "Faculty Research",
      desc: "Add research funding and projects",
      icon: FaFlask,
      iconBg: "bg-emerald-600 text-white",
      mode: "upload",
      category: "research",
      staffOnly: true,
    },
    {
      key: "facultyConsultancy",
      title: "Faculty Consultancy",
      desc: "Add consultancy engagements and proof",
      icon: FaBriefcase,
      iconBg: "bg-orange-500 text-white",
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
      iconBg: "bg-orange-500 text-white",
      mode: "upload",
      category: "department",
      staffOnly: true,
    },
    {
      key: "uploadExtra",
      title: "Other Data Upload",
      desc: "Upload CSV/Excel of activities and save",
      icon: FaCloudUploadAlt,
      iconBg: "bg-teal-600 text-white",
      mode: "upload",
      category: "department",
      staffOnly: true,
    },
    {
      key: "topAchieversAnnouncement",
      title: "Top Achievers",
      desc: "Send announcements to selected achievers",
      icon: FaStar,
      iconBg: "bg-rose-500 text-white",
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
      iconBg: "bg-emerald-600 text-white",
      mode: "verify",
      category: "students",
      staffOnly: true,
    },
    {
      key: "verifyProjects",
      title: "Verify Project",
      desc: "Approve or reject submitted projects",
      icon: FaFolderOpen,
      iconBg: "bg-blue-600 text-white",
      mode: "verify",
      category: "students",
      staffOnly: true,
    },
    {
      key: "verifyHackathonProgress",
      title: "Verify Hackathon Progress",
      desc: "Review mapped hackathons and update progress & prize",
      icon: FaBolt,
      iconBg: "bg-purple-600 text-white",
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
      iconBg: "bg-cyan-600 text-white",
      mode: "export",
      category: "department",
      staffOnly: true,
    },
    {
      key: "bulkExport",
      title: "Bulk Export Data",
      desc: "Download complete database backup in Excel format",
      icon: FaDownload,
      iconBg: "bg-blue-600 text-white",
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
          (a) => activeStaffMode === "all" || activeStaffMode === "verify"
        )
      );

  const visibleExportActions = isStudent
    ? []
    : filterBySearch(
        exportActions.filter(
          (a) => activeStaffMode === "all" || activeStaffMode === "export"
        )
      );

  return (
    <div className={embedded ? "" : "min-h-[calc(100vh-4rem)] bg-[#f8fafc]"}>
      <div
        className={`w-full px-4 sm:px-6 lg:px-10 ${
          embedded ? "py-2" : "py-4 sm:py-6"
        } space-y-4`}
      >
        {/* Top Header Row (Back Button & Search Input) */}
        {!embedded && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => nav("/")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100 transition cursor-pointer self-start"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Page Main Title & Top Right Action Mode Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <FaBolt className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Quick Actions
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Access and manage department data quickly.
              </p>
            </div>
          </div>

          {/* Top Right Action Controls Bar (Upload | Verify | Export | More) - Staff/Admin only */}
          {!isStudent && (
            <div className="flex items-center gap-1 bg-[#f8fafc] p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-center">
              <button
                onClick={() => setActiveStaffMode("upload")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeStaffMode === "upload"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FaCloudUploadAlt className="w-4 h-4 text-blue-600" />
                Upload
              </button>

              <button
                onClick={() => setActiveStaffMode("verify")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeStaffMode === "verify"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FaCheckCircle className="w-4 h-4 text-emerald-600" />
                Verify
              </button>

              <button
                onClick={() => setActiveStaffMode("export")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeStaffMode === "export"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FaFileExport className="w-4 h-4 text-purple-600" />
                Export
              </button>

              <button
                onClick={() => setActiveStaffMode("all")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeStaffMode === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FaEllipsisH className="w-4 h-4 text-slate-500" />
                More
              </button>
            </div>
          )}
        </div>

        {/* Sub-Nav Category Filter Tabs (Staff/Admin only) */}
        {!isStudent && (
          <div className="inline-flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <FaThLarge className="w-3.5 h-3.5" />
              All Actions
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "students"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <FaUserGraduate className="w-3.5 h-3.5" />
              Students
            </button>

            <button
              onClick={() => setActiveTab("faculty")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "faculty"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <FaUserTie className="w-3.5 h-3.5" />
              Faculty
            </button>

            <button
              onClick={() => setActiveTab("research")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "research"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <FaFlask className="w-3.5 h-3.5" />
              Research
            </button>

            <button
              onClick={() => setActiveTab("department")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "department"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
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
            <div className="bg-[#f4f8ff] rounded-3xl border border-[#e0edff] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-blue-600 flex items-center gap-2">
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
                    iconBg={act.iconBg}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Faculty & Research (Staff/Admin only) */}
          {!isStudent && visibleFacultyActions.length > 0 && (
            <div className="bg-[#faf5ff] rounded-3xl border border-[#f3e8ff] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-purple-600 flex items-center gap-2">
                  <FaUserTie className="w-4 h-4 text-purple-600" />
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
                    iconBg={act.iconBg}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Department Management (Staff/Admin only) */}
          {!isStudent && visibleDeptActions.length > 0 && (
            <div className="bg-[#f0fdf4] rounded-3xl border border-[#dcfce7] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-emerald-700 flex items-center gap-2">
                  <FaBuilding className="w-4 h-4 text-emerald-600" />
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
                    iconBg={act.iconBg}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Verification Actions (Staff/Admin only) */}
          {!isStudent && (activeStaffMode === "verify" || activeStaffMode === "all") && visibleVerifyActions.length > 0 && (
            <div className="bg-[#fff7ed] rounded-3xl border border-[#ffedd5] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-orange-600" />
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
                    iconBg={act.iconBg}
                    onClick={goTo(act.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Export Actions (Staff/Admin only) */}
          {!isStudent && (activeStaffMode === "export" || activeStaffMode === "all") && visibleExportActions.length > 0 && (
            <div className="bg-[#f0f9ff] rounded-3xl border border-[#e0f2fe] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-cyan-700 flex items-center gap-2">
                  <FaFileExport className="w-4 h-4 text-cyan-600" />
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
                    iconBg={act.iconBg}
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

// Tile Card Component
function ActionTileCard({ title, desc, icon: Icon, iconBg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer w-full"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 font-medium leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <FaChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}
