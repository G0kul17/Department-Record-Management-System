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
import AchievementsLeaderboard from "../../components/AchievementsLeaderboard";

const StaffDashboard = () => {
  const { user } = useAuth();
  const displayName = formatDisplayName(user);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start gap-6">
          <aside className="w-64 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {displayName || "Staff"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Staff Portal
              </div>
            </div>
            <nav className="space-y-2">
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                to="/staff"
              >
                Overview
              </Link>
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                to="/staff/projects"
              >
                Projects
              </Link>
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                to="/staff/achievements"
              >
                Achievements
              </Link>
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                to="/staff/events"
              >
                Events
              </Link>
              <div className="my-2 border-t border-slate-200 dark:border-slate-700"></div>
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                to="/staff/bulk-export"
              >
                Bulk Export
              </Link>
            </nav>
          </aside>

          <main className="flex-1">
            <div className="mt-0">
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{`Welcome, ${
            displayName || "Staff"
          }`}</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Use the side menu to manage projects, achievements and events.
          </p>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-xl h-full">
            <h2 className="text-base font-bold text-slate-100 mb-3">
              At a Glance
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => (window.location.href = "/projects/approved")}
                className="rounded-lg p-4 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-cyan-500 hover:border-cyan-400"
              >
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Projects
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-100">
                  {projCount === null ? "—" : projCount}
                </div>
              </button>
              <button
                onClick={() => (window.location.href = "/achievements/approved")}
                className="rounded-lg p-4 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-fuchsia-500 hover:border-fuchsia-400"
              >
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Achievements
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-100">
                  {achCount === null ? "—" : achCount}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickActions />

      <div>
        <h3 className="mt-6 mb-3 text-xl font-bold text-slate-800 dark:text-slate-100">
          Latest Events
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loadingEvents ? (
              <div className="text-sm text-slate-600 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-600 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">No events yet.</div>
            ) : (
              <EventsCarousel events={events} intervalMs={4500} />
            )}
          </div>
          <div className="lg:col-span-1">
            <AchievementsLeaderboard limit={10} />
          </div>
        </div>
      </div>

      {/* Recent Achievements grid (latest 6) for staff */}
      <div className="mt-6">
        <AchievementsRecentGrid limit={6} />
      </div>
    </div>
  );
}

export default StaffDashboard;
