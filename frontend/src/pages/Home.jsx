import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/axiosClient";
import EventsCarousel from "../components/EventsCarousel";
import AchievementsRecentGrid from "../components/AchievementsRecentGrid";
import ProjectsRecentGrid from "../components/ProjectsRecentGrid";
import AchievementsLeaderboard from "../components/AchievementsLeaderboard";
import AdminInteractiveDashboard from "../components/AdminInteractiveDashboard";
import BlurText from "../components/ui/BlurText";
import Button from "../components/ui/Button";
import {
  FaFolder,
  FaTrophy,
  FaUsers,
  FaFlask,
  FaBriefcase,
  FaUserGraduate,
  FaUserTie,
  FaCalendarAlt,
  FaChevronRight,
  FaCode,
  FaGraduationCap,
  FaBookReader,
  FaAward,
  FaLightbulb,
  FaBolt,
} from "react-icons/fa";

export default function Home({ hideAtAGlance = false }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [staffCount, setStaffCount] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [researchCount, setResearchCount] = useState(null);
  const [consultancyCount, setConsultancyCount] = useState(null);
  const [participationCount, setParticipationCount] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [staffProjCount, setStaffProjCount] = useState(null);
  const [staffAchCount, setStaffAchCount] = useState(null);
  const [staffPartCount, setStaffPartCount] = useState(null);
  const [staffResCount, setStaffResCount] = useState(null);
  const [staffConsCount, setStaffConsCount] = useState(null);

  const goToQuickActions = () => {
    if (!user) return nav("/login");
    if (user.role === "admin") return nav("/admin/quick-actions");
    return nav("/quick-actions");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [p, a] = await Promise.allSettled([
        apiClient.get("/projects/count?verified=true"),
        apiClient.get("/achievements/count?verified=true"),
      ]);
      if (!mounted) return;
      setProjCount(p.status === "fulfilled" ? (p.value?.count ?? 0) : 0);
      setAchCount(a.status === "fulfilled" ? (a.value?.count ?? 0) : 0);

      try {
        const ev = await apiClient.get("/events?order=latest&limit=4");
        const evs = ev?.events || [];
        if (mounted) setEvents(evs);
      } catch (_) {
        if (mounted) setEvents([]);
      }
    })();

    if (user?.role === "staff") {
      (async () => {
        try {
          const [p, a, part, res, cons] = await Promise.allSettled([
            apiClient.get("/projects/count?verified=true"),
            apiClient.get("/achievements/count?verified=true"),
            apiClient.get("/faculty-participations/count"),
            apiClient.get("/faculty-research/count"),
            apiClient.get("/faculty-consultancy/count"),
          ]);
          if (!mounted) return;
          setStaffProjCount(
            p.status === "fulfilled" ? (p.value?.count ?? 0) : 0,
          );
          setStaffAchCount(
            a.status === "fulfilled" ? (a.value?.count ?? 0) : 0,
          );
          setStaffPartCount(
            part.status === "fulfilled" ? (part.value?.count ?? 0) : 0,
          );
          setStaffResCount(
            res.status === "fulfilled" ? (res.value?.count ?? 0) : 0,
          );
          setStaffConsCount(
            cons.status === "fulfilled" ? (cons.value?.count ?? 0) : 0,
          );
        } catch (_) {
          if (!mounted) return;
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [user?.role]);

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
      try {
        const [fr, fc, fp] = await Promise.all([
          apiClient.get("/faculty-research"),
          apiClient.get("/faculty-consultancy"),
          apiClient.get("/faculty-participations"),
        ]);
        if (!mounted) return;
        setResearchCount(Array.isArray(fr?.data) ? fr.data.length : 0);
        setConsultancyCount(Array.isArray(fc?.data) ? fc.data.length : 0);
        setParticipationCount(
          fp?.total ||
            (Array.isArray(fp?.participation) ? fp.participation.length : 0),
        );
      } catch (e) {
        if (!mounted) return;
        setResearchCount(0);
        setConsultancyCount(0);
        setParticipationCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white to-slate-50">
        {/* Hero Section with Glowing Wavy Lines & Modern Aesthetics */}
        <div className="relative w-full overflow-hidden bg-[#04081e] px-4 sm:px-6 lg:px-12 py-12 sm:py-16 md:py-22 text-white shadow-2xl">
          {/* Ambient Top Left Glow & Wavy Neon Lines Background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
            {/* Top-Left Ambient Blue Glow */}
            <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-blue-600/20 blur-[120px]" />
            <div className="absolute top-1/4 left-1/3 h-[300px] w-[300px] rounded-full bg-purple-600/15 blur-[100px]" />

            {/* Glowing Wave Mesh Lines Across Bottom Right */}
            <svg
              className="absolute bottom-0 right-0 w-full lg:w-4/5 h-64 sm:h-80 md:h-96 opacity-75"
              viewBox="0 0 1200 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="neonWaveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
                  <stop offset="40%" stopColor="#6366f1" stopOpacity="0.5" />
                  <stop offset="80%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="neonWaveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity="0.75" />
                </linearGradient>
              </defs>

              {/* Dynamic Wave Lines */}
              <path
                d="M0,340 C300,290 600,390 900,310 C1050,270 1150,335 1200,355"
                stroke="url(#neonWaveGrad1)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M0,360 C350,320 650,400 950,290 C1100,230 1180,315 1200,325"
                stroke="url(#neonWaveGrad1)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M0,375 C400,335 700,410 1000,270 C1120,210 1190,290 1200,300"
                stroke="url(#neonWaveGrad2)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M0,390 C450,350 750,380 1050,245 C1140,185 1195,255 1200,265"
                stroke="url(#neonWaveGrad2)"
                strokeWidth="1.5"
                fill="none"
              />

              {/* Grid Array of Wave Curves */}
              {[...Array(14)].map((_, i) => (
                <path
                  key={i}
                  d={`M0,${310 + i * 6} C${250 + i * 15},${280 - i * 4} ${580 + i * 20},${375 - i * 8} ${880 + i * 15},${275 - i * 10} C${1040 + i * 10},${200 - i * 10} 1175,${280 - i * 6} 1200,${295 - i * 6}`}
                  stroke="url(#neonWaveGrad1)"
                  strokeWidth={0.8 + i * 0.1}
                  strokeOpacity={0.25 + i * 0.04}
                  fill="none"
                />
              ))}
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headline & Action */}
            <div className={`space-y-5 flex flex-col justify-center ${user?.role === "admin" ? "lg:col-span-12 text-center md:text-left max-w-3xl" : "lg:col-span-6 xl:col-span-6 text-center md:text-left"}`}>
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-blue-300 tracking-wide self-center md:self-start shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                Department Records Management System
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Sona College of{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Technology
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto md:mx-0 font-medium leading-relaxed">
                Your central hub for academic records, achievements, projects and events.
              </p>

              {/* Action Button */}
              <div className="pt-2 flex justify-center md:justify-start">
                <button
                  type="button"
                  onClick={goToQuickActions}
                  className="inline-flex items-center gap-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-7 py-3.5 text-sm sm:text-base shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_35px_rgba(37,99,235,0.75)] hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <span>Explore Records</span>
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: At a Glance Dashboard Cards (Staff and Student Only) */}
            {user && user.role !== "admin" && !hideAtAGlance && (
              <div className="lg:col-span-6 xl:col-span-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span>At a Glance Overview</span>
                    </h2>
                    <span className="rounded-full bg-blue-500/10 border border-blue-400/20 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-300">
                      Live Stats
                    </span>
                  </div>

                  <div
                    className={`grid gap-3 sm:gap-4 ${(user?.role === "staff" || user?.role === "admin") ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
                  >
                    {/* Projects tile */}
                    <button
                      type="button"
                      onClick={() => nav("/projects/approved")}
                      className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-blue-400/80 hover:shadow-md hover:shadow-blue-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                          <FaFolder className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                          Projects
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
                        {user?.role === "staff"
                          ? staffProjCount === null ? "—" : staffProjCount
                          : projCount === null ? "—" : projCount}
                      </div>
                    </button>

                    {/* Achievements tile */}
                    <button
                      type="button"
                      onClick={() => nav("/achievements/approved")}
                      className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-amber-400/80 hover:shadow-md hover:shadow-amber-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                          <FaTrophy className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                          Achievements
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
                        {user?.role === "staff" ? (staffAchCount === null ? "—" : staffAchCount) : (achCount === null ? "—" : achCount)}
                      </div>
                    </button>

                    {/* Admin-only tiles */}
                    {user?.role === "admin" && (
                      <>
                        <button
                          type="button"
                          onClick={() => nav("/admin/students")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-emerald-400/80 hover:shadow-md hover:shadow-emerald-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaUserGraduate className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Students
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">
                            {studentCount === null ? "—" : studentCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/admin/staff")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-indigo-400/80 hover:shadow-md hover:shadow-indigo-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaUserTie className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Staff
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">
                            {staffCount === null ? "—" : staffCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/events")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-rose-400/80 hover:shadow-md hover:shadow-rose-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaCalendarAlt className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Events
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-rose-400 transition-colors">
                            {eventCount === null ? "—" : eventCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/faculty-research-approved")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-orange-400/80 hover:shadow-md hover:shadow-orange-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaFlask className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Research
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-orange-400 transition-colors">
                            {researchCount === null ? "—" : researchCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/faculty-consultancy-approved")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-cyan-400/80 hover:shadow-md hover:shadow-cyan-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaBriefcase className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Consultancy
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-cyan-400 transition-colors">
                            {consultancyCount === null ? "—" : consultancyCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/faculty-participation-approved")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-purple-400/80 hover:shadow-md hover:shadow-purple-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaUsers className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Participation
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-purple-400 transition-colors">
                            {participationCount === null ? "—" : participationCount}
                          </div>
                        </button>
                      </>
                    )}

                    {/* Staff-only tiles */}
                    {user?.role === "staff" && (
                      <>
                        <button
                          type="button"
                          onClick={() => nav("/faculty-participation-approved")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-purple-400/80 hover:shadow-md hover:shadow-purple-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaUsers className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Participation
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-purple-400 transition-colors">
                            {staffPartCount === null ? "—" : staffPartCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/faculty-research-approved")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-orange-400/80 hover:shadow-md hover:shadow-orange-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaFlask className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Research
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-orange-400 transition-colors">
                            {staffResCount === null ? "—" : staffResCount}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => nav("/faculty-consultancy-approved")}
                          className="group rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-800 transition-all duration-200 text-left border border-slate-700/80 hover:border-cyan-400/80 hover:shadow-md hover:shadow-cyan-500/10 flex flex-col justify-between cursor-pointer space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                              <FaBriefcase className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                              Consultancy
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-cyan-400 transition-colors">
                            {staffConsCount === null ? "—" : staffConsCount}
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Latest Events & Top Achievers Side-by-Side Section */}
        <div
          id="events"
          className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-12 pb-8 sm:pb-10"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FaCalendarAlt className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-slate-800">
                Latest Events & Announcements
              </h2>
            </div>
            <a
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition"
            >
              View all events
              <FaChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-stretch">
            <div className="md:col-span-1 w-full flex flex-col">
              <EventsCarousel events={events} intervalMs={5000} />
            </div>
            <div className="md:col-span-1 w-full flex flex-col">
              <AchievementsLeaderboard />
            </div>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div
          id="projects"
          className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <FaFolder className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-slate-800">
                Recent Projects
              </h2>
            </div>
            <a
              href="/projects/approved"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              View all projects
              <FaChevronRight className="w-3 h-3" />
            </a>
          </div>
          <ProjectsRecentGrid limit={6} />
        </div>

        {/* Recent Achievements Section */}
        <div
          id="achievements"
          className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-12 sm:pb-16"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <FaTrophy className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-slate-800">
                Recent Achievements
              </h2>
            </div>
            <a
              href="/achievements/approved"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              View all achievements
              <FaChevronRight className="w-3 h-3" />
            </a>
          </div>
          <AchievementsRecentGrid limit={6} />
        </div>

        {/* Analytics & Visualization Section - Admin Only */}
        {user?.role === "admin" && (
          <div id="visualization" className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-12">
            <AdminInteractiveDashboard
              projCount={projCount ?? 0}
              achCount={achCount ?? 0}
              studentCount={studentCount ?? 0}
              staffCount={staffCount ?? 0}
              eventCount={eventCount ?? 0}
              researchCount={researchCount ?? 0}
              consultancyCount={consultancyCount ?? 0}
              participationCount={participationCount ?? 0}
              nav={nav}
            />
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 cursor-pointer"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </>
  );
}
