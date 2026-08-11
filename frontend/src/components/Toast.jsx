import React, { useEffect } from "react";

export default function Toast({ message, type = "success", duration = 3000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColor =
    type === "success"
      ? "bg-green-100/40"
      : type === "error"
      ? "bg-red-100/40"
      : type === "warning"
      ? "bg-yellow-100/40"
      : "bg-blue-100/40";

  const borderColor =
    type === "success"
      ? "border-green-300/60"
      : type === "error"
      ? "border-red-300/60"
      : type === "warning"
      ? "border-yellow-300/60"
      : "border-blue-300/60";

  const textColor =
    type === "success"
      ? "text-green-800 dark:text-green-200"
      : type === "error"
      ? "text-red-800 dark:text-red-200"
      : type === "warning"
      ? "text-yellow-800 dark:text-yellow-200"
      : "text-blue-800 dark:text-blue-200";

  const iconColor =
    type === "success"
      ? "text-green-600 dark:text-green-300"
      : type === "error"
      ? "text-red-600 dark:text-red-300"
      : type === "warning"
      ? "text-yellow-600 dark:text-yellow-300"
      : "text-blue-600 dark:text-blue-300";

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
      <div
        className={`backdrop-blur-xl backdrop-filter border px-8 py-6 rounded-3xl shadow-2xl flex items-center gap-6 ${bgColor} ${borderColor} border-2 transform transition-all`}
      >
        {/* Tick Icon */}
        <div className={`flex-shrink-0 ${iconColor}`}>
          <svg
            className="w-12 h-12 animate-bounce"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Message */}
        <div>
          <p className={`text-xl font-bold ${textColor}`}>
            {message.split("\n").map((line, idx) => (
              <span key={idx}>
                {line}
                {idx === 0 && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
