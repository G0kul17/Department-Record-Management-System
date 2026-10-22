import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTrashAlt, FaExclamationTriangle, FaTimes } from "react-icons/fa";

export default function ConfirmDeleteModal({
  isOpen,
  title = "Delete Record",
  message = "Are you sure you want to permanently delete this item? This action cannot be undone and all associated files will be removed.",
  itemTitle = "",
  confirmText = "Delete Permanently",
  cancelText = "Cancel",
  isDeleting = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isDeleting && onClose?.()}
      />

      {/* Dialog Box */}
      <div className="relative z-[101] w-full max-w-md transform overflow-hidden rounded-3xl border border-rose-100 dark:border-rose-950/60 bg-white dark:bg-slate-900 p-6 text-left shadow-2xl transition-all space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => !isDeleting && onClose?.()}
          disabled={isDeleting}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shadow-xs">
            <FaTrashAlt className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-0.5">
              <FaExclamationTriangle className="w-3 h-3 flex-shrink-0" />
              <span>Permanent deletion warning</span>
            </p>
          </div>
        </div>

        {/* Message / Item Highlight */}
        <div className="space-y-2">
          {itemTitle && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Item to delete
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                {itemTitle}
              </p>
            </div>
          )}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => !isDeleting && onClose?.()}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-extrabold shadow-md shadow-rose-600/25 transition cursor-pointer disabled:opacity-50"
          >
            <FaTrashAlt className="w-3.5 h-3.5" />
            {isDeleting ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
