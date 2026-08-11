import React from "react";

export default function Card({
  children,
  className = "",
  onClick,
  as = "div",
}) {
  const Comp = onClick ? "button" : as;
  const base =
    "rounded-md bg-white border border-[var(--color-border)] shadow-sm text-left dark:bg-slate-800 dark:border-[var(--color-border)]";
  const cls = `${base} ${className}`;
  const extraProps = Comp === "button" ? { type: "button" } : {};
  return (
    <Comp className={cls} onClick={onClick} {...extraProps}>
      {children}
    </Comp>
  );
}
