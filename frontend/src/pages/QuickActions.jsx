import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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

export default function QuickActions() {
  const nav = useNavigate();
  const { user } = useAuth();
  const goTo = (key) => () => {
    // Common routes
    if (key === "achievements") return nav("/achievements");
    if (key === "projects") return nav("/projects/upload");

    // Staff-only standalone pages without dashboard UI
    if (key === "verifyAchievements") return nav("/verify-achievements");
    if (key === "verifyProjects") return nav("/verify-projects");
    if (key === "staffEvents") return nav("/upload-events");
    if (key === "facultyParticipation") return nav("/faculty-participation");
    if (key === "facultyResearch") return nav("/faculty-research");
    if (key === "facultyConsultancy") return nav("/faculty-consultancy");
    if (key === "uploadExtra") return nav("/upload-extra-curricular");

    if (key === "exportRecords") return nav("/staff/reports");

    // Generic placeholders
    if (key === "community") return nav("/"); // placeholder until community page exists
    if (key === "events") return nav("/events");
    if (key === "alumni") return nav("/"); // placeholder until alumni page exists
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
            Get started with your most common tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Always available actions */}
          <Card
            title="Add Achievement"
            desc="Showcase your accomplishments and milestones."
            color="#3b82f6"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <path
                  d="M20 6l-11 11-5-5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            onClick={goTo("achievements")}
          />
          <Card
            title="Upload Project"
            desc="Share your latest projects with the department."
            color="#22c55e"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="14"
                  rx="2"
                  strokeWidth="2"
                />
                <path d="M3 10h18" strokeWidth="2" />
              </svg>
            }
            onClick={goTo("projects")}
          />

          {/* Role-specific actions for staff */}
          {user?.role === "staff" ? (
            <>
              <Card
                title="Staff Data Entry"
                desc="Upload CSV/Excel of activities and save."
                color="#0ea5e9"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                onClick={goTo("uploadExtra")}
              />
              <Card
                title="Faculty Participation"
                desc="Add faculty training/participation details."
                color="#0ea5e9"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <path
                      d="M12 19l-7-7 7-7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 12h14"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                onClick={goTo("facultyParticipation")}
              />
              <Card
                title="Faculty Research"
                desc="Add research funding and project details."
                color="#14b8a6"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <path d="M12 3l7 7-7 7-7-7 7-7z" strokeWidth="2" />
                  </svg>
                }
                onClick={goTo("facultyResearch")}
              />
              <Card
                title="Faculty Consultancy"
                desc="Add consultancy engagements and proof."
                color="#10b981"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="9" strokeWidth="2" />
                    <path d="M12 7v10M7 12h10" strokeWidth="2" />
                  </svg>
                }
                onClick={goTo("facultyConsultancy")}
              />
              <Card
                title="Verify Achievement"
                desc="Review and verify student achievements."
                color="#a855f7"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <path
                      d="M4 6h16M4 12h10M4 18h8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                onClick={goTo("verifyAchievements")}
              />
              <Card
                title="Verify Project"
                desc="Approve or reject submitted projects."
                color="#f97316"
                icon={
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
                }
                onClick={goTo("verifyProjects")}
              />
              <Card
                title="Upload Events"
                desc="Create and manage department events."
                color="#6366f1"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 2v4M8 2v4M3 10h18"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                onClick={goTo("staffEvents")}
              />
              <Card
                title="Export records"
                desc="Generate Excel/CSV reports for projects and achievements."
                color="#06b6d4"
                icon={
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
                }
                onClick={goTo("exportRecords")}
              />
            </>
          ) : (
            <>
              <Card
                title="Post Update"
                desc="Share news or updates with the community."
                color="#a855f7"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <path
                      d="M4 6h16M4 12h10M4 18h8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                onClick={goTo("community")}
              />
              <Card
                title="Join Discussion"
                desc="Engage in conversations on the community forums."
                color="#f97316"
                icon={
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
                }
                onClick={goTo("community")}
              />
              <Card
                title="View Events"
                desc="Stay updated on upcoming department events."
                color="#6366f1"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-white"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 2v4M8 2v4M3 10h18"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                onClick={goTo("events")}
              />
            </>
          )}

          {/* Always available */}
          <Card
            title="Connect with Alumni"
            desc="Network with graduates and build connections."
            color="#ec4899"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <path
                  d="M7 20h10M12 14a5 5 0 100-10 5 5 0 000 10z"
                  strokeWidth="2"
                />
                <path d="M2 20a10 10 0 0120 0" strokeWidth="2" />
              </svg>
            }
            onClick={goTo("alumni")}
          />
        </div>
      </div>
    </div>
  );
}
