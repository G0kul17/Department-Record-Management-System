import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaBell,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";

export default function Toast({
  message,
  type = "info",
  duration = 4500,
  onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose?.(), 250);
  };

  // Split title and subtitle if message contains newlines
  const lines = String(message).split("\n");
  const title = lines[0];
  const bodyLines = lines.slice(1);

  // Styling maps for Futuristic Dynamic Island / Cyber Toast
  const theme = {
    success: {
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-slate-900/95",
      border: "border-emerald-500/40 hover:border-emerald-400",
      glow: "shadow-[0_10px_30px_-5px_rgba(16,185,129,0.3)]",
      badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      progressBg: "bg-gradient-to-r from-emerald-500 to-teal-400",
      icon: FaCheckCircle,
      iconColor: "text-emerald-400",
      label: "Success",
    },
    error: {
      gradient: "from-rose-500 to-red-600",
      bg: "bg-slate-900/95",
      border: "border-rose-500/40 hover:border-rose-400",
      glow: "shadow-[0_10px_30px_-5px_rgba(244,63,94,0.3)]",
      badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      progressBg: "bg-gradient-to-r from-rose-500 to-red-500",
      icon: FaTimesCircle,
      iconColor: "text-rose-400",
      label: "Alert",
    },
    warning: {
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-slate-900/95",
      border: "border-amber-500/40 hover:border-amber-400",
      glow: "shadow-[0_10px_30px_-5px_rgba(245,158,11,0.3)]",
      badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      progressBg: "bg-gradient-to-r from-amber-500 to-orange-400",
      icon: FaExclamationTriangle,
      iconColor: "text-amber-400",
      label: "Warning",
    },
    info: {
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      bg: "bg-slate-900/95",
      border: "border-purple-500/40 hover:border-purple-400",
      glow: "shadow-[0_10px_30px_-5px_rgba(168,85,247,0.35)]",
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      progressBg: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
      icon: FaBell,
      iconColor: "text-purple-400",
      label: "Notification",
    },
  }[type] || {
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-slate-900/95",
    border: "border-blue-500/40",
    glow: "shadow-xl",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    progressBg: "bg-blue-500",
    icon: FaInfoCircle,
    iconColor: "text-blue-400",
    label: "Info",
  };

  const IconComponent = theme.icon;

  return (
    <div
      className={`fixed top-5 right-4 sm:right-6 z-[9999] max-w-md w-[calc(100vw-2rem)] sm:w-auto transition-all duration-300 transform ${
        visible
          ? "translate-y-0 opacity-100 scale-100"
          : "-translate-y-4 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${theme.bg} ${theme.border} ${theme.glow} p-4 text-white shadow-2xl transition-all group`}
      >
        {/* Top Gradient Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />

        <div className="flex items-start gap-3.5 pt-0.5">
          {/* Icon Badge Container */}
          <div className="relative flex-shrink-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 ${theme.iconColor} shadow-md`}>
              <IconComponent className={`w-5 h-5 ${type === "info" ? "animate-pulse" : ""}`} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-gradient-to-r ${theme.gradient}`} />
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-r ${theme.gradient}`} />
            </span>
          </div>

          {/* Content Body */}
          <div className="min-w-0 flex-1 space-y-1 pr-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block rounded-full border px-2 py-0.2 text-[9px] font-black uppercase tracking-widest ${theme.badgeBg}`}>
                {theme.label}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Just now</span>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-slate-100 tracking-tight leading-snug">
              {title}
            </h4>

            {bodyLines.length > 0 && (
              <div className="text-[11px] text-slate-300 font-medium space-y-0.5 pt-0.5 leading-normal">
                {bodyLines.map((line, idx) => (
                  <p key={idx} className="line-clamp-2">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Dismiss"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Animated Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800/60 overflow-hidden">
          <div
            className={`h-full ${theme.progressBg} transition-all ease-linear`}
            style={{
              animation: `shrinkProgress ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* Progress Bar Keyframe Animation */}
      <style>{`
        @keyframes shrinkProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
