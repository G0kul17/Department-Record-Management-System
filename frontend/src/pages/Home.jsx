import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/axiosClient";
import EventsCarousel from "../components/EventsCarousel";
import AchievementsRecentGrid from "../components/AchievementsRecentGrid";
import ProjectsRecentGrid from "../components/ProjectsRecentGrid";
import AchievementsLeaderboard from "../components/AchievementsLeaderboard";
import BlurText from "../components/ui/BlurText";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [staffCount, setStaffCount] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [researchCount, setResearchCount] = useState(null);
  const [consultancyCount, setConsultancyCount] = useState(null);
  const [participationCount, setParticipationCount] = useState(null);

  // use shared events data
  // events is imported from ../data/events

  const goToQuickActions = () => {
    if (!user) return nav("/login");
    if (user.role === "admin") return nav("/admin/quick-actions");
    return nav("/quick-actions");
  };

  // carousel handled by EventsCarousel component

  useEffect(() => {
    // fetch stats and events (resilient: don't let one failure block others)
    let mounted = true;
    (async () => {
      const [p, a] = await Promise.allSettled([
        apiClient.get("/projects/count?verified=true"),
        apiClient.get("/achievements/count?verified=true"),
      ]);
      if (!mounted) return;
      setProjCount(p.status === "fulfilled" ? p.value?.count ?? 0 : 0);
      setAchCount(a.status === "fulfilled" ? a.value?.count ?? 0 : 0);

      // fetch latest 4 events (last added)
      try {
        const ev = await apiClient.get("/events?order=latest&limit=4");
        const evs = ev?.events || [];
        if (mounted) setEvents(evs);
      } catch (_) {
        if (mounted) setEvents([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Admin-only totals: students, staff, events
  useEffect(() => {
    let mounted = true;
    if (user?.role !== "admin") return;
    (async () => {
      try {
        const stats = await apiClient.get("/admin/stats");
        if (!mounted) return;
        setStudentCount(stats?.students ?? 0);
        setStaffCount(stats?.staff ?? 0);
        setEventCount(stats?.events ?? 0);
      } catch (e) {
        if (!mounted) return;
        setStudentCount(0);
        setStaffCount(0);
        setEventCount(0);
      }
      // Load admin-only faculty stats counts
      try {
        const [fr, fc, fp] = await Promise.all([
          apiClient.get("/faculty-research"),
          apiClient.get("/faculty-consultancy"),
          apiClient.get("/faculty-participations"),
        ]);
        if (!mounted) return;
        setResearchCount(Array.isArray(fr?.data) ? fr.data.length : 0);
        setConsultancyCount(Array.isArray(fc?.data) ? fc.data.length : 0);
        setParticipationCount(
          fp?.total ||
            (Array.isArray(fp?.participation) ? fp.participation.length : 0)
        );
      } catch (e) {
        if (!mounted) return;
        setResearchCount(0);
        setConsultancyCount(0);
        setParticipationCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white to-slate-50">
      {/* Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          <div className="md:col-span-2 text-center md:text-left space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800 leading-tight">
              <BlurText text="Sona College of Technology" />
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto md:mx-0">
              Your central hub for achievements, projects, and community engagement.
            </p>

            <div className="pt-2 flex justify-center md:justify-start">
              <Button onClick={goToQuickActions} className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M14 4l6 6-6 6-6-6 6-6z"
                    fill="currentColor"
                    opacity=".15"
                  />
                  <path
                    d="M14 4l6 6-6 6m0-12l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Explore Actions</span>
              </Button>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-7 shadow-xl h-full">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 mb-4 sm:mb-5">
                At a Glance
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => nav("/projects/approved")}
                  className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-cyan-500 hover:border-cyan-400 hover:shadow-lg"
                >
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Projects</div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                    {projCount === null ? "—" : projCount}
                  </div>
                </button>
                <button
                  onClick={() => nav("/achievements/approved")}
                  className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-fuchsia-500 hover:border-fuchsia-400 hover:shadow-lg"
                >
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Achievements
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                    {achCount === null ? "—" : achCount}
                  </div>
                </button>
                {user?.role === "admin" && (
                  <>
                    <button
                      onClick={() => nav("/admin/students")}
                      className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-emerald-500 hover:border-emerald-400 hover:shadow-lg"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Students
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                        {studentCount === null ? "—" : studentCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/admin/staff")}
                      className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-violet-500 hover:border-violet-400 hover:shadow-lg"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Staff
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                        {staffCount === null ? "—" : staffCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/events")}
                      className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-amber-500 hover:border-amber-400 hover:shadow-lg"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Events
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                        {eventCount === null ? "—" : eventCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/faculty-research-approved")}
                      className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-blue-500 hover:border-blue-400 hover:shadow-lg"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Research
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                        {researchCount === null ? "—" : researchCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/faculty-consultancy-approved")}
                      className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-rose-500 hover:border-rose-400 hover:shadow-lg"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Consultancy
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                        {consultancyCount === null ? "—" : consultancyCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/faculty-participation-approved")}
                      className="rounded-xl p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left border-2 border-indigo-500 hover:border-indigo-400 hover:shadow-lg"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Participation
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">
                        {participationCount === null ? "—" : participationCount}
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events carousel (latest 4 events) */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Latest Events
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-3"></div>
        </div>
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <EventsCarousel events={events} intervalMs={5000} />
          </div>
          <div className="md:col-span-1">
            <AchievementsLeaderboard />
          </div>
        </div>
      </div>

      {/* Recent Projects grid (latest 6) */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Recent Projects
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-3"></div>
        </div>
        <ProjectsRecentGrid limit={6} />
      </div>

      {/* Recent Achievements grid (latest 6) */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-12 sm:pb-16">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Recent Achievements
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></div>
        </div>
        <AchievementsRecentGrid limit={6} />
      </div>
    </div>
  );
}
