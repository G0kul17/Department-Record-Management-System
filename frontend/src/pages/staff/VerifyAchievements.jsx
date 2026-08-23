import React from "react";
import { useNavigate } from "react-router-dom";
import AchievementsManagement from "./AchievementsManagement";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";

export default function VerifyAchievements() {
  const nav = useNavigate();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaCheckCircle className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Verify Achievements
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Review, verify, or return feedback on submitted student achievement records.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs w-full">
          <AchievementsManagement />
        </div>
      </div>
    </div>
  );
}
