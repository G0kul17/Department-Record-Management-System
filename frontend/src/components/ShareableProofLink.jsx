import React, { useState } from "react";
import { FaLink, FaCheck } from "react-icons/fa";

export default function ShareableProofLink({ type, id, filename, className = "" }) {
  const [copied, setCopied] = useState(false);

  if (!type || !id) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    const publicUrl = `${window.location.origin}/share/${type}/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
        copied
          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs scale-105"
          : "bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-600 hover:shadow-sm hover:shadow-blue-500/25 active:scale-95"
      } ${className}`}
      title="Copy public shareable link"
    >
      {copied ? (
        <>
          <FaCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <FaLink className="w-2.5 h-2.5 opacity-80 group-hover:opacity-100" />
          <span>Share Link</span>
        </>
      )}
    </button>
  );
}

