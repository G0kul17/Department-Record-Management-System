import React from "react";

export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 transition-[background-color,border-color,box-shadow] duration-150";
  const variants = {
    primary:
      "bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-accent-strong)] focus:ring-[var(--color-accent-soft)]",
    secondary:
      "bg-white text-slate-700 border border-[var(--color-border)] shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    danger:
      "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-200",
  };
  const cls = `${base} ${variants[variant] || variants.primary} ${className}`;
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
