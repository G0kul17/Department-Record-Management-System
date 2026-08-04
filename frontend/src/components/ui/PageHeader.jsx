import React from "react";

export default function PageHeader({ title, subtitle, right, className = "" }) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          {title}
        </h1>
        {right}
      </div>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
    </div>
  );
}
