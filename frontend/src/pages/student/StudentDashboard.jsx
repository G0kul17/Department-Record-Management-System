import React, { useCallback, useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import EventsCarousel from "../../components/EventsCarousel";

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
          return {
            ...e,
            description: e.description || e.summary || "",
            event_url: e.event_url || e.eventUrl || null,
            attachments: Array.isArray(attachments) ? attachments : [],
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
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Sona College of Technology
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Your central hub for achievements, projects, and community engagement.
        </p>

        <div className="mt-10">
          <button
            onClick={goToQuickActions}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {/* Inline SVG rocket icon */}
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

      {/* Events slider */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Events
          </h2>
        </div>

        {loadingEvents ? (
          <div className="text-sm text-slate-600 p-6">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-slate-600 p-6">No events yet.</div>
        ) : (
          <EventsCarousel events={events} intervalMs={5000} />
        )}
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">
          At a Glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => nav('/projects/approved')} className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-cyan-200 to-blue-300 dark:from-cyan-900/50 dark:to-blue-900/60 dark:ring-white/10 text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Projects
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {projCount === null ? "—" : projCount}
              </div>
            </div>
          </button>
          <button onClick={() => nav('/achievements/approved')} className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-fuchsia-200 to-rose-300 dark:from-fuchsia-900/50 dark:to-rose-900/60 dark:ring-white/10 text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Achievements
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {achCount === null ? "—" : achCount}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
