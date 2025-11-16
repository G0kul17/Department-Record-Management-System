import React from "react";
import { Link } from "react-router-dom";

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#6366f1", "#ec4899"];

export default function EventCard({
  id,
  title,
  summary,
  date,
  location,
  grant,
  color,
  to,
  onClick,
}) {
  const bg = color || COLORS[(id - 1) % COLORS.length];
  return (
    <div className="relative">
      <div
        className="group relative overflow-hidden rounded-2xl p-6 text-left text-white shadow-lg transition transform hover:-translate-y-0.5 hover:shadow-xl"
        style={{ backgroundColor: bg }}
        onClick={onClick}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl bg-white" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold drop-shadow-sm">{title}</h3>
            <p className="mt-2 text-white/90 text-sm">{summary}</p>
            <div className="mt-3 text-sm text-white/90">
              <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>{location}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {grant && (
              <div className="text-right text-sm text-white/90">
                <div className="text-xs">Grant</div>
                <div className="font-semibold">{grant.title}</div>
                <div className="text-sm">{grant.amount}</div>
              </div>
            )}
            {to ? (
              <Link
                to={to}
                className="inline-block rounded-md bg-white/90 text-slate-900 px-3 py-1 text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </Link>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick && onClick();
                }}
                className="inline-block rounded-md bg-white/90 text-slate-900 px-3 py-1 text-sm font-medium"
              >
                View
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
