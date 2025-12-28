import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

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
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <PageHeader
          title="Quick Actions"
          subtitle="Get started with your most common tasks."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Always available actions */}
          <Card
            onClick={goTo("achievements")}
            className="p-6 glitter-card bulge-card"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M20 6l-11 11-5-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-slate-800">
                Add Achievement
              </h3>
            </div>
            <p className="mt-2 text-slate-600">
              Showcase your accomplishments and milestones.
            </p>
          </Card>
          <Card
            onClick={goTo("projects")}
            className="p-6 glitter-card bulge-card"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
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
              </span>
              <h3 className="text-lg font-semibold text-slate-800">
                Upload Project
              </h3>
            </div>
            <p className="mt-2 text-slate-600">
              Share your latest projects with the department.
            </p>
          </Card>

          {/* Role-specific actions for staff */}
          {user?.role === "staff" ? (
            <>
              <Card
                onClick={goTo("uploadExtra")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Other Data Upload
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Upload CSV/Excel of activities and save.
                </p>
              </Card>
              <Card
                onClick={goTo("facultyParticipation")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
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
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Faculty Participation
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Add faculty training/participation details.
                </p>
              </Card>
              <Card
                onClick={goTo("facultyResearch")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal-100 text-teal-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M12 3l7 7-7 7-7-7 7-7z" strokeWidth="2" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Faculty Research
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Add research funding and project details.
                </p>
              </Card>
              <Card
                onClick={goTo("facultyConsultancy")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <path d="M12 7v10M7 12h10" strokeWidth="2" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Faculty Consultancy
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Add consultancy engagements and proof.
                </p>
              </Card>
              <Card
                onClick={goTo("verifyAchievements")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M4 6h16M4 12h10M4 18h8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Verify Achievement
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Review and verify student achievements.
                </p>
              </Card>
              <Card
                onClick={goTo("verifyProjects")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 text-orange-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Verify Project
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Approve or reject submitted projects.
                </p>
              </Card>
              <Card
                onClick={goTo("staffEvents")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
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
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Upload Events
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Create and manage department events.
                </p>
              </Card>
              <Card
                onClick={goTo("exportRecords")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cyan-100 text-cyan-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
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
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Export records
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Generate Excel/CSV reports for projects and achievements.
                </p>
              </Card>
            </>
          ) : (
            <>
              <Card
                onClick={goTo("community")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M4 6h16M4 12h10M4 18h8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Post Update
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Share news or updates with the community.
                </p>
              </Card>
              <Card
                onClick={goTo("community")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 text-orange-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Join Discussion
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Engage in conversations on the community forums.
                </p>
              </Card>
              <Card
                onClick={goTo("events")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
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
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    View Events
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Stay updated on upcoming department events.
                </p>
              </Card>
            </>
          )}

          {/* Always available */}
          <Card
            onClick={goTo("alumni")}
            className="p-6 glitter-card bulge-card"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-pink-100 text-pink-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M7 20h10M12 14a5 5 0 100-10 5 5 0 000 10z"
                    strokeWidth="2"
                  />
                  <path d="M2 20a10 10 0 0120 0" strokeWidth="2" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-slate-800">
                Connect with Alumni
              </h3>
            </div>
            <p className="mt-2 text-slate-600">
              Network with graduates and build connections.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
