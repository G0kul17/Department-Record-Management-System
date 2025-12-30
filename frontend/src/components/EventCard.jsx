import React from "react";
import { Link } from "react-router-dom";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#6366f1",
  "#ec4899",
];

export default function EventCard({
  id,
  title,
  summary,
  date, // ISO or date string
  start_date,
  end_date,
  time,
  location,
  venue,
  grant,
  color,
  to,
  onClick,
  eventUrl,
  image,
  attachments,
}) {
  const bg = color || COLORS[((id || 1) - 1) % COLORS.length];

  const isExternal = typeof eventUrl === "string" && eventUrl.trim().length > 0;

  // Choose a thumbnail: explicit image prop, or first image attachment
  const thumb =
    image ||
    (Array.isArray(attachments)
      ? attachments.find((a) =>
          /\.(jpe?g|png|gif)$/i.test(a.name || a.filename || "")
        )?.url ||
        attachments.find((a) =>
          /\.(jpe?g|png|gif)$/i.test(a.name || a.filename || "")
        )?.filename
      : null);

  const formatDateRange = () => {
    if (start_date && end_date) {
      const s = new Date(start_date);
      const e = new Date(end_date);
      if (!isNaN(s) && !isNaN(e)) {
        const same = s.toDateString() === e.toDateString();
        if (same) return `${s.toLocaleDateString()} ${time ? `• ${time}` : ""}`;
        return `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`;
      }
    }
    if (date) {
      const d = new Date(date);
      if (!isNaN(d))
        return `${d.toLocaleDateString()} ${time ? `• ${time}` : ""}`;
    }
    return time ? time : "";
  };

  return (
    <div className="relative">
      <div
        className="group relative overflow-hidden rounded-xl border border-sky-200 bg-white p-4 md:p-6 text-left text-slate-900 shadow-sm transition transform hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-sky-300 cursor-pointer"
        onClick={() => {
          if (isExternal) {
            try {
              window.open(eventUrl, "_blank", "noopener,noreferrer");
            } catch (err) {
              window.location.href = eventUrl;
            }
            return;
          }
          if (typeof onClick === "function") onClick();
        }}
      >
        <div className="flex items-start gap-4">
          {thumb && (
            <div className="hidden md:block flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
              <img
                src={thumb}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold">{title}</h3>
                <p className="mt-2 text-slate-600 text-sm line-clamp-3">
                  {summary}
                </p>
                <div className="mt-3 text-sm text-slate-700">
                  <span className="font-medium">{formatDateRange()}</span>
                  {(venue || location) && <span className="mx-2">•</span>}
                  <span>{venue || location}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                {grant && (
                  <div className="text-right text-sm text-slate-700">
                    <div className="text-xs">Grant</div>
                    <div className="font-semibold">{grant.title}</div>
                    <div className="text-sm">{grant.amount}</div>
                  </div>
                )}

                {isExternal ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        window.open(eventUrl, "_blank", "noopener,noreferrer");
                      } catch (err) {
                        window.location.href = eventUrl;
                      }
                    }}
                    className="inline-block rounded-md bg-[#87CEEB] text-white px-3 py-1 text-sm font-medium hover:opacity-90"
                    aria-label={`Open event ${title}`}
                  >
                    Open
                  </button>
                ) : to ? (
                  <Link
                    to={to}
                    className="inline-block rounded-md bg-[#87CEEB] text-white px-3 py-1 text-sm font-medium hover:opacity-90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick && onClick();
                    }}
                    className="inline-block rounded-md bg-[#87CEEB] text-white px-3 py-1 text-sm font-medium hover:opacity-90"
                    aria-label={`View event ${title}`}
                  >
                    View
                  </button>
                )}
              </div>
            </div>

            {/* Attachments list (small) */}
            {Array.isArray(attachments) && attachments.length > 0 && (
              <div className="mt-4 text-xs text-slate-600">
                {attachments.slice(0, 3).map((a, i) => (
                  <div key={i} className="truncate">
                    <a
                      href={a.url || `/uploads/${a.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-sky-700 hover:text-sky-600"
                    >
                      {a.original_name || a.name || a.filename}
                    </a>
                  </div>
                ))}
                {attachments.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{attachments.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
