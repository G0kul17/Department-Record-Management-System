import React from "react";

/**
 * DataRow - Consistent row styling for data lists with expandable details
 *
 * Props:
 * - header: Main row content (always visible)
 * - details: Expandable detail content
 * - actions: Action buttons/controls
 * - expanded: Boolean to control expansion
 * - onToggle: Callback for expand/collapse
 * - hoverable: Enable hover effect (default: true)
 */
export default function DataRow({
  header,
  details,
  actions,
  expanded = false,
  onToggle,
  hoverable = true,
  className = "",
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white transition-shadow dark:border-slate-700 dark:bg-slate-900/50 ${
        hoverable ? "hover:shadow-md" : ""
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4">
        <div className="flex-1 min-w-0">{header}</div>
        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:ml-4">
            {actions}
          </div>
        )}
      </div>
      {details && expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {details}
        </div>
      )}
    </div>
  );
}
