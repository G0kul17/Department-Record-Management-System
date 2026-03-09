import React from "react";

/**
 * DataTableContainer - Wrapper for data tables with consistent styling
 *
 * Props:
 * - title: Table section title
 * - actions: React node for action buttons (e.g., refresh, add new)
 * - filters: React node for filter controls
 * - children: Table content
 */
export default function DataTableContainer({
  title,
  actions,
  filters,
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {/* Header with title and actions */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 px-4 sm:px-6 py-4 dark:border-slate-800">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h2>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap">{actions}</div>
          )}
        </div>
      )}

      {/* Filters section */}
      {filters && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          {filters}
        </div>
      )}

      {/* Table content */}
      <div className="px-4 sm:px-6 py-4">{children}</div>
    </div>
  );
}
