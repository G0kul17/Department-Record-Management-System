import React from "react";

export default function Card({
  children,
  className = "",
  onClick,
  as = "div",
}) {
  const Comp = onClick ? "button" : as;
  const base = "rounded-md bg-white border-2 border-blue-800 shadow-sm text-left dark:bg-slate-800 dark:border-blue-700";
  const cls = `${base} ${className}`;
  return (
    <Comp className={cls} onClick={onClick}>
      {children}
    </Comp>
  );
}
