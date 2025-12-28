import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import BackButton from "../../components/BackButton";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

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
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <BackButton />
        <PageHeader
          title="Quick Actions"
          subtitle="Manage and verify department submissions."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card
            onClick={goTo("uploadExtra")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconUpload />}
              title="Other Data Upload"
              desc="Upload CSV/Excel of activities and save."
              color="sky"
            />
          </Card>
          <Card
            onClick={goTo("achievements")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconCheck />}
              title="Add Achievement"
              desc="Create an achievement on behalf of faculty/student."
              color="blue"
            />
          </Card>
          <Card
            onClick={goTo("projects")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconWindow />}
              title="Upload Project"
              desc="Share recent projects with the department."
              color="green"
            />
          </Card>
          <Card
            onClick={goTo("verifyAchievements")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconList />}
              title="Verify Achievement"
              desc="Review and approve submitted achievements."
              color="violet"
            />
          </Card>
          <Card
            onClick={goTo("verifyProjects")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconChat />}
              title="Verify Project"
              desc="Approve or reject project submissions."
              color="orange"
            />
          </Card>
          <Card
            onClick={goTo("staffEvents")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconCalendar />}
              title="Upload Events"
              desc="Create and manage department events."
              color="indigo"
            />
          </Card>
          <Card
            onClick={goTo("facultyParticipation")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconList />}
              title="Faculty Participation"
              desc="Add faculty training/participation details."
              color="sky"
            />
          </Card>
          <Card
            onClick={goTo("facultyResearch")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconList />}
              title="Faculty Research"
              desc="Add research funding and project details."
              color="teal"
            />
          </Card>
          <Card
            onClick={goTo("facultyConsultancy")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconList />}
              title="Faculty Consultancy"
              desc="Add consultancy engagements and proof."
              color="emerald"
            />
          </Card>
          <Card
            onClick={goTo("exportRecords")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconUpload />}
              title="Export Records"
              desc="Generate Excel/CSV reports."
              color="cyan"
            />
          </Card>
          <Card
            onClick={goTo("manageUsers")}
            className="p-6 glitter-card bulge-card"
          >
            <Tile
              icon={<IconUsers />}
              title="Manage Users"
              desc="View, change roles, or remove users."
              color="red"
            />
          </Card>
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

// Small helper to render tile content consistently inside Card
function Tile({ icon, title, desc, color }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    sky: "bg-sky-100 text-sky-600",
    green: "bg-green-100 text-green-600",
    teal: "bg-teal-100 text-teal-600",
    emerald: "bg-emerald-100 text-emerald-600",
    violet: "bg-violet-100 text-violet-600",
    orange: "bg-orange-100 text-orange-600",
    indigo: "bg-indigo-100 text-indigo-600",
    cyan: "bg-cyan-100 text-cyan-600",
    red: "bg-red-100 text-red-600",
  };
  const badge = colorMap[color] || colorMap.blue;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${badge}`}
        >
          {icon}
        </span>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="mt-2 text-slate-600">{desc}</p>
    </div>
  );
}
