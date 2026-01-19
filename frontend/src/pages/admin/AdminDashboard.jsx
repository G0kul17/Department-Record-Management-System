import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import Home from "../Home";
import PageHeader from "../../components/ui/PageHeader";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState({
    achievements: 0,
    projects: 0,
    research: 0,
    consultancy: 0,
    participation: 0,
    students: 0,
    staff: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [
          achRes,
          projRes,
          studRes,
          staffRes,
          eventRes,
          frRes,
          fcRes,
          fpRes,
        ] = await Promise.allSettled([
          apiClient.get("/achievements/count"),
          apiClient.get("/projects/count"),
          apiClient.get("/admin/users?role=student"),
          apiClient.get("/admin/users?role=staff"),
          apiClient.get("/events"),
          apiClient.get("/faculty-research"),
          apiClient.get("/faculty-consultancy"),
          apiClient.get("/faculty-participations"),
        ]);

        if (!mounted) return;

        setStats({
          achievements:
            achRes.status === "fulfilled" ? achRes.value?.count ?? 0 : 0,
          projects: projRes.status === "fulfilled" ? projRes.value?.count ?? 0 : 0,
          research:
            frRes.status === "fulfilled"
              ? (Array.isArray(frRes.value?.data)
                  ? frRes.value.data.length
                  : 0)
              : 0,
          consultancy:
            fcRes.status === "fulfilled"
              ? (Array.isArray(fcRes.value?.data)
                  ? fcRes.value.data.length
                  : 0)
              : 0,
          participation:
            fpRes.status === "fulfilled"
              ? (fpRes.value?.total ||
                  (Array.isArray(fpRes.value?.participation)
                    ? fpRes.value.participation.length
                    : 0))
              : 0,
          students:
            studRes.status === "fulfilled"
              ? studRes.value?.count ?? studRes.value?.users?.length ?? 0
              : 0,
          staff:
            staffRes.status === "fulfilled"
              ? staffRes.value?.count ?? staffRes.value?.users?.length ?? 0
              : 0,
          events:
            eventRes.status === "fulfilled"
              ? eventRes.value?.events?.length ?? 0
              : 0,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const BarChart = ({ title, data, color }) => {
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
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const HorizontalBarChart = ({ title, data, color }) => {
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
  };

  const VerticalBarChart = ({ title, data, color }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const colors = ["#10b981", "#06b6d4"];
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-md hover:shadow-lg transition-all duration-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6">{title}</h3>
        <div className="flex items-end justify-center gap-8 h-64">
          {data.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-slate-900 mb-2">
                  {item.value}
                </span>
                <div
                  className="rounded-t-lg transition-all duration-500"
                  style={{
                    width: "60px",
                    height: `${(item.value / maxValue) * 200}px`,
                    backgroundColor: colors[idx],
                  }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DonutChart = ({ title, data }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const colors = ["#3b82f6", "#10b981"];
    let cumulativePercent = 0;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-md hover:shadow-lg transition-all duration-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-5">{title}</h3>
        <div className="flex items-center justify-center gap-8">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {data.map((item, idx) => {
              const percent = (item.value / total) * 100;
              const startAngle = (cumulativePercent / 100) * 360;
              const endAngle = startAngle + (percent / 100) * 360;
              cumulativePercent += percent;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 70 + 50 * Math.cos(startRad);
              const y1 = 70 + 50 * Math.sin(startRad);
              const x2 = 70 + 50 * Math.cos(endRad);
              const y2 = 70 + 50 * Math.sin(endRad);
              const largeArc = percent > 50 ? 1 : 0;

              return (
                <g key={idx}>
                  <path
                    d={`M 70 70 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[idx]}
                    stroke="white"
                    strokeWidth="3"
                  />
                </g>
              );
            })}
            <circle cx="70" cy="70" r="35" fill="white" />
            <text
              x="70"
              y="75"
              textAnchor="middle"
              className="text-sm font-bold"
              fill="#374151"
            >
              {total}
            </text>
          </svg>
          <div className="space-y-3">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
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
  };

  const PieChart = ({ title, data }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const colors = [
      "bg-blue-500",
      "bg-cyan-500",
      "bg-teal-500",
      "bg-emerald-500",
      "bg-sky-500",
    ];
    let cumulativePercent = 0;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-md hover:shadow-lg transition-all duration-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-5">{title}</h3>
        <div className="flex items-center gap-6">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {data.map((item, idx) => {
              const percent = (item.value / total) * 100;
              const startAngle = (cumulativePercent / 100) * 360;
              const endAngle = startAngle + (percent / 100) * 360;
              cumulativePercent += percent;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 60 + 45 * Math.cos(startRad);
              const y1 = 60 + 45 * Math.sin(startRad);
              const x2 = 60 + 45 * Math.cos(endRad);
              const y2 = 60 + 45 * Math.sin(endRad);
              const largeArc = percent > 50 ? 1 : 0;

              return (
                <path
                  key={idx}
                  d={`M 60 60 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={
                    [
                      "#3b82f6",
                      "#06b6d4",
                      "#14b8a6",
                      "#10b981",
                      "#0ea5e9",
                    ][idx]
                  }
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="space-y-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${colors[idx]}`}
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
  };

  const activitiesData = [
    { label: "Achievements", value: stats.achievements },
    { label: "Projects", value: stats.projects },
    { label: "Research", value: stats.research },
    { label: "Consultancy", value: stats.consultancy },
    { label: "Participation", value: stats.participation },
  ];

  const usersData = [
    { label: "Students", value: stats.students },
    { label: "Staff", value: stats.staff },
  ];

  return (
    <>
      {/* Admin Data Visualization Addon - TOP */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <PageHeader
            title="Analytics & Visualization"
            subtitle="Detailed overview of department activities and performance metrics"
          />
          <div className="mb-8 h-1 w-24 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full"></div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading statistics...</p>
            </div>
          ) : (
            <>
              {/* Key Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-10">
                <StatCard label="Achievements" value={stats.achievements} icon="emoji_events" color="blue" />
                <StatCard label="Projects" value={stats.projects} icon="folder" color="green" />
                <StatCard label="Research" value={stats.research} icon="science" color="purple" />
                <StatCard
                  label="Consultancy"
                  value={stats.consultancy}
                  icon="business_center"
                  color="orange"
                />
                <StatCard
                  label="Participation"
                  value={stats.participation}
                  icon="groups"
                  color="cyan"
                />
                <StatCard label="Students" value={stats.students} icon="school" color="emerald" />
                <StatCard label="Staff" value={stats.staff} icon="badge" color="indigo" />
                <StatCard label="Events" value={stats.events} icon="event" color="rose" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <HorizontalBarChart
                  title="Department Activities Overview"
                  data={activitiesData}
                  color="blue"
                />
                <DonutChart
                  title={`Total Users: ${stats.students + stats.staff}`}
                  data={usersData}
                />
              </div>

              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8 pb-8">
                <BarChart
                  title="Faculty Engagement Metrics"
                  data={[
                    { label: "Research", value: stats.research },
                    { label: "Consultancy", value: stats.consultancy },
                    { label: "Participation", value: stats.participation },
                  ]}
                  color="purple"
                />
                <VerticalBarChart
                  title="Institution Members"
                  data={[
                    { label: "Students", value: stats.students },
                    { label: "Staff", value: stats.staff },
                  ]}
                  color="emerald"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Original Home Dashboard - BELOW */}
      <Home />
    </>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    cyan: "bg-cyan-100 text-cyan-600",
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
    rose: "bg-rose-100 text-rose-600",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    cyan: "text-cyan-600",
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    rose: "text-rose-600",
  };

  return (
    <div className={`rounded-xl border border-slate-200 p-5 shadow-md hover:shadow-lg transition-all duration-200 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className={`material-icons text-4xl ${iconColorClasses[color]}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}
