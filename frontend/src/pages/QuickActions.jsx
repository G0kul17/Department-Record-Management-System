import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function QuickActions({ embedded = false }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === "staff";
  const [activeStaffTab, setActiveStaffTab] = useState("upload");
  const goTo = (key) => () => {
    // Common routes
    if (key === "achievements") return nav("/achievements");
    if (key === "projects") return nav("/projects/upload");
    if (key === "hackathons") return nav("/hackathons");

    // Staff-only standalone pages without dashboard UI
    if (key === "verifyAchievements") return nav("/verify-achievements");
    if (key === "verifyProjects") return nav("/verify-projects");
    if (key === "verifyHackathonProgress") return nav("/verify-hackathon-progress");
    if (key === "staffEvents") return nav("/upload-events");
    if (key === "facultyParticipation") return nav("/faculty-participation");
    if (key === "facultyResearch") return nav("/faculty-research");
    if (key === "facultyConsultancy") return nav("/faculty-consultancy");
    if (key === "uploadExtra") return nav("/upload-extra-curricular");
    if (key === "studentsBatch") return nav("/upload-students-batch");
    if (key === "topAchieversAnnouncement")
      return nav("/top-achievers-announcement");

    if (key === "exportRecords") return nav("/staff/reports");
    if (key === "bulkExport") return nav("/staff/bulk-export");

    if (key === "events") return nav("/events");
    return nav("/");
  };

  return (
    <div className={embedded ? "" : "min-h-[calc(100vh-4rem)] bg-slate-50"}>
      <div className={`mx-auto max-w-7xl w-full px-4 sm:px-6 ${embedded ? "py-0" : "py-8 sm:py-12"}`}>
        {!embedded && (
          <PageHeader
            title="Quick Actions"
            subtitle="Get started with your most common tasks."
          />
        )}

        {isStaff && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStaffTab("upload")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeStaffTab === "upload"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveStaffTab("verify")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeStaffTab === "verify"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => setActiveStaffTab("export")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeStaffTab === "export"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Export
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Always available actions */}
          {(!isStaff || activeStaffTab === "upload") && (
            <Card
              onClick={goTo("achievements")}
              className="p-4 sm:p-6 glitter-card bulge-card"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
          )}
          {(!isStaff || activeStaffTab === "upload") && (
            <Card
              onClick={goTo("projects")}
              className="p-4 sm:p-6 glitter-card bulge-card"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
          )}
          {(!isStaff || activeStaffTab === "upload") && (
            <Card
              onClick={goTo("hackathons")}
              className="p-4 sm:p-6 glitter-card bulge-card"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                  Hackathon Entry and Progress
                </h3>
              </div>
              <p className="mt-2 text-slate-600">
                Upload your Hackathon participation and Track your progress
              </p>
            </Card>
          )}

          {/* Role-specific actions for staff */}
          {user?.role === "staff" ? (
            <>
              {activeStaffTab === "upload" && (
                <>
                  <Card
                    onClick={goTo("studentsBatch")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                        Add Students Batch
                      </h3>
                    </div>
                    <p className="mt-2 text-slate-600">
                      Upload a CSV/Excel to add students in bulk.
                    </p>
                  </Card>
                  <Card
                    onClick={goTo("uploadExtra")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    onClick={goTo("staffEvents")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    onClick={goTo("topAchieversAnnouncement")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M12 4l3 6 6 .5-4.5 4 1.5 6-6-3.5-6 3.5 1.5-6L3 10.5 9 10l3-6z"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Top Achievers
                      </h3>
                    </div>
                    <p className="mt-2 text-slate-600">
                      Send announcements to selected top achievers.
                    </p>
                  </Card>
                </>
              )}

              {activeStaffTab === "verify" && (
                <>
                  <Card
                    onClick={goTo("verifyAchievements")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                    onClick={goTo("verifyHackathonProgress")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M4 6h16M4 12h16M4 18h10"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Verify Hackathon Progress
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Review mapped hackathons and update rounds, progress, prize, and duration.
                </p>
                  </Card>
                </>
              )}

              {activeStaffTab === "export" && (
                <>
                  <Card
                    onClick={goTo("exportRecords")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
                  <Card
                    onClick={goTo("bulkExport")}
                    className="p-4 sm:p-6 glitter-card bulge-card"
                  >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Bulk Export Data
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">
                  Download complete database backup in Excel format.
                </p>
                  </Card>
                </>
              )}
            </>
          ) : (
            <>
              <Card
                onClick={goTo("events")}
                className="p-4 sm:p-6 glitter-card bulge-card"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
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
        </div>
      </div>
    </div>
  );
}
