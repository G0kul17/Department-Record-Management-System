import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";

const CATEGORY_OPTIONS = [
  { key: "achievements", label: "Achievements" },
  { key: "projects", label: "Projects" },
  { key: "faculty_research", label: "Faculty Research" },
  { key: "faculty_consultancy", label: "Faculty Consultancy" },
  { key: "faculty_participation", label: "Faculty Participation" },
];

export default function AchievementsLeaderboard({ limit = 10 }) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("achievements");

  const title = useMemo(() => {
    switch (category) {
      case "projects":
        return "Top Project Submitters";
      case "faculty_research":
        return "Top Faculty Research";
      case "faculty_consultancy":
        return "Top Faculty Consultancy";
      case "faculty_participation":
        return "Top Faculty Participation";
      default:
        return "Top Achievers";
    }
  }, [category]);

  const subtitle = useMemo(() => {
    switch (category) {
      case "projects":
        return "Most approved projects";
      case "faculty_research":
        return "Most faculty research submissions";
      case "faculty_consultancy":
        return "Most faculty consultancy submissions";
      case "faculty_participation":
        return "Most faculty participation submissions";
      default:
        return "Most approved achievements";
    }
  }, [category]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(
          `/achievements/leaderboard?type=${category}&limit=${limit}`
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

  return (
    <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h3 className="text-lg font-bold text-slate-100">
          {title}
        </h3>
      </div>
      <p className="text-xs text-slate-300 mb-4">
        {subtitle}
      </p>

      {user?.role === "admin" && (
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setCategory(opt.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
                category === opt.key
                  ? "bg-[#87CEEB] text-slate-900 border-[#87CEEB]"
                  : "bg-slate-800 text-slate-200 border-slate-600 hover:border-slate-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      
      {loading ? (
        <div className="text-sm text-slate-300 py-4">
          Loading...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-sm text-slate-300 py-4">
          No records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((student, index) => (
            <div
              key={`${student.id}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {index === 0 && (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-sm shadow-lg">
                      1
                    </div>
                  )}
                  {index === 1 && (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white font-bold text-sm shadow-lg">
                      2
                    </div>
                  )}
                  {index === 2 && (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-lg">
                      3
                    </div>
                  )}
                  {index > 2 && (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-600 text-slate-200 font-semibold text-sm">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 text-sm truncate">
                    {student.name || "Unknown"}
                  </div>
                  <div className="text-xs text-slate-300 truncate">
                    {student.email}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20">
                  <svg
                    className="w-3 h-3 text-blue-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-bold text-blue-300">
                    {student.achievement_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
