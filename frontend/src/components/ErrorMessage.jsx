import { useState } from "react";

/**
 * Displays an API error with an optional copyable reference code.
 *
 * Accepts `error` as either:
 *   - A plain string  (legacy pages that still do setError(err.message))
 *   - An Error object with an optional `.traceId` property
 *     (set by axiosClient when the backend returns a trace_id field)
 *
 * When a traceId is present the user sees a "Reference: <id>" line they
 * can copy and give to support, who then searches Kibana for that trace_id
 * to reconstruct the exact request timeline.
 */
export default function ErrorMessage({ error, className = "" }) {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const message = typeof error === "string" ? error : error?.message ?? String(error);
  const traceId = typeof error === "object" ? error?.traceId : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(traceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg ${className}`}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>

      {traceId && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-red-500">
            Reference:{" "}
            <span className="font-mono select-all tracking-wide">{traceId}</span>
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 focus:outline-none"
            aria-label="Copy reference code"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
