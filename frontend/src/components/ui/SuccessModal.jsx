import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function SuccessModal({
  open,
  title = "Saved successfully",
  subtitle = "Your changes have been saved.",
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      onClose?.();
    }, 2000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative z-[101] w-[90%] max-w-sm rounded-2xl border border-green-200 bg-white p-6 text-center shadow-xl dark:border-green-700 dark:bg-slate-900">
        <div className="relative mx-auto mb-3 h-16 w-16">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
          <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 shadow-sm dark:bg-green-900/40 dark:text-green-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-7 w-7"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path
                d="M8 12l2.5 2.5L16 9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
