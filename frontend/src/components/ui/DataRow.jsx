import React from "react";

export default function DataRow({ expanded, onToggle, header, actions, details }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Row header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Toggle button */}
          <button
            onClick={onToggle}
            className="mt-0.5 flex-shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">{header}</div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap pl-7 sm:pl-0">{actions}</div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && details && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 sm:px-5 py-3 sm:py-4 text-sm text-slate-700 dark:text-slate-300">
          {details}
        </div>
      )}
    </div>
  );
}
