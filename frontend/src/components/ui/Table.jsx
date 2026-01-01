import React from "react";

export function Table({ children, className = "" }) {
  return (
    <div
      className={`overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TR({ children }) {
  return <tr className="border-b last:border-b-0">{children}</tr>;
}

export function TH({ children }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
      {children}
    </th>
  );
}

export function TD({ children }) {
  return <td className="px-3 py-2 text-slate-700">{children}</td>;
}
