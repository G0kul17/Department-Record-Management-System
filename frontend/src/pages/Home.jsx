import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useAuth } from "../hooks/useAuth";
// Fetch events from API instead of static data
import apiClient from "../api/axiosClient";
import EventsCarousel from "../components/EventsCarousel";

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [staffCount, setStaffCount] = useState(null);
  const [eventCount, setEventCount] = useState(null);

  // use shared events data
  // events is imported from ../data/events

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

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
    })();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

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

      {/* Events carousel (latest 4 events) */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Events
          </h2>
        </div>
        <div className="mt-2">
          <EventsCarousel events={events} intervalMs={5000} />
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">
          At a Glance
        </h2>
        <div
          className={`grid gap-4 ${
            user?.role === "admin"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          <button
            onClick={() => nav("/projects/approved")}
            className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-cyan-200 to-blue-300 dark:from-cyan-900/50 dark:to-blue-900/60 dark:ring-white/10 text-left"
          >
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Projects
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {projCount === null ? "—" : projCount}
              </div>
            </div>
          </button>
          <button
            onClick={() => nav("/achievements/approved")}
            className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-fuchsia-200 to-rose-300 dark:from-fuchsia-900/50 dark:to-rose-900/60 dark:ring-white/10 text-left"
          >
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Achievements
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {achCount === null ? "—" : achCount}
              </div>
            </div>
          </button>
          {user?.role === "admin" && (
            <>
              <button
                onClick={() => nav("/admin/students")}
                className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-emerald-900/50 dark:to-teal-900/60 dark:ring-white/10 text-left"
              >
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Students
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {studentCount === null ? "—" : studentCount}
                </div>
              </button>
              <button
                onClick={() => nav("/admin/staff")}
                className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-indigo-200 to-violet-300 dark:from-indigo-900/50 dark:to-violet-900/60 dark:ring-white/10 text-left"
              >
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Staff
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {staffCount === null ? "—" : staffCount}
                </div>
              </button>
              <div className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-900/50 dark:to-orange-900/60 dark:ring-white/10">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Events
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {eventCount === null ? "—" : eventCount}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
