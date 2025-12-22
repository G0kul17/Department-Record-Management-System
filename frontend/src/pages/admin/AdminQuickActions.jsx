import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Card = ({ title, desc, color, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl p-6 text-left text-white shadow-lg transition transform hover:-translate-y-0.5 hover:shadow-xl`}
    style={{ backgroundColor: color }}
  >
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl bg-white" />
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
        {icon}
      </span>
      <h3 className="text-2xl font-bold drop-shadow-sm">{title}</h3>
    </div>
    <p className="mt-3 text-white/90 font-medium">{desc}</p>
  </button>
);

export default function AdminQuickActions() {
  const nav = useNavigate();
  const { user } = useAuth();

  const goTo = (key) => () => {
    if (key === "achievements") return nav("/achievements");
    if (key === "projects") return nav("/projects/upload");
    if (key === "verifyAchievements") return nav("/admin/verify-achievements");
    if (key === "verifyProjects") return nav("/admin/verify-projects");
    if (key === "staffEvents") return nav("/admin/upload-events");
    if (key === "facultyParticipation")
      return nav("/admin/faculty-participation");
    if (key === "facultyResearch") return nav("/admin/faculty-research");
    if (key === "facultyConsultancy") return nav("/admin/faculty-consultancy");
    if (key === "uploadExtra") return nav("/admin/upload-extra-curricular");
    if (key === "exportRecords") return nav("/admin/reports");
    if (key === "manageUsers") return nav("/admin/users");
    return nav("/");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 hero-gradient">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
            Quick Actions
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Manage and verify department submissions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card
            title="Staff Data Entry"
            desc="Upload CSV/Excel of activities and save."
            color="#0ea5e9"
            icon={<IconUpload />}
            onClick={goTo("uploadExtra")}
          />
          <Card
            title="Add Achievement"
            desc="Create an achievement on behalf of faculty/student."
            color="#3b82f6"
            icon={<IconCheck />}
            onClick={goTo("achievements")}
          />
          <Card
            title="Upload Project"
            desc="Share recent projects with the department."
            color="#22c55e"
            icon={<IconWindow />}
            onClick={goTo("projects")}
          />
          <Card
            title="Verify Achievement"
            desc="Review and approve submitted achievements."
            color="#a855f7"
            icon={<IconList />}
            onClick={goTo("verifyAchievements")}
          />
          <Card
            title="Verify Project"
            desc="Approve or reject project submissions."
            color="#f97316"
            icon={<IconChat />}
            onClick={goTo("verifyProjects")}
          />
          <Card
            title="Upload Events"
            desc="Create and manage department events."
            color="#6366f1"
            icon={<IconCalendar />}
            onClick={goTo("staffEvents")}
          />
          <Card
            title="Faculty Participation"
            desc="Add faculty training/participation details."
            color="#0ea5e9"
            icon={<IconList />}
            onClick={goTo("facultyParticipation")}
          />
          <Card
            title="Faculty Research"
            desc="Add research funding and project details."
            color="#14b8a6"
            icon={<IconList />}
            onClick={goTo("facultyResearch")}
          />
          <Card
            title="Faculty Consultancy"
            desc="Add consultancy engagements and proof."
            color="#10b981"
            icon={<IconList />}
            onClick={goTo("facultyConsultancy")}
          />
          <Card
            title="Export Records"
            desc="Generate Excel/CSV reports."
            color="#06b6d4"
            icon={<IconUpload />}
            onClick={goTo("exportRecords")}
          />
          <Card
            title="Manage Users"
            desc="View, change roles, or remove users."
            color="#ef4444"
            icon={<IconUsers />}
            onClick={goTo("manageUsers")}
          />
        </div>
      </div>
    </div>
  );
}
// Minimal inline SVG icon components reused from QuickActions
function IconCheck() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <path d="M20 6l-11 11-5-5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconWindow() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <rect x="3" y="4" width="18" height="14" rx="2" strokeWidth="2" />
      <path d="M3 10h18" strokeWidth="2" />
    </svg>
  );
}
function IconList() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <path d="M4 6h16M4 12h10M4 18h8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <path
        d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="7 10 12 15 17 10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="15"
        x2="12"
        y2="3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-white"
    >
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
      <path
        d="M22 21v-2a4 4 0 00-3-3.87"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 3.13a4 4 0 010 7.75"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
