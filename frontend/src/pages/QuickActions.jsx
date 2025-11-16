import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Card = ({ title, desc, color, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl p-6 text-left text-white shadow-lg transition transform hover:-translate-y-0.5 hover:shadow-xl`}
    style={{ backgroundColor: color }}
  >
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl bg-white" />
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
        {icon}
      </span>
      <h3 className="text-2xl font-bold drop-shadow-sm">{title}</h3>
    </div>
    <p className="mt-3 text-white/90 font-medium">{desc}</p>
  </button>
);

export default function QuickActions() {
  const nav = useNavigate();
  const { user } = useAuth();
  const goTo = (key) => () => {
    if (key === "achievements") return nav("/achievements");
    if (key === "projects") return nav("/projects/upload");
    if (key === "community") return nav("/student?tab=community");
    if (key === "events") return nav("/student?tab=events");
    if (key === "alumni") return nav("/student?tab=alumni");
    return nav("/");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 hero-gradient">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
            Quick Actions
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Get started with your most common tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card
            title="Add Achievement"
            desc="Showcase your accomplishments and milestones."
            color="#3b82f6"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <path
                  d="M20 6l-11 11-5-5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            onClick={goTo("achievements")}
          />
          <Card
            title="Upload Project"
            desc="Share your latest projects with the department."
            color="#22c55e"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="14"
                  rx="2"
                  strokeWidth="2"
                />
                <path d="M3 10h18" strokeWidth="2" />
              </svg>
            }
            onClick={goTo("projects")}
          />
          <Card
            title="Post Update"
            desc="Share news or updates with the community."
            color="#a855f7"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <path
                  d="M4 6h16M4 12h10M4 18h8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            onClick={goTo("community")}
          />
          <Card
            title="Join Discussion"
            desc="Engage in conversations on the community forums."
            color="#f97316"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <path
                  d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            }
            onClick={goTo("community")}
          />
          <Card
            title="View Events"
            desc="Stay updated on upcoming department events."
            color="#6366f1"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="2"
                />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            onClick={goTo("events")}
          />
          <Card
            title="Connect with Alumni"
            desc="Network with graduates and build connections."
            color="#ec4899"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white"
              >
                <path
                  d="M7 20h10M12 14a5 5 0 100-10 5 5 0 000 10z"
                  strokeWidth="2"
                />
                <path d="M2 20a10 10 0 0120 0" strokeWidth="2" />
              </svg>
            }
            onClick={goTo("alumni")}
          />
        </div>
      </div>
    </div>
  );
}
