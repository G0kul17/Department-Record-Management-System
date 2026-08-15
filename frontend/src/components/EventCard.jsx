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
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-fuchsia-100 text-fuchsia-600",
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
      className="group rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 text-left shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full space-y-4"
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
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${badgeStyle} shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
              <FaCalendarCheck className="w-5 h-5" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3 text-blue-500" />
                {formatDateRange()}
              </span>
              {(venue || location) && (
                <span className="inline-flex items-center gap-1">
                  <FaMapMarkerAlt className="w-3 h-3 text-rose-500" />
                  {venue || location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Description */}
        {summary && (
          <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
            {summary}
          </p>
        )}

        {/* Attachments List */}
        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
            <span>Attachments:</span>
            {attachments.slice(0, 2).map((a, i) => (
              <a
                key={i}
                href={normalizeUploadUrl(a)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-blue-600 hover:underline truncate max-w-[200px]"
              >
                {typeof a === "string" ? a : a.original_name || a.name || a.filename}
              </a>
            ))}
            {attachments.length > 2 && (
              <span className="text-slate-400">+{attachments.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {/* Card Action Row */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        {grant ? (
          <div className="text-xs font-bold text-slate-700">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grant</span>
            {grant.title} • {grant.amount}
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">
            Department Event
          </span>
        )}

        {isExternal ? (
          <button
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <FaExternalLinkAlt className="w-3 h-3 text-[#2563eb]" />
            Open Link
          </button>
        ) : to ? (
          <Link
            to={to}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <FaEye className="w-3 h-3 text-[#0284c7]" />
            View Event
          </Link>
        ) : (
          <button
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <FaEye className="w-3 h-3 text-[#0284c7]" />
            View Event
          </button>
        )}
      </div>
    </div>
  );
}
