import React, { useCallback, useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import EventsCarousel from "../../components/EventsCarousel";
import AchievementsRecentGrid from "../../components/AchievementsRecentGrid";
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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-10 md:pt-12 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
          {/* Left side - Title and description */}
          <div className="md:col-span-2 text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
              Sona College of Technology
            </h1>

            <p className="mx-auto mt-3 sm:mt-4 max-w-3xl text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300">
              Your central hub for achievements, projects, and community engagement.
            </p>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <button
                onClick={goToQuickActions}
                className="inline-flex items-center gap-2 rounded-xl bg-[#87CEEB] px-4 sm:px-6 py-2 sm:py-3 text-white text-sm sm:text-base shadow-md hover:bg-[#78C5E6] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#87CEEB]/40 transition-all"
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
                <span className="font-semibold">Explore Actions</span>
              </button>
            </div>
          </div>

          {/* Right side - At a Glance Stats */}
          <div className="md:col-span-1">
            <div className="rounded-lg sm:rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-3 sm:p-5 shadow-lg">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 mb-2 sm:mb-3">
                At a Glance
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => nav("/projects/approved")}
                  className="rounded-lg p-2 sm:p-4 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-cyan-500 hover:border-cyan-400"
                >
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Projects</div>
                  <div className="mt-1 text-lg sm:text-2xl font-extrabold text-slate-100">
                    {projCount === null ? "—" : projCount}
                  </div>
                </button>
                <button
                  onClick={() => nav("/achievements/approved")}
                  className="rounded-lg p-2 sm:p-4 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left border-2 border-fuchsia-500 hover:border-fuchsia-400"
                >
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Achievements
                  </div>
                  <div className="mt-1 text-lg sm:text-2xl font-extrabold text-slate-100">
                    {achCount === null ? "—" : achCount}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events slider and Leaderboard */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-6 sm:pb-8">
        <div className="mb-2 sm:mb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
            Events
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2">
            {loadingEvents ? (
              <div className="text-sm text-slate-600 p-4 sm:p-6">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-600 p-4 sm:p-6">No events yet.</div>
            ) : (
              <EventsCarousel events={events} intervalMs={5000} />
            )}
          </div>
          <div className="md:col-span-1">
            <AchievementsLeaderboard limit={10} />
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
