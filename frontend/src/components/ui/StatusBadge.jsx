import React from "react";

/**
 * StatusBadge - Consistent status indicator component
 *
 * Props:
 * - status: 'pending' | 'approved' | 'rejected' | 'verified' | 'success' | 'warning' | 'info'
 * - label: Custom label text (overrides default)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function StatusBadge({ status, label, size = "md" }) {
  const statusConfig = {
    pending: {
      label: "Pending",
      bgColor: "bg-amber-100 dark:bg-amber-900/40",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    approved: {
      label: "Approved",
      bgColor: "bg-green-100 dark:bg-green-900/40",
      textColor: "text-green-700 dark:text-green-300",
    },
    verified: {
      label: "Verified",
      bgColor: "bg-green-100 dark:bg-green-900/40",
      textColor: "text-green-700 dark:text-green-300",
    },
    rejected: {
      label: "Rejected",
      bgColor: "bg-red-100 dark:bg-red-900/40",
      textColor: "text-red-700 dark:text-red-300",
    },
    success: {
      label: "Success",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
    warning: {
      label: "Warning",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/40",
      textColor: "text-yellow-700 dark:text-yellow-300",
    },
    info: {
      label: "Info",
      bgColor: "bg-blue-100 dark:bg-blue-900/40",
      textColor: "text-blue-700 dark:text-blue-300",
    },
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  const config = statusConfig[status] || statusConfig.info;
  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      {displayLabel}
    </span>
  );
}
