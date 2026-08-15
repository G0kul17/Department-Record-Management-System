import React, { useState, useRef } from "react";
import {
  FaFolder,
  FaTrophy,
  FaUserGraduate,
  FaUserTie,
  FaCalendarAlt,
  FaFlask,
  FaBriefcase,
  FaUsers,
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaArrowUp,
} from "react-icons/fa";

export default function AdminInteractiveDashboard({
  projCount = 0,
  achCount = 0,
  studentCount = 0,
  staffCount = 0,
  eventCount = 0,
  researchCount = 0,
  consultancyCount = 0,
  participationCount = 0,
  nav,
}) {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'faculty' | 'students'
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Line Chart Cursor Tracking State
  const [lineChartMouse, setLineChartMouse] = useState({
    active: false,
    x: 0,
    y: 0,
    pointIndex: 0,
  });
  const lineChartRef = useRef(null);

  // All activity categories with category roles
  const allActivityCategories = [
    {
      id: "projects",
      label: "Projects",
      value: projCount,
      color: "#2563eb", // blue-600
      badgeBg: "bg-blue-50 text-blue-600 border-blue-200",
      iconBg: "bg-blue-600 text-white",
      hoverBorder: "hover:border-blue-400",
      icon: FaFolder,
      path: "/projects/approved",
      categoryRole: "students",
    },
    {
      id: "achievements",
      label: "Achievements",
      value: achCount,
      color: "#d97706", // amber-600
      badgeBg: "bg-amber-50 text-amber-600 border-amber-200",
      iconBg: "bg-amber-500 text-white",
      hoverBorder: "hover:border-amber-400",
      icon: FaTrophy,
      path: "/achievements/approved",
      categoryRole: "students",
    },
    {
      id: "research",
      label: "Research",
      value: researchCount,
      color: "#ea580c", // orange-600
      badgeBg: "bg-orange-50 text-orange-600 border-orange-200",
      iconBg: "bg-orange-600 text-white",
      hoverBorder: "hover:border-orange-400",
      icon: FaFlask,
      path: "/faculty-research-approved",
      categoryRole: "faculty",
    },
    {
      id: "consultancy",
      label: "Consultancy",
      value: consultancyCount,
      color: "#0891b2", // cyan-600
      badgeBg: "bg-cyan-50 text-cyan-600 border-cyan-200",
      iconBg: "bg-cyan-600 text-white",
      hoverBorder: "hover:border-cyan-400",
      icon: FaBriefcase,
      path: "/faculty-consultancy-approved",
      categoryRole: "faculty",
    },
    {
      id: "participation",
      label: "Participation",
      value: participationCount,
      color: "#9333ea", // purple-600
      badgeBg: "bg-purple-50 text-purple-600 border-purple-200",
      iconBg: "bg-purple-600 text-white",
      hoverBorder: "hover:border-purple-400",
      icon: FaUsers,
      path: "/faculty-participation-approved",
      categoryRole: "faculty",
    },
  ];

  // Dynamic filtering based on activeTab ('all' vs 'faculty' vs 'students')
  const filteredActivityData = allActivityCategories.filter((item) => {
    if (activeTab === "faculty") return item.categoryRole === "faculty";
    if (activeTab === "students") return item.categoryRole === "students";
    return true; // 'all'
  });

  // Calculate dynamic total activities based on selected tab
  const selectedTotalActivities = filteredActivityData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Overall database totals
  const overallTotalActivities = allActivityCategories.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const totalUsers = studentCount + staffCount;

  // Dynamic trajectory points for line graph according to selected tab
  const trendPoints = [
    { month: "Jan", count: Math.round(selectedTotalActivities * 0.15) || 1 },
    { month: "Feb", count: Math.round(selectedTotalActivities * 0.28) || 3 },
    { month: "Mar", count: Math.round(selectedTotalActivities * 0.42) || 5 },
    { month: "Apr", count: Math.round(selectedTotalActivities * 0.6) || 8 },
    { month: "May", count: Math.round(selectedTotalActivities * 0.78) || 12 },
    { month: "Jun", count: Math.round(selectedTotalActivities * 0.9) || 15 },
    { month: "Current", count: selectedTotalActivities },
  ];

  // Mouse cursor tracking for line graph
  const handleLineChartMouseMove = (e) => {
    if (!lineChartRef.current) return;
    const rect = lineChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const step = rect.width / (trendPoints.length - 1);
    const pointIndex = Math.min(
      Math.max(0, Math.round(x / step)),
      trendPoints.length - 1
    );

    setLineChartMouse({
      active: true,
      x: pointIndex * step,
      y,
      pointIndex,
    });
  };

  const handleLineChartMouseLeave = () => {
    setLineChartMouse((prev) => ({ ...prev, active: false }));
  };

  // Helper to check if a stat tile should be highlighted based on active tab
  const isTileActive = (categoryType) => {
    if (activeTab === "all") return true;
    if (activeTab === "faculty")
      return (
        categoryType === "faculty" ||
        categoryType === "staff" ||
        categoryType === "research" ||
        categoryType === "consultancy" ||
        categoryType === "participation"
      );
    if (activeTab === "students")
      return (
        categoryType === "students" ||
        categoryType === "projects" ||
        categoryType === "achievements"
      );
    return true;
  };

  return (
    <div className="w-full bg-[#f8fafc] text-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-xl space-y-8 my-6">
      {/* Light Theme Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <FaChartLine className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Analytics & Interactive Visualization
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-blue-600 capitalize">
                  {activeTab === "all"
                    ? "All Metrics"
                    : `${activeTab} Data & Metrics`}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Live sync pill & Working Filter tabs */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE SYNC
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl border border-slate-300">
            <button
              onClick={() => {
                setActiveTab("all");
                setHoveredSlice(null);
                setHoveredBarIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-blue-600 shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              All Metrics ({overallTotalActivities})
            </button>
            <button
              onClick={() => {
                setActiveTab("faculty");
                setHoveredSlice(null);
                setHoveredBarIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "faculty"
                  ? "bg-white text-blue-600 shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Faculty ({researchCount + consultancyCount + participationCount})
            </button>
            <button
              onClick={() => {
                setActiveTab("students");
                setHoveredSlice(null);
                setHoveredBarIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "students"
                  ? "bg-white text-blue-600 shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Students ({projCount + achCount})
            </button>
          </div>
        </div>
      </div>

      {/* Light Theme Interactive Key Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        <LightStatTile
          label="Projects"
          count={projCount}
          icon={FaFolder}
          iconBg="bg-blue-600"
          hoverBorder="hover:border-blue-400"
          countColor="group-hover:text-blue-600"
          onClick={() => nav && nav("/projects/approved")}
          onHover={() => setHoveredMetric("projects")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("projects")}
        />
        <LightStatTile
          label="Achievements"
          count={achCount}
          icon={FaTrophy}
          iconBg="bg-amber-500"
          hoverBorder="hover:border-amber-400"
          countColor="group-hover:text-amber-600"
          onClick={() => nav && nav("/achievements/approved")}
          onHover={() => setHoveredMetric("achievements")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("achievements")}
        />
        <LightStatTile
          label="Students"
          count={studentCount}
          icon={FaUserGraduate}
          iconBg="bg-emerald-600"
          hoverBorder="hover:border-emerald-400"
          countColor="group-hover:text-emerald-600"
          onClick={() => nav && nav("/admin/students")}
          onHover={() => setHoveredMetric("students")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("students")}
        />
        <LightStatTile
          label="Staff"
          count={staffCount}
          icon={FaUserTie}
          iconBg="bg-indigo-600"
          hoverBorder="hover:border-indigo-400"
          countColor="group-hover:text-indigo-600"
          onClick={() => nav && nav("/admin/staff")}
          onHover={() => setHoveredMetric("staff")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("staff")}
        />
        <LightStatTile
          label="Research"
          count={researchCount}
          icon={FaFlask}
          iconBg="bg-orange-600"
          hoverBorder="hover:border-orange-400"
          countColor="group-hover:text-orange-600"
          onClick={() => nav && nav("/faculty-research-approved")}
          onHover={() => setHoveredMetric("research")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("research")}
        />
        <LightStatTile
          label="Consultancy"
          count={consultancyCount}
          icon={FaBriefcase}
          iconBg="bg-cyan-600"
          hoverBorder="hover:border-cyan-400"
          countColor="group-hover:text-cyan-600"
          onClick={() => nav && nav("/faculty-consultancy-approved")}
          onHover={() => setHoveredMetric("consultancy")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("consultancy")}
        />
        <LightStatTile
          label="Participation"
          count={participationCount}
          icon={FaUsers}
          iconBg="bg-purple-600"
          hoverBorder="hover:border-purple-400"
          countColor="group-hover:text-purple-600"
          onClick={() => nav && nav("/faculty-participation-approved")}
          onHover={() => setHoveredMetric("participation")}
          onLeave={() => setHoveredMetric(null)}
          isActive={isTileActive("participation")}
        />
        <LightStatTile
          label="Events"
          count={eventCount}
          icon={FaCalendarAlt}
          iconBg="bg-rose-600"
          hoverBorder="hover:border-rose-400"
          countColor="group-hover:text-rose-600"
          onClick={() => nav && nav("/events")}
          onHover={() => setHoveredMetric("events")}
          onLeave={() => setHoveredMetric(null)}
          isActive={activeTab === "all"}
        />
      </div>

      {/* Main Charts Section - Light Theme Dribbble Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Interactive Live Line Trajectory & Bar Breakdown */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          {/* Chart 1: Light Theme Live Interactive Cursor Tracking Trend Curve */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FaChartLine className="text-blue-600" />
                  {activeTab === "all"
                    ? "Overall Growth Trajectory"
                    : activeTab === "faculty"
                    ? "Faculty Activity Growth Trajectory"
                    : "Student Submissions Trajectory"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Hover cursor across the graph to inspect monthly totals for{" "}
                  <span className="font-bold uppercase text-blue-600">
                    {activeTab}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Filter Total
                </span>
                <p className="text-xl sm:text-2xl font-black text-blue-600">
                  {selectedTotalActivities}
                </p>
              </div>
            </div>

            {/* Light SVG Curve Canvas with Live Cursor Tracking */}
            <div
              ref={lineChartRef}
              onMouseMove={handleLineChartMouseMove}
              onMouseLeave={handleLineChartMouseLeave}
              className="relative h-48 w-full cursor-crosshair pt-4"
            >
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="lightBlueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Light Grid Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />

                {/* Gradient Area Fill */}
                <path
                  d={`M 0 140 
                    C 80 120, 120 100, 166 85 
                    C 210 70, 250 55, 332 40 
                    C 400 25, 450 20, 500 15 
                    L 500 140 Z`}
                  fill="url(#lightBlueGradient)"
                />

                {/* Curve Line */}
                <path
                  d={`M 0 140 
                    C 80 120, 120 100, 166 85 
                    C 210 70, 250 55, 332 40 
                    C 400 25, 450 20, 500 15`}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Dynamic Cursor Line Guide & Glowing Active Node */}
                {lineChartMouse.active && (
                  <g>
                    <line
                      x1={(lineChartMouse.pointIndex * 500) / 6}
                      y1="0"
                      x2={(lineChartMouse.pointIndex * 500) / 6}
                      y2="140"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={(lineChartMouse.pointIndex * 500) / 6}
                      cy={
                        140 -
                        (trendPoints[lineChartMouse.pointIndex].count /
                          (selectedTotalActivities || 1)) *
                          110 -
                        15
                      }
                      r="7"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="3"
                      className="shadow-lg"
                    />
                  </g>
                )}
              </svg>

              {/* Month Axis */}
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold mt-2 px-1">
                {trendPoints.map((tp, i) => (
                  <span
                    key={i}
                    className={
                      lineChartMouse.active && lineChartMouse.pointIndex === i
                        ? "text-blue-600 font-extrabold"
                        : ""
                    }
                  >
                    {tp.month}
                  </span>
                ))}
              </div>

              {/* Floating Dark Tooltip follows cursor */}
              {lineChartMouse.active && (
                <div
                  className="absolute pointer-events-none z-20 transform -translate-x-1/2 -translate-y-12 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700"
                  style={{
                    left: `${(lineChartMouse.pointIndex * 100) / 6}%`,
                    top: "25%",
                  }}
                >
                  <div className="font-bold text-blue-300">
                    {trendPoints[lineChartMouse.pointIndex].month} ({activeTab.toUpperCase()})
                  </div>
                  <div className="text-slate-200">
                    Total Records:{" "}
                    <span className="font-black text-white">
                      {trendPoints[lineChartMouse.pointIndex].count}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Light Theme Interactive Bar Progress Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FaChartBar className="text-purple-600" />
              {activeTab === "all"
                ? "All Categories Breakdown"
                : activeTab === "faculty"
                ? "Faculty Activities Breakdown"
                : "Student Submissions Breakdown"}
            </h3>

            <div className="space-y-3">
              {filteredActivityData.map((item, idx) => {
                const maxVal = Math.max(
                  ...filteredActivityData.map((d) => d.value),
                  1
                );
                const percent = (
                  (item.value / (selectedTotalActivities || 1)) *
                  100
                ).toFixed(1);
                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onClick={() => nav && nav(item.path)}
                    className={`p-3 sm:p-3.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                      isHovered
                        ? "bg-slate-50 border-blue-400 shadow-sm scale-[1.01]"
                        : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span className="text-slate-800 font-bold">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs font-medium">
                          {percent}%
                        </span>
                        <span className="text-slate-900 font-black text-sm sm:text-base">
                          {item.value}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className="h-full rounded-full transition-all duration-500 relative"
                        style={{
                          width: `${Math.max(
                            (item.value / maxVal) * 100,
                            4
                          )}%`,
                          backgroundColor: item.color,
                        }}
                      >
                        {isHovered && (
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Light Theme Donut Chart & User Ratio */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Chart 3: Light Theme Interactive Slice Donut Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FaChartPie className="text-amber-500" />
                  Distribution Share
                </h3>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  {filteredActivityData.length} Categories
                </span>
              </div>

              {/* Interactive SVG Donut */}
              <div className="flex flex-col items-center justify-center my-4 relative">
                <svg
                  viewBox="0 0 160 160"
                  className="w-44 h-44 sm:w-52 sm:h-52 overflow-visible"
                >
                  {selectedTotalActivities > 0 ? (
                    (() => {
                      let cumulativePercent = 0;
                      return filteredActivityData.map((item, idx) => {
                        const percent =
                          (item.value / selectedTotalActivities) * 100;
                        const startAngle = (cumulativePercent / 100) * 360;
                        const endAngle = startAngle + (percent / 100) * 360;
                        cumulativePercent += percent;

                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        const radius = hoveredSlice === idx ? 68 : 62;
                        const innerRadius = 42;

                        const x1 = 80 + radius * Math.cos(startRad);
                        const y1 = 80 + radius * Math.sin(startRad);
                        const x2 = 80 + radius * Math.cos(endRad);
                        const y2 = 80 + radius * Math.sin(endRad);

                        const ix1 = 80 + innerRadius * Math.cos(startRad);
                        const iy1 = 80 + innerRadius * Math.sin(startRad);
                        const ix2 = 80 + innerRadius * Math.cos(endRad);
                        const iy2 = 80 + innerRadius * Math.sin(endRad);

                        const largeArc = percent > 50 ? 1 : 0;

                        const pathData = `
                          M ${x1} ${y1}
                          A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                          L ${ix2} ${iy2}
                          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
                          Z
                        `;

                        return (
                          <path
                            key={item.id}
                            d={pathData}
                            fill={item.color}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="transition-all duration-300 cursor-pointer hover:opacity-90"
                            onMouseEnter={() => setHoveredSlice(idx)}
                            onMouseLeave={() => setHoveredSlice(null)}
                            onClick={() => nav && nav(item.path)}
                          />
                        );
                      });
                    })()
                  ) : (
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="20"
                    />
                  )}
                </svg>

                {/* Donut Center Details Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  {hoveredSlice !== null &&
                  filteredActivityData[hoveredSlice] ? (
                    <>
                      <span className="text-xs font-bold text-slate-500">
                        {filteredActivityData[hoveredSlice].label}
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        {filteredActivityData[hoveredSlice].value}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">
                        {(
                          (filteredActivityData[hoveredSlice].value /
                            (selectedTotalActivities || 1)) *
                          100
                        ).toFixed(1)}
                        % Share
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {activeTab === "all"
                          ? "Total Items"
                          : `${activeTab} Total`}
                      </span>
                      <span className="text-3xl font-black text-slate-900">
                        {selectedTotalActivities}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium capitalize">
                        {activeTab} Category
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Category Pills Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-100">
              {filteredActivityData.map((item, idx) => (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredSlice(idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                    hoveredSlice === idx
                      ? "bg-slate-100 text-slate-900"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100/70"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-xs font-semibold truncate flex-1">
                    {item.label}
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 4: Light Theme User Ratio Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaUsers className="text-emerald-600" />
                Users Breakdown
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {totalUsers} Total Accounts
              </span>
            </div>

            <div className="space-y-4">
              {/* Students Meter */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <FaUserGraduate className="text-emerald-600" /> Students
                  </span>
                  <span className="text-slate-900 font-extrabold">
                    {studentCount} (
                    {((studentCount / (totalUsers || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(studentCount / (totalUsers || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Staff Meter */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <FaUserTie className="text-indigo-600" /> Staff Members
                  </span>
                  <span className="text-slate-900 font-extrabold">
                    {staffCount} (
                    {((staffCount / (totalUsers || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(staffCount / (totalUsers || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Light Theme Subcomponent for Key Stat Tiles with active opacity filtering
function LightStatTile({
  label,
  count,
  icon: Icon,
  iconBg,
  hoverBorder,
  countColor,
  onClick,
  onHover,
  onLeave,
  isActive = true,
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`group rounded-2xl p-3.5 sm:p-4 transition-all duration-300 text-left border shadow-sm flex flex-col justify-between transform hover:-translate-y-1 cursor-pointer ${
        isActive
          ? `bg-white border-slate-200 ${hoverBorder} hover:shadow-md opacity-100`
          : "bg-slate-100/60 border-slate-200/50 opacity-40 hover:opacity-75"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg} text-white shadow-sm flex-shrink-0 transition-transform group-hover:scale-110`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-tight whitespace-normal">
          {label}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span
          className={`text-xl sm:text-2xl font-black text-slate-900 ${countColor} transition-colors`}
        >
          {count ?? 0}
        </span>
        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <FaArrowUp className="w-2 h-2" /> Live
        </span>
      </div>
    </button>
  );
}
