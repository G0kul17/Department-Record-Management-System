import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/axiosClient";
import EventsCarousel from "../components/EventsCarousel";
import AchievementsRecentGrid from "../components/AchievementsRecentGrid";
import ProjectsRecentGrid from "../components/ProjectsRecentGrid";
import AchievementsLeaderboard from "../components/AchievementsLeaderboard";
import BlurText from "../components/ui/BlurText";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

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

  // use shared events data
  // events is imported from ../data/events

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
      // Load admin-only faculty stats counts
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
            (Array.isArray(fp?.participation) ? fp.participation.length : 0)
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

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white to-slate-50">
      {/* Hero Section */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          <div className="md:col-span-2 text-center md:text-left space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
              <BlurText text="Sona College of Technology" />
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto md:mx-0">
              Your central hub for achievements, projects, and community engagement.
            </p>

            <div className="pt-4 flex justify-center md:justify-start">
              <Button onClick={goToQuickActions} className="btn btn-primary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
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
                <span>Explore Actions</span>
              </Button>
            </div>
          </div>

          {/* Top Achievers removed from hero - will be displayed with events */}
        </div>
      </div>

      {/* Latest Events Section with Top Achievers on the right */}
      <div id="events" className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Latest Events
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-3"></div>
        </div>
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          <div className="md:col-span-1">
            <EventsCarousel events={events} intervalMs={5000} />
          </div>
          <div className="md:col-span-1">
            <AchievementsLeaderboard />
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div id="projects" className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Recent Projects
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-3"></div>
        </div>
        <ProjectsRecentGrid limit={6} />
      </div>

      {/* Recent Achievements grid (latest 6) */}
      <div id="achievements" className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-8 sm:pb-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Recent Achievements
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></div>
        </div>
        <AchievementsRecentGrid limit={6} />
      </div>

      {/* Analytics & Visualization Section - Admin Only */}
      {user?.role === "admin" && (
        <div id="visualization" className="w-full px-3 sm:px-4 md:px-6 lg:px-12 pb-12 sm:pb-16 bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="py-8 sm:py-12 md:py-16">
            <div className="mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Analytics & Visualization</h1>
              <p className="mt-2 text-slate-600 text-base">Visual overview of activities and trends</p>
            </div>
            <div className="mb-8 h-1 w-24 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full"></div>

          {/* Key Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-10">
            <StatCard label="Projects" value={projCount ?? 0} icon="folder" color="green" onClick={() => nav("/projects/approved")}/>
            <StatCard label="Achievements" value={achCount ?? 0} icon="emoji_events" color="blue" onClick={() => nav("/achievements/approved")}/>
            {user?.role === "admin" && (
              <>
                <StatCard label="Students" value={studentCount ?? 0} icon="school" color="emerald" onClick={() => nav("/admin/students")} />
                <StatCard label="Staff" value={staffCount ?? 0} icon="badge" color="indigo" onClick={() => nav("/admin/staff")}/>
                <StatCard label="Research" value={researchCount ?? 0} icon="science" color="purple" onClick={() => nav("/faculty-research-approved")}/>
                <StatCard label="Consultancy" value={consultancyCount ?? 0} icon="business_center" color="orange" onClick={() => nav("/faculty-consultancy-approved")}/>
                <StatCard label="Participation" value={participationCount ?? 0} icon="groups" color="cyan" onClick={() => nav("/faculty-participation-approved")}/>
                <StatCard label="Events" value={eventCount ?? 0} icon="event" color="rose" onClick={() => nav("/events")}/>
              </>
            )}
          </div>

          {/* Charts - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6 lg:space-y-8">
              {/* Activities Overview - Horizontal Bar Chart */}
              <HorizontalBarChart
                title="All Activities Overview"
                data={[
                  { label: "Projects", value: projCount ?? 0 },
                  { label: "Achievements", value: achCount ?? 0 },
                  ...(user?.role === "admin" ? [
                    { label: "Research", value: researchCount ?? 0 },
                    { label: "Consultancy", value: consultancyCount ?? 0 },
                    { label: "Participation", value: participationCount ?? 0 },
                  ] : []),
                ]}
                color="blue"
              />

              {/* Faculty Activities - Bar Chart */}
              {user?.role === "admin" && (
                <BarChart
                  title="Faculty Activities Breakdown"
                  data={[
                    { label: "Research", value: researchCount ?? 0 },
                    { label: "Consultancy", value: consultancyCount ?? 0 },
                    { label: "Participation", value: participationCount ?? 0 },
                  ]}
                  color="purple"
                />
              )}
            </div>
            
            {/* Right Column */}
            <div className="space-y-6 lg:space-y-8">
              {/* Users Distribution - Pie Chart (Admin only) */}
              <div>
                {user?.role === "admin" ? (
                  <DonutChart
                    title={`Total Users: ${(studentCount ?? 0) + (staffCount ?? 0)}`}
                    data={[
                      { label: "Students", value: studentCount ?? 0 },
                      { label: "Staff", value: staffCount ?? 0 },
                    ]}
                  />
                ) : (
                  <DonutChart
                    title={`Total Items: ${(projCount ?? 0) + (achCount ?? 0)}`}
                    data={[
                      { label: "Projects", value: projCount ?? 0 },
                      { label: "Achievements", value: achCount ?? 0 },
                    ]}
                  />
                )}
              </div>

              {/* Main Activities Comparison - Vertical Bar Chart */}
              {user?.role === "admin" && (
                <VerticalBarChart
                  title="Projects & Achievements Comparison"
                  data={[
                    { label: "Projects", value: projCount ?? 0 },
                    { label: "Achievements", value: achCount ?? 0 },
                  ]}
                  color="emerald"
                />
              )}

              {/* All Activities Distribution - Pie Chart */}
              {user?.role === "admin" && (
                <PieChart
                  title="All Activities Distribution"
                  data={[
                    { label: "Projects", value: projCount ?? 0 },
                    { label: "Achievements", value: achCount ?? 0 },
                    { label: "Research", value: researchCount ?? 0 },
                    { label: "Consultancy", value: consultancyCount ?? 0 },
                    { label: "Participation", value: participationCount ?? 0 },
                  ]}
                />
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>

    {/* Scroll to Top Button */}
    {showScrollTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
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

function StatCard({ label, value, icon, color, onClick }) {
  const colorClasses = {
    blue: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    cyan: "bg-cyan-100 text-cyan-600",
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
    rose: "bg-rose-100 text-rose-600",
  };

  const iconColorClasses = {
    blue: "text-primary",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    cyan: "text-cyan-600",
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    rose: "text-rose-600",
  };

  return (
    <button onClick={onClick} className="rounded-xl border border-slate-200 p-5 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-left">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className={`material-icons text-4xl ${iconColorClasses[color]}`}>
          {icon}
        </span>
      </div>
    </button>
  );
}

function HorizontalBarChart({ title, data, color }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#3b82f6", "#06b6d4", "#14b8a6", "#10b981", "#0ea5e9"];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-md hover:shadow-lg transition-all duration-200">
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="font-bold text-slate-900">{item.value}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-lg h-8 overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: colors[idx],
                }}
              >
                <span className="text-white text-xs font-bold">
                  {item.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ title, data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ["#3b82f6", "#10b981"];
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-md hover:shadow-lg transition-all duration-200">
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">{title}</h3>
      <div className="flex items-center justify-center gap-6">
        <svg width="110" height="110" viewBox="0 0 110 110">
          {total > 0 ? (
            data.map((item, idx) => {
              const percent = (item.value / total) * 100;
              const startAngle = (cumulativePercent / 100) * 360;
              const endAngle = startAngle + (percent / 100) * 360;
              cumulativePercent += percent;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 55 + 40 * Math.cos(startRad);
              const y1 = 55 + 40 * Math.sin(startRad);
              const x2 = 55 + 40 * Math.cos(endRad);
              const y2 = 55 + 40 * Math.sin(endRad);
              const largeArc = percent > 50 ? 1 : 0;

              return (
                <g key={idx}>
                  <path
                    d={`M 55 55 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[idx]}
                    stroke="white"
                    strokeWidth="3"
                  />
                </g>
              );
            })
          ) : (
            <circle cx="55" cy="55" r="40" fill="#e2e8f0" stroke="white" strokeWidth="3" />
          )}
          <circle cx="55" cy="55" r="28" fill="white" />
          <text
            x="55"
            y="60"
            textAnchor="middle"
            className="text-sm font-bold"
            fill="#374151"
          >
            {total}
          </text>
        </svg>
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[idx] }}
              ></div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {item.label}
                </p>
                <p className="text-xs text-slate-600">
                  {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ title, data, color }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-md hover:shadow-lg transition-all duration-200">
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-5">{title}</h3>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-800">
                {item.value}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: "#a78bfa" }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalBarChart({ title, data, color }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#10b981", "#06b6d4"];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-200">
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">{title}</h3>
      <div className="flex items-end justify-center gap-6 h-40">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-slate-900 mb-1">
                {item.value}
              </span>
              <div
                className="rounded-t-lg transition-all duration-500"
                style={{
                  width: "50px",
                  height: `${(item.value / maxValue) * 120}px`,
                  backgroundColor: colors[idx],
                }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-slate-700 text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChart({ title, data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = [
    "#3b82f6",
    "#06b6d4",
    "#14b8a6",
    "#10b981",
    "#0ea5e9",
  ];
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-md hover:shadow-lg transition-all duration-200">
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-5">{title}</h3>
      <div className="flex items-center justify-center gap-8">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {total > 0 ? (
            data.map((item, idx) => {
              const percent = (item.value / total) * 100;
              const startAngle = (cumulativePercent / 100) * 360;
              const endAngle = startAngle + (percent / 100) * 360;
              cumulativePercent += percent;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 70 + 55 * Math.cos(startRad);
              const y1 = 70 + 55 * Math.sin(startRad);
              const x2 = 70 + 55 * Math.cos(endRad);
              const y2 = 70 + 55 * Math.sin(endRad);
              const largeArc = percent > 50 ? 1 : 0;

              return (
                <path
                  key={idx}
                  d={`M 70 70 L ${x1} ${y1} A 55 55 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[idx]}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })
          ) : (
            <circle cx="70" cy="70" r="55" fill="#e2e8f0" stroke="white" strokeWidth="2" />
          )}
        </svg>
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[idx] }}
              ></div>
              <span className="text-sm text-slate-600">
                {item.label}: {item.value} (
                {((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
