import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackButton() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  // Don't show back button on auth or root landing pages
  const hidePaths = [
    "/",
    "/login",
    "/verify-otp",
    "/register-student",
    "/register-staff",
    "/forgot",
    "/reset",
    "/forgot-password",
    "/reset-password",
  ];
  if (hidePaths.includes(pathname)) return null;

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="max-w-[980px]">
        <button
          onClick={() => nav(-1)}
          title="Go back"
          aria-label="Go back"
          className="inline-flex items-center gap-3 rounded-full bg-white/95 dark:bg-slate-800/80 border border-sky-300 dark:border-sky-600 px-3 py-2 shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-900/80 border border-sky-200 dark:border-sky-600 text-slate-800 dark:text-slate-100 drop-shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="hidden md:inline-block text-sm font-medium text-slate-800 dark:text-slate-100">
            Back
          </span>
        </button>
      </div>
    </div>
  );
}
