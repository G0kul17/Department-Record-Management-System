import React from "react";

export default function DataTableContainer({ title, subtitle, filters, actions, children }) {
  return (
    <div className="w-full space-y-4">
      {/* Header (rendered only if title or actions are provided) */}
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 font-medium">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}

      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      )}

      {/* Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
