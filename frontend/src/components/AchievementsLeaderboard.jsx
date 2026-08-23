import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";
import {
  FaTrophy,
  FaCrown,
  FaStar,
  FaRocket,
  FaFlask,
  FaBriefcase,
  FaUsers,
  FaAward,
} from "react-icons/fa";

const CATEGORY_OPTIONS = [
  { key: "achievements", label: "Achievements", short: "Achieve", icon: FaTrophy },
  { key: "projects", label: "Projects", short: "Projects", icon: FaRocket },
  { key: "faculty_research", label: "Faculty Research", short: "Research", icon: FaFlask },
  { key: "faculty_consultancy", label: "Faculty Consultancy", short: "Consult", icon: FaBriefcase },
  { key: "faculty_participation", label: "Faculty Participation", short: "Particip", icon: FaUsers },
];

export default function AchievementsLeaderboard({ limit = 10 }) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("achievements");

  const userRole = (user?.role || "").toLowerCase();
  const canViewFacultyBoards = userRole === "staff" || userRole === "admin";

  // Students see student categories; staff/admin see all.
  const availableCategories = useMemo(() => {
    if (!canViewFacultyBoards) {
      return CATEGORY_OPTIONS.filter(
        (opt) => opt.key === "achievements" || opt.key === "projects"
      );
    }
    return CATEGORY_OPTIONS;
  }, [canViewFacultyBoards]);

  // Reset category if not available
  useEffect(() => {
    const isValidCategory = availableCategories.some(
      (opt) => opt.key === category
    );
    if (!isValidCategory) {
      setCategory("achievements");
    }
  }, [category, availableCategories]);

  const title = useMemo(() => {
    switch (category) {
      case "projects":
        return "Top Project Submitters";
      case "faculty_research":
        return "Top Faculty Researchers";
      case "faculty_consultancy":
        return "Top Faculty Consultants";
      case "faculty_participation":
        return "Top Faculty Participants";
      default:
        return "Top Student Achievers";
    }
  }, [category]);

  const subtitle = useMemo(() => {
    switch (category) {
      case "projects":
        return "Most approved project entries";
      case "faculty_research":
        return "Most faculty research submissions";
      case "faculty_consultancy":
        return "Most consultancy projects";
      case "faculty_participation":
        return "Most faculty participations";
      default:
        return "Most approved achievements";
    }
  }, [category]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const roleParam = category.startsWith("faculty_") ? "staff" : "student";
        const data = await apiClient.get(
          `/achievements/leaderboard?type=${category}&limit=${limit}&role=${roleParam}`
        );
        if (!mounted) return;
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error(err);
        if (mounted) setLeaderboard([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit, category]);

  // Organize top 3 for the Podium view
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const restList = leaderboard.slice(3);

  return (
    <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-[#0a0f28] via-[#0f172a] to-[#040817] p-4 sm:p-5 shadow-2xl overflow-hidden w-full h-full flex flex-col justify-between space-y-4">
      {/* Background Glowing Ambient Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
        <div className="absolute -top-24 right-10 h-48 w-48 rounded-full bg-amber-500/15 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-indigo-600/20 blur-2xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 flex-shrink-0">
              <FaTrophy className="w-4 h-4 text-slate-950" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  {title}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-400/30 px-2 py-0.2 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                  <FaStar className="w-2 h-2 text-amber-400" />
                  Hall of Fame
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Category Selector Tabs */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {availableCategories.map((opt) => {
              const Icon = opt.icon;
              const isActive = category === opt.key;
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setCategory(opt.key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30 border border-blue-400/40"
                      : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
                  <span className="sm:hidden">{opt.short}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400 mx-auto" />
            <p className="text-[11px] font-bold text-slate-400">Loading rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center space-y-1.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <FaAward className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400">No verified records found for this category yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Compact Visual Podium Stage */}
            <div
              className={`grid gap-2.5 pt-2 items-end ${
                top3
                  ? "grid-cols-3"
                  : top2
                  ? "grid-cols-2 max-w-xs mx-auto"
                  : "grid-cols-1 max-w-[200px] mx-auto"
              }`}
            >
              {/* #2 Rank Card (Silver - Left on 3-col layout) */}
              {top2 && (
                <div className={`${top3 ? "order-2 sm:order-1" : "order-2"} min-w-0`}>
                  <div className="relative rounded-2xl border border-slate-400/30 bg-gradient-to-b from-slate-800/80 via-slate-900 to-slate-950 p-2 sm:p-2.5 shadow-md text-center space-y-1.5 sm:space-y-2 hover:border-slate-300/60 transition-all duration-200 group min-w-0">
                    <div className="inline-flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 text-[9px] sm:text-[10px] font-black shadow-xs mx-auto">
                      #2
                    </div>
                    <div className="relative mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-slate-800 border border-slate-300/50 flex items-center justify-center text-white text-xs sm:text-sm font-extrabold shadow-xs group-hover:scale-105 transition-transform">
                      {(top2.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate px-0.5">
                        {top2.name || "Unknown"}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5 px-0.5">
                        {top2.email}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-400/30 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-slate-200 shadow-xs">
                        <FaStar className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-slate-300" />
                        {top2.achievement_count}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* #1 Rank Card (Gold Crown - Center - Highest Elevation) */}
              {top1 && (
                <div className={`${top3 ? "order-1 sm:order-2 -mt-2 sm:-mt-3" : "order-1"} min-w-0`}>
                  <div className="relative rounded-2xl border-2 border-amber-400/70 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 p-2 sm:p-3 shadow-[0_0_20px_rgba(245,158,11,0.2)] text-center space-y-1.5 sm:space-y-2 hover:border-amber-300 transition-all duration-200 group min-w-0">
                    {/* Floating Gold Crown Icon */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black flex items-center gap-1 shadow-md">
                      <FaCrown className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-slate-950" />
                      1st
                    </div>

                    <div className="relative mx-auto mt-1 sm:mt-1.5 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                      <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center text-amber-300 text-sm sm:text-base font-black">
                        {(top1.name || "U")[0].toUpperCase()}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-xs font-black text-amber-300 truncate px-0.5">
                        {top1.name || "Unknown"}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-300 truncate mt-0.5 font-medium px-0.5">
                        {top1.email}
                      </p>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/50 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black text-amber-300 shadow-xs">
                        <FaTrophy className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-amber-400" />
                        {top1.achievement_count}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* #3 Rank Card (Bronze - Right on desktop) */}
              {top3 && (
                <div className="order-3 sm:order-3 min-w-0">
                  <div className="relative rounded-2xl border border-amber-700/40 bg-gradient-to-b from-amber-800/20 via-slate-900 to-slate-950 p-2 sm:p-2.5 shadow-md text-center space-y-1.5 sm:space-y-2 hover:border-amber-600/60 transition-all duration-200 group min-w-0">
                    <div className="inline-flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white text-[9px] sm:text-[10px] font-black shadow-xs mx-auto">
                      #3
                    </div>
                    <div className="relative mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-slate-800 border border-amber-700/50 flex items-center justify-center text-amber-400 text-xs sm:text-sm font-extrabold shadow-xs group-hover:scale-105 transition-transform">
                      {(top3.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate px-0.5">
                        {top3.name || "Unknown"}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5 px-0.5">
                        {top3.email}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-amber-700/30 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-amber-400 shadow-xs">
                        <FaStar className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-amber-500" />
                        {top3.achievement_count}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ranks 4+ List Section */}
            {restList.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  Other Achievers
                </h4>
                <div className="space-y-1.5">
                  {restList.map((student, index) => {
                    const rankNum = index + 4;
                    return (
                      <div
                        key={`${student.id}-${index}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800/80 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-[10px] font-black flex-shrink-0">
                            #{rankNum}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">
                              {student.name || "Unknown"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {student.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 text-[10px] font-extrabold text-blue-300">
                            <FaStar className="w-2 h-2 text-blue-400" />
                            {student.achievement_count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
