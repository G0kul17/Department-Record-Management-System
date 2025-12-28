import React from "react";

export default function Card({
  children,
  className = "",
  onClick,
  as = "div",
}) {
  const Comp = onClick ? "button" : as;
  const base = "rounded-md bg-white border border-gray-200 shadow-sm text-left";
  const cls = `${base} ${className}`;
  return (
    <Comp className={cls} onClick={onClick}>
      {children}
    </Comp>
  );
}
