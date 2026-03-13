import React from "react";

const STATUS_STYLES = {
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

const DEFAULT_LABELS = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
};

export default function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const text = label || DEFAULT_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {text}
    </span>
  );
}
