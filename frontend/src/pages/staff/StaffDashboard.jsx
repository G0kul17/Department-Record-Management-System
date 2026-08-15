import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ProjectsManagement from "./ProjectsManagement";
import AchievementsManagement from "./AchievementsManagement";
import EventsManagement from "./EventsManagement";
import FacultyResearch from "./FacultyResearch";
import FacultyParticipation from "./FacultyParticipation";
import FacultyConsultancy from "./FacultyConsultancy";
import QuickActions from "../QuickActions";
import apiClient from "../../api/axiosClient";
import { formatDisplayName } from "../../utils/displayName";
import EventsCarousel from "../../components/EventsCarousel";
import AchievementsRecentGrid from "../../components/AchievementsRecentGrid";
import ProjectsRecentGrid from "../../components/ProjectsRecentGrid";
import AchievementsLeaderboard from "../../components/AchievementsLeaderboard";
import {
  FaFolder,
  FaTrophy,
  FaUsers,
  FaFlask,
  FaBriefcase,
} from "react-icons/fa";

const StaffDashboard = () => {
  const { user } = useAuth();
  const displayName = formatDisplayName(user);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { label: "📊 Overview", to: "/staff" },
    { label: "📁 Projects", to: "/staff/projects" },
    { label: "⭐ Achievements", to: "/staff/achievements" },
    { label: "📅 Events", to: "/staff/events" },
    { label: "📥 Bulk Export", to: "/staff/bulk-export" },
  ];

  function SidebarContent() {
    return (
      <>
        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="text-base font-bold text-slate-800 dark:text-slate-100">
            {displayName || "Staff"}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Staff Portal
          </div>
        </div>
        <nav className="space-y-1">
          {navLinks.map((link, i) => (
            <React.Fragment key={link.to}>
              {i === 4 && (
                <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
              )}
              <Link
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                to={link.to}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile top bar with sidebar toggle */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            Menu
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Staff Portal
          </span>
        </div>

        <div className="flex items-start gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sticky top-20 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <SidebarContent />
          </aside>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] rounded-r-2xl border-r border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Staff Portal
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-600 dark:text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <SidebarContent />
            </div>
          )}

          <main className="flex-1 min-w-0">
            <Routes>
              <Route index element={<OverviewPanel user={user} />} />
              <Route path="projects" element={<ProjectsManagement />} />
              <Route path="achievements" element={<AchievementsManagement />} />
              <Route path="events" element={<EventsManagement />} />
              <Route path="faculty-research" element={<FacultyResearch />} />
              <Route
                path="faculty-participation"
                element={<FacultyParticipation />}
              />
              <Route
                path="faculty-consultancy"
                element={<FacultyConsultancy />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

function OverviewPanel({ user }) {
  const navigate = useNavigate();
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);
  const [partCount, setPartCount] = useState(null);
  const [resCount, setResCount] = useState(null);
  const [consCount, setConsCount] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const displayName = formatDisplayName(user);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, a, part, res, cons] = await Promise.all([
          apiClient.get("/projects/count?verified=true"),
          apiClient.get("/achievements/count?verified=true"),
          apiClient.get("/faculty-participations/count"),
          apiClient.get("/faculty-research/count"),
          apiClient.get("/faculty-consultancy/count"),
        ]);
        if (!mounted) return;
        setProjCount(p?.count ?? 0);
        setAchCount(a?.count ?? 0);
        setPartCount(part?.count ?? 0);
        setResCount(res?.count ?? 0);
        setConsCount(cons?.count ?? 0);
      } catch (e) {
        if (!mounted) return;
        setProjCount(0);
        setAchCount(0);
        setPartCount(0);
        setResCount(0);
        setConsCount(0);
      }
    })();
    // load last 4 added events for staff overview (carousel)
    (async () => {
      setLoadingEvents(true);
      try {
        const ev = await apiClient.get("/events?order=latest&limit=4");
        if (!mounted) return;
        setEvents(ev?.events || []);
      } catch (e) {
        console.error(e);
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 sm:p-7 shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">{`Welcome, ${displayName || "Staff"}`}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3 text-base leading-relaxed">
            Use the side menu to manage projects, achievements and events.
          </p>
          <div className="mt-4 h-px w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/60 bg-[#131b2e] p-5 shadow-2xl h-full backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-4 tracking-tight">
              At a Glance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/projects/approved")}
                className="group rounded-xl p-3.5 bg-[#1e2942]/90 hover:bg-[#253252] transition-all duration-200 text-left border border-slate-700/60 hover:border-blue-500/60 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md flex-shrink-0">
                    <FaFolder className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider whitespace-normal leading-tight">
                    Projects
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                  {projCount === null ? "—" : projCount}
                </div>
              </button>

              <button
                onClick={() => navigate("/achievements/approved")}
                className="group rounded-xl p-3.5 bg-[#1e2942]/90 hover:bg-[#253252] transition-all duration-200 text-left border border-slate-700/60 hover:border-amber-500/60 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-amber-500 text-white shadow-md flex-shrink-0">
                    <FaTrophy className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider whitespace-normal leading-tight">
                    Achievements
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                  {achCount === null ? "—" : achCount}
                </div>
              </button>

              <button
                onClick={() => navigate("/faculty-participation-approved")}
                className="group rounded-xl p-3.5 bg-[#1e2942]/90 hover:bg-[#253252] transition-all duration-200 text-left border border-slate-700/60 hover:border-purple-500/60 flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-purple-600 text-white shadow-md flex-shrink-0">
                    <FaUsers className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider whitespace-normal leading-tight">
                    Participation
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-white group-hover:text-purple-400 transition-colors">
                  {partCount === null ? "—" : partCount}
                </div>
              </button>

              <button
                onClick={() => navigate("/faculty-research-approved")}
                className="group rounded-xl p-3.5 bg-[#1e2942]/90 hover:bg-[#253252] transition-all duration-200 text-left border border-slate-700/60 hover:border-orange-500/60 flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md flex-shrink-0">
                    <FaFlask className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider whitespace-normal leading-tight">
                    Research
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-white group-hover:text-orange-400 transition-colors">
                  {resCount === null ? "—" : resCount}
                </div>
              </button>

              <button
                onClick={() => navigate("/faculty-consultancy-approved")}
                className="group rounded-xl p-3.5 bg-[#1e2942]/90 hover:bg-[#253252] transition-all duration-200 text-left border border-slate-700/60 hover:border-cyan-500/60 flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-md flex-shrink-0">
                    <FaBriefcase className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider whitespace-normal leading-tight">
                    Consultancy
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                  {consCount === null ? "—" : consCount}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickActions embedded />

      <div>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Latest
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Events
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {loadingEvents ? (
              <div className="text-sm text-slate-600 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-600 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                No events yet.
              </div>
            ) : (
              <EventsCarousel events={events} intervalMs={4500} />
            )}
          </div>
          <div className="lg:col-span-1">
            <AchievementsLeaderboard limit={10} />
          </div>
        </div>
      </div>

      {/* Recent Projects grid (latest 6) for staff */}
      <div>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Recent
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Projects
          </h3>
        </div>
        <ProjectsRecentGrid limit={6} />
      </div>

      {/* Recent Achievements grid (latest 6) for staff */}
      <div className="pb-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Recent
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Achievements
          </h3>
        </div>
        <AchievementsRecentGrid limit={6} />
      </div>
    </div>
  );
}

export default StaffDashboard;
