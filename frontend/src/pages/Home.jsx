import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/axiosClient";
import EventsCarousel from "../components/EventsCarousel";
import AchievementsRecentGrid from "../components/AchievementsRecentGrid";
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
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-10 md:pt-12 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
          <div className="md:col-span-2 text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-800 leading-tight">
              <BlurText text="Sona College of Technology" />
            </h1>

            <p className="mx-auto mt-3 sm:mt-4 max-w-3xl text-sm sm:text-base md:text-lg text-slate-600">
              Your central hub for achievements, projects, and community engagement.
            </p>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <Button onClick={goToQuickActions} className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base shadow-md hover:shadow-lg transition-all">
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
                <span className="font-semibold">Explore Actions</span>
              </Button>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="rounded-lg sm:rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-3 sm:p-5 shadow-lg">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 mb-2 sm:mb-3">
                At a Glance
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-2">
                <button
                  onClick={() => nav("/projects/approved")}
                  className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-cyan-500 hover:border-cyan-400"
                >
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Projects</div>
                  <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                    {projCount === null ? "—" : projCount}
                  </div>
                </button>
                <button
                  onClick={() => nav("/achievements/approved")}
                  className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-fuchsia-500 hover:border-fuchsia-400"
                >
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Achievements
                  </div>
                  <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                    {achCount === null ? "—" : achCount}
                  </div>
                </button>
                {user?.role === "admin" && (
                  <>
                    <button
                      onClick={() => nav("/admin/students")}
                      className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-emerald-500 hover:border-emerald-400"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Students
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                        {studentCount === null ? "—" : studentCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/admin/staff")}
                      className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-violet-500 hover:border-violet-400"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Staff
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                        {staffCount === null ? "—" : staffCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/events")}
                      className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-amber-500 hover:border-amber-400"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Events
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                        {eventCount === null ? "—" : eventCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/faculty-research-approved")}
                      className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-blue-500 hover:border-blue-400"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Research
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                        {researchCount === null ? "—" : researchCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/faculty-consultancy-approved")}
                      className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-rose-500 hover:border-rose-400"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Consultancy
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
                        {consultancyCount === null ? "—" : consultancyCount}
                      </div>
                    </button>
                    <button
                      onClick={() => nav("/faculty-participation-approved")}
                      className="rounded-lg p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-indigo-500 hover:border-indigo-400"
                    >
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Participation
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-100">
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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-6 sm:pb-8">
        <PageHeader title="Events" />
        <div className="mt-2 sm:mt-3 grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <EventsCarousel events={events} intervalMs={5000} />
          </div>
          <div className="md:col-span-1">
            <AchievementsLeaderboard />
          </div>
        </div>
      </div>

      {/* Recent Achievements grid (latest 6) */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <AchievementsRecentGrid limit={6} />
      </div>
    </div>
  );
}
