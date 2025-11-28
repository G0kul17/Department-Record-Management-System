import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/axiosClient";
import events from "../../data/events";

export default function StudentDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [evIdx, setEvIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);

  // use shared events data
  // events is imported from ../data/events

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  const goToQuickActions = () => {
    if (!user) return nav("/login");
    return nav("/quick-actions");
  };

  const prev = () => setEvIdx((i) => (i === 0 ? events.length - 1 : i - 1));
  const next = () => setEvIdx((i) => (i + 1) % events.length);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => next(), 5000);
    return () => clearInterval(id);
  }, [paused]);

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

        <div
          className="relative overflow-hidden rounded-xl shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-indigo-100 to-slate-200 dark:from-slate-800/70 dark:to-slate-900/70 dark:ring-white/10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {events.map((ev, i) => (
            <div
              key={ev.title}
              className={`transition-opacity duration-300 ${
                i === evIdx
                  ? "opacity-100"
                  : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 pb-16">
                <div className="sm:col-span-2 text-left">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    {ev.summary}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm text-slate-500">
                    {new Date(ev.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {ev.location}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Bottom corner arrows */}
          <button
            onClick={prev}
            aria-label="Previous event"
            className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/90 text-slate-700 hover:bg-white shadow-sm backdrop-blur-sm dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next event"
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/90 text-slate-700 hover:bg-white shadow-sm backdrop-blur-sm dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="mt-3 flex justify-center gap-2">
          {events.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to event ${i + 1}`}
              onClick={() => setEvIdx(i)}
              className={`h-2.5 w-2.5 rounded-full ${
                i === evIdx ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">
          At a Glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-cyan-200 to-blue-300 dark:from-cyan-900/50 dark:to-blue-900/60 dark:ring-white/10">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Projects
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {projCount === null ? "—" : projCount}
              </div>
            </div>
          </div>
          <div className="rounded-xl p-6 shadow-lg ring-1 ring-inset ring-slate-300/80 bg-gradient-to-br from-fuchsia-200 to-rose-300 dark:from-fuchsia-900/50 dark:to-rose-900/60 dark:ring-white/10">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Achievements
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {achCount === null ? "—" : achCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
