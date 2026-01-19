import React, { useCallback, useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import EventsCarousel from "../../components/EventsCarousel";
import AchievementsRecentGrid from "../../components/AchievementsRecentGrid";
import ProjectsRecentGrid from "../../components/ProjectsRecentGrid";
import Card from "../../components/ui/Card";
import AchievementsLeaderboard from "../../components/AchievementsLeaderboard";

export default function StudentDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [evIdx, setEvIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  const goToQuickActions = () => {
    if (!user) return nav("/login");
    return nav("/quick-actions");
  };

  // carousel controls will be handled by EventsCarousel

  useEffect(() => {
    // fetch stats in parallel
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

    // fetch latest events (staff-uploaded) for student dashboard
    (async () => {
      setLoadingEvents(true);
      try {
        const ev = await apiClient.get("/events?order=latest&limit=4");
        if (!mounted) return;
        const evs = (ev?.events || []).map((e) => {
          let attachments = e.attachments;
          try {
            if (typeof attachments === "string" && attachments.trim()) {
              attachments = JSON.parse(attachments);
            }
          } catch (_) {
            attachments = [];
          }
          const uploadsBase =
            apiClient.baseURL.replace(/\/api$/, "") + "/uploads/";
          return {
            ...e,
            description: e.description || e.summary || "",
            event_url: e.event_url || e.eventUrl || null,
            attachments: Array.isArray(attachments) ? attachments : [],
            thumbnail: e.thumbnail_filename
              ? uploadsBase + encodeURIComponent(e.thumbnail_filename)
              : null,
          };
        });
        setEvents(evs);
      } catch (err) {
        console.error(err);
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-white to-slate-50 hero-gradient">
      {/* Particles background */}
      <Particles
        id="tsparticles"
        className="absolute inset-0 -z-10"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fpsLimit: 60,
          background: { color: "transparent" },
          fullScreen: { enable: false },
          particles: {
            number: { value: 60, density: { enable: true, area: 800 } },
            color: { value: ["#60a5fa", "#818cf8"] },
            shape: { type: "circle" },
            opacity: { value: 0.25 },
            size: { value: { min: 1, max: 3 } },
            links: {
              enable: true,
              color: "#93c5fd",
              opacity: 0.2,
              distance: 140,
            },
            move: { enable: true, speed: 1.2, outModes: { default: "out" } },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              onClick: { enable: true, mode: "push" },
            },
            modes: {
              repulse: { distance: 120, duration: 0.3 },
              push: { quantity: 2 },
            },
          },
          detectRetina: true,
        }}
      />

      {/* Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Left side - Title and description */}
          <div className="md:col-span-2 text-center md:text-left space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
              Sona College of Technology
            </h1>

            <p className="mx-auto md:mx-0 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              Your central hub for achievements, projects, and community engagement.
            </p>

            <div className="pt-2 flex justify-center md:justify-start">
              <button
                onClick={goToQuickActions}
                className="inline-flex items-center gap-2 rounded-xl bg-[#87CEEB] px-6 sm:px-8 py-3 sm:py-4 text-white text-sm sm:text-base font-semibold shadow-lg hover:bg-[#78C5E6] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#87CEEB]/40 transition-all duration-200"
              >
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
              </button>
            </div>
          </div>

          {/* Right side - At a Glance Stats */}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events slider and Leaderboard */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Latest Events
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="md:col-span-2">
            {loadingEvents ? (
              <div className="text-sm text-slate-600 p-8 bg-slate-50 dark:bg-slate-900/30 rounded-xl">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-600 p-8 bg-slate-50 dark:bg-slate-900/30 rounded-xl">No events yet.</div>
            ) : (
              <EventsCarousel events={events} intervalMs={5000} />
            )}
          </div>
          <div className="md:col-span-1">
            <AchievementsLeaderboard limit={10} />
          </div>
        </div>
      </div>

      {/* Recent Projects grid (latest 6) */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Recent Projects
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2"></div>
        </div>
        <ProjectsRecentGrid limit={6} />
      </div>

      {/* Recent Achievements grid (latest 6) */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-12 sm:pb-16">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Recent Achievements
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"></div>
        </div>
        <AchievementsRecentGrid limit={6} />
      </div>
    </div>
  );
}
