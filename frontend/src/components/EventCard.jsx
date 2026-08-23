import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaEye,
  FaCalendarCheck,
} from "react-icons/fa";

const COLORS = [
  "bg-blue-600 text-white shadow-md shadow-blue-600/25",
  "bg-blue-600 text-white shadow-md shadow-blue-600/25",
  "bg-blue-600 text-white shadow-md shadow-blue-600/25",
  "bg-blue-600 text-white shadow-md shadow-blue-600/25",
  "bg-blue-600 text-white shadow-md shadow-blue-600/25",
];

export default function EventCard({
  id,
  title,
  summary,
  date,
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
  const [imgError, setImgError] = useState(false);
  const badgeStyle = color || COLORS[((id || 1) - 1) % COLORS.length];
  const isExternal = typeof eventUrl === "string" && eventUrl.trim().length > 0;

  // Resolve image URL safely
  const getEventImageUrl = () => {
    if (image && typeof image === "string") {
      const raw = image.trim();
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.includes("/uploads/")) return getFileUrl(raw.split("/uploads/")[1]);
      return getFileUrl(raw);
    }

    // Try finding an image file in attachments
    if (Array.isArray(attachments)) {
      const imgAtt = attachments.find((a) => {
        const name = typeof a === "string" ? a : a?.name || a?.filename || a?.url || "";
        return /\.(jpe?g|png|webp|gif|svg)$/i.test(name);
      });
      if (imgAtt) {
        const fileStr = typeof imgAtt === "string" ? imgAtt : imgAtt.filename || imgAtt.name || imgAtt.url;
        if (fileStr) {
          if (/^https?:\/\//i.test(fileStr)) return fileStr;
          if (fileStr.includes("/uploads/")) return getFileUrl(fileStr.split("/uploads/")[1]);
          return getFileUrl(fileStr);
        }
      }
    }
    return null;
  };

  const thumbUrl = getEventImageUrl();

  const normalizeUploadUrl = (u) => {
    if (!u) return "#";
    const raw = typeof u === "string" ? u.trim() : u.filename || u.url || "#";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.includes("/uploads/")) return getFileUrl(raw.split("/uploads/")[1]);
    return getFileUrl(raw);
  };

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
    return time ? time : "Upcoming Event";
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    if (isExternal) {
      try {
        window.open(eventUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        window.location.href = eventUrl;
      }
      return;
    }
    if (typeof onClick === "function") onClick();
  };

  return (
    <div
      onClick={handleOpen}
      className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-xs hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500/50 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full space-y-4"
    >
      <div className="space-y-4">
        {/* Banner Image Preview if available */}
        {thumbUrl && !imgError && (
          <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative group-hover:opacity-95 transition-opacity">
            <img
              src={thumbUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header Row with Icon & Title */}
        <div className="flex items-start gap-3.5">
          {(!thumbUrl || imgError) && (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0 group-hover:scale-105 transition-transform">
              <FaCalendarCheck className="w-5 h-5" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                {formatDateRange()}
              </span>
              {(venue || location) && (
                <span className="inline-flex items-center gap-1">
                  <FaMapMarkerAlt className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                  {venue || location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Description */}
        {summary && (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
            {summary}
          </p>
        )}

        {/* Attachments List */}
        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>Attachments:</span>
            {attachments.slice(0, 2).map((a, i) => (
              <a
                key={i}
                href={normalizeUploadUrl(a)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 text-blue-600 dark:text-blue-400 font-extrabold hover:bg-blue-100 dark:hover:bg-blue-900/60 truncate max-w-[200px] transition"
              >
                {typeof a === "string" ? a : a.original_name || a.name || a.filename}
              </a>
            ))}
            {attachments.length > 2 && (
              <span className="text-slate-400 dark:text-slate-500">+{attachments.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {/* Card Action Row */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {grant ? (
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grant</span>
            {grant.title} • {grant.amount}
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Department Event
          </span>
        )}

        {isExternal ? (
          <button
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <FaExternalLinkAlt className="w-3 h-3" />
            Open Link
          </button>
        ) : to ? (
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <FaEye className="w-3 h-3" />
            View Event
          </Link>
        ) : (
          <button
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <FaEye className="w-3 h-3" />
            View Event
          </button>
        )}
      </div>
    </div>
  );
}
