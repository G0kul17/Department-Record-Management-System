import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ProjectsManagement from "./ProjectsManagement";
import AchievementsManagement from "./AchievementsManagement";
import EventsManagement from "./EventsManagement";
import QuickActions from "../QuickActions";
import apiClient from "../../api/axiosClient";
import { useEffect, useState } from "react";

const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start gap-6">
          <aside className="w-64 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.fullName || user?.email || "Staff"}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Staff Portal</div>
            </div>
            <nav className="space-y-2">
              <Link className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" to="/staff">
                Overview
              </Link>
              <Link className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" to="/staff/projects">
                Projects
              </Link>
              <Link className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" to="/staff/achievements">
                Achievements
              </Link>
              <Link className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" to="/staff/events">
                Events
              </Link>
            </nav>
          </aside>

          <main className="flex-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{`Welcome, ${user?.fullName || user?.email || "Staff"}`}</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">Use the side menu to manage projects, achievements and events.</p>
            </div>

            <div className="mt-6">
              <Routes>
                <Route
                  index
                  element={<OverviewPanel />}
                />
                <Route path="projects" element={<ProjectsManagement />} />
                <Route path="achievements" element={<AchievementsManagement />} />
                <Route path="events" element={<EventsManagement />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

function OverviewPanel() {
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, a] = await Promise.all([
          apiClient.get("/projects/count"),
          apiClient.get("/achievements/count"),
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
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <QuickActions />

      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">At a Glance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-cyan-200 to-blue-300 dark:from-cyan-900/50 dark:to-blue-900/60 dark:ring-white/10">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Projects</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{projCount === null ? "—" : projCount}</div>
            </div>
          </div>
          <div className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-fuchsia-200 to-rose-300 dark:from-fuchsia-900/50 dark:to-rose-900/60 dark:ring-white/10">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Achievements</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{achCount === null ? "—" : achCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;