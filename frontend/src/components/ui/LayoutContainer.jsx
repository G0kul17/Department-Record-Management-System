import React from "react";

/**
 * LayoutContainer - Standard page wrapper for consistent spacing and layout
 *
 * Props:
 * - maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
 * - padding: 'sm' | 'md' | 'lg' (default: 'md')
 * - className: additional classes
 * - background: 'white' | 'slate' | 'gradient' (default: 'slate')
 */
export default function LayoutContainer({
  children,
  maxWidth = "lg",
  padding = "md",
  className = "",
  background = "slate",
}) {
  const maxWidthClasses = {
    sm: "max-w-4xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    sm: "px-3 sm:px-4 py-4 sm:py-6",
    md: "px-4 sm:px-6 py-6 sm:py-8",
    lg: "px-4 sm:px-8 py-6 sm:py-10",
  };

  const backgroundClasses = {
    white: "bg-white dark:bg-slate-950",
    slate: "bg-slate-50 dark:bg-slate-950",
    gradient:
      "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900",
  };

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] ${backgroundClasses[background]}`}
    >
      <div
        className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
