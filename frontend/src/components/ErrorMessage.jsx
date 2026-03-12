import { useState } from "react";

// User-facing messages that are expected, actionable, and need no extra hint.
// Everything else (server crashes, DB failures, etc.) shows the contact-admin hint.
const USER_FACING_MESSAGES = [
  /invalid otp/i,
  /otp expired/i,
  /email and (otp|password)/i,
  /user not found/i,
  /invalid credentials/i,
  /email already registered/i,
  /too many failed attempts/i,
  /password must be/i,
  /invalid email format/i,
  /please upload/i,
  /file too large/i,
  /no fields to update/i,
  /unauthorized/i,
  /token expired/i,
  /session revoked/i,
];

function isServerError(message) {
  return !USER_FACING_MESSAGES.some((re) => re.test(message));
}

/**
 * Displays an API error with an optional copyable reference code.
 *
 * Accepts `error` as either:
 *   - A plain string  (legacy pages that still do setError(err.message))
 *   - An Error object with an optional `.traceId` property
 *     (set by axiosClient when the backend returns a trace_id field)
 *
 * For unexpected server errors (anything that isn't a known user-facing message)
 * a "If this issue persists, contact your administrator" hint is shown below the
 * reference code so users know there's someone to reach out to.
 */
export default function ErrorMessage({ error, className = "" }) {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const message = typeof error === "string" ? error : error?.message ?? String(error);
  const traceId = typeof error === "object" ? error?.traceId : null;
  // Only show the contact-admin hint for unexpected server errors, not for
  // normal validation failures like "Invalid OTP" or "User not found".
  const showContactHint = traceId && isServerError(message);

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

      {showContactHint && (
        <p className="mt-2 text-xs text-red-400">
          If this issue persists, contact your administrator and share the reference code above.
        </p>
      )}
    </div>
  );
}
