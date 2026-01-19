import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ProjectsManagement from "./ProjectsManagement";
import AchievementsManagement from "./AchievementsManagement";
import EventsManagement from "./EventsManagement";
import QuickActions from "../QuickActions";
import apiClient from "../../api/axiosClient";
import { useEffect, useState } from "react";
import { formatDisplayName } from "../../utils/displayName";
import EventsCarousel from "../../components/EventsCarousel";
import AchievementsRecentGrid from "../../components/AchievementsRecentGrid";
import ProjectsRecentGrid from "../../components/ProjectsRecentGrid";
import AchievementsLeaderboard from "../../components/AchievementsLeaderboard";

const StaffDashboard = () => {
  const { user } = useAuth();
  const displayName = formatDisplayName(user);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start gap-8">
          <aside className="w-72 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sticky top-20 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                {displayName || "Staff"}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Staff Portal
              </div>
            </div>
            <nav className="space-y-1">
              <Link
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                to="/staff"
              >
                📊 Overview
              </Link>
              <Link
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                to="/staff/projects"
              >
                📁 Projects
              </Link>
              <Link
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                to="/staff/achievements"
              >
                ⭐ Achievements
              </Link>
              <Link
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                to="/staff/events"
              >
                📅 Events
              </Link>
              <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
              <Link
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                to="/staff/bulk-export"
              >
                📥 Bulk Export
              </Link>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="">
              <Routes>
                <Route index element={<OverviewPanel user={user} />} />
                <Route path="projects" element={<ProjectsManagement />} />
                <Route
                  path="achievements"
                  element={<AchievementsManagement />}
                />
                <Route path="events" element={<EventsManagement />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

function OverviewPanel({ user }) {
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const displayName = formatDisplayName(user);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, a] = await Promise.all([
          apiClient.get("/projects/count?verified=true"),
          apiClient.get("/achievements/count?verified=true"),
        ]);
        if (!mounted) return;
        setProjCount(p?.count ?? 0);
        setAchCount(a?.count ?? 0);
      } catch (e) {
        if (!mounted) return;
        setProjCount(0);
        setAchCount(0);
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
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-7 shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{`Welcome, ${displayName || "Staff"}`}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3 text-base leading-relaxed">
            Use the side menu to manage projects, achievements and events.
          </p>
          <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl h-full">
            <h2 className="text-base font-bold text-slate-100 mb-5">
              At a Glance
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => (window.location.href = "/projects/approved")}
                className="rounded-xl p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-cyan-500 hover:border-cyan-400 hover:shadow-lg"
              >
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Projects
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-100">
                  {projCount === null ? "—" : projCount}
                </div>
              </button>
              <button
                onClick={() => (window.location.href = "/achievements/approved")}
                className="rounded-xl p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-fuchsia-500 hover:border-fuchsia-400 hover:shadow-lg"
              >
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Achievements
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-100">
                  {achCount === null ? "—" : achCount}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickActions />

      <div>
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Latest Events
          </h3>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {loadingEvents ? (
              <div className="text-sm text-slate-600 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-600 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl">No events yet.</div>
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
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Recent Projects
          </h3>
          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-3"></div>
        </div>
        <ProjectsRecentGrid limit={6} />
      </div>

      {/* Recent Achievements grid (latest 6) for staff */}
      <div className="pb-8">
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Recent Achievements
          </h3>
          <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></div>
        </div>
        <AchievementsRecentGrid limit={6} />
      </div>
    </div>
  );
}

export default StaffDashboard;
