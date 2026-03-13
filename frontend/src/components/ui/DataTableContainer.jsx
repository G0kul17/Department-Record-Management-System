import React from "react";

export default function DataTableContainer({ title, subtitle, filters, actions, children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>

        {/* Filters */}
        {filters && (
          <div className="flex flex-wrap gap-2">{filters}</div>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
