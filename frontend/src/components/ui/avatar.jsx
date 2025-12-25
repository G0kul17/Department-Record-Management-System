import React from "react";

// Lightweight shadcn-style Avatar without external utils
export const Avatar = React.forwardRef(function Avatar(
  { className = "", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const AvatarImage = React.forwardRef(function AvatarImage(
  { className = "", ...props },
  ref
) {
  return (
    <img
      ref={ref}
      className={`aspect-square h-full w-full ${className}`}
      {...props}
    />
  );
});

export const AvatarFallback = React.forwardRef(function AvatarFallback(
  { className = "", children, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={`flex h-full w-full items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});

export default Avatar;
