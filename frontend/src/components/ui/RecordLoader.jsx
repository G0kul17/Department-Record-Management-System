import React from "react";
import { FaFolderOpen, FaDatabase, FaShieldAlt, FaGraduationCap } from "react-icons/fa";

export default function RecordLoader({ text = "Loading System Records...", fullScreen = true }) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04081e]/90 backdrop-blur-md"
    : "flex flex-col items-center justify-center p-12 w-full";

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer Glowing Pulsing Ambient Halo */}
        <div className="absolute h-36 w-36 rounded-full bg-indigo-600/20 blur-2xl animate-pulse" />
        <div className="absolute h-28 w-28 rounded-full bg-blue-500/20 blur-xl animate-pulse delay-300" />

        {/* Dual Counter-Rotating Concentric Orbital Rings */}
        <div className="relative flex items-center justify-center h-28 w-28">
          {/* Outer Ring - Clockwise Spin */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-blue-400 animate-spin duration-[1500ms]" />

          {/* Inner Ring - Counter Clockwise Spin */}
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 border-l-sky-400 animate-[spin_2s_linear_infinite_reverse]" />

          {/* Central DRMS Badge Emblem */}
          <div className="relative h-14 w-14 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] flex items-center justify-center text-blue-400">
            <FaFolderOpen className="w-6 h-6 animate-bounce text-indigo-400" />
          </div>

          {/* Floating Orbiting Document Dots */}
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-ping" />
          <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-ping delay-500" />
        </div>

        {/* Floating Records Micro Graphic Cards */}
        <div className="flex items-center gap-2 mt-6">
          <div className="h-1.5 w-8 rounded-full bg-blue-500/80 animate-pulse" />
          <div className="h-1.5 w-12 rounded-full bg-indigo-500/80 animate-pulse delay-150" />
          <div className="h-1.5 w-6 rounded-full bg-purple-500/80 animate-pulse delay-300" />
        </div>

        {/* Modern Animated Typography */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-sm font-extrabold tracking-wider text-slate-100 uppercase bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            {text}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wide">
            Department Records Management System
          </p>
        </div>
      </div>
    </div>
  );
}
