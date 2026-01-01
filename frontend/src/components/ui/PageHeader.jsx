import React from "react";

export default function PageHeader({ title, subtitle, right, className = "" }) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {right}
      </div>
      {subtitle && <p className="mt-1 text-slate-600 text-sm">{subtitle}</p>}
    </div>
  );
}
