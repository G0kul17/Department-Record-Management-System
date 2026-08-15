import React, { useEffect, useState, useRef } from "react";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function EventsCarousel({ events = [], intervalMs = 4000 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const length = events.length;

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!length) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, intervalMs);
  }

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [length, intervalMs]);

  useEffect(() => {
    setIndex(0);
  }, [events]);

  function prev() {
    setIndex((i) => (i - 1 + length) % length);
    resetTimer();
  }

  function next() {
    setIndex((i) => (i + 1) % length);
    resetTimer();
  }

  if (!length) return null;

  const normalizeMediaUrl = (u) => {
    if (!u) return null;
    const raw = String(u).trim();
    if (!raw) return null;

    // Legacy paths may still be stored as /uploads/* or full backend URLs.
    const uploadsMarker = "/uploads/";
    if (raw.includes(uploadsMarker)) {
      return getFileUrl(raw.split(uploadsMarker)[1]);
    }
    if (/^https?:\/\//i.test(raw)) return raw;

    // Bare filename fallback (legacy payload shape)
    return getFileUrl(raw);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const ev = events[index];
  const thumb =
    normalizeMediaUrl(ev.image) ||
    normalizeMediaUrl(ev.thumbnail) ||
    (ev.thumbnail_filename ? getFileUrl(ev.thumbnail_filename) : null);
  const href = ev.event_url ? ev.event_url : `/events/${ev.id}`;
  const external = Boolean(ev.event_url);

  const eventDate =
    ev.date ||
    ev.event_date ||
    (ev.start_date && ev.end_date
      ? `${formatDate(ev.start_date)} - ${formatDate(ev.end_date)}`
      : formatDate(ev.start_date));
  const venue = ev.venue || ev.location || ev.place;
  const participants = ev.participants || ev.audience || ev.target_audience;
  const category = ev.category || ev.type || ev.event_type || "Event";
  const description = ev.description || ev.summary || "";

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="relative rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden flex-1 flex flex-col justify-between">
        {/* Main card: image left + details right */}
        <div className="flex flex-col sm:flex-row gap-0 flex-1">
          {/* Image panel */}
          <div className="sm:w-2/5 flex-shrink-0 bg-slate-50 flex items-center justify-center min-h-[180px] sm:min-h-[260px] overflow-hidden">
            {thumb ? (
              <img
                src={thumb}
                alt={ev.title}
                className="w-full h-full object-cover min-h-[180px] sm:min-h-[260px]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full min-h-[180px] sm:min-h-[260px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <FaCalendarAlt className="w-12 h-12 text-blue-300" />
              </div>
            )}
          </div>

          {/* Details panel */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* Category badge */}
              <span className="inline-block rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 mb-2.5">
                {category}
              </span>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-2 line-clamp-2 leading-snug">
                {ev.title}
              </h3>

              {/* Description */}
              {description && (
                <p className="text-xs sm:text-sm text-slate-600 mb-3 line-clamp-2">
                  {description}
                </p>
              )}

              {/* Meta rows */}
              <div className="space-y-2 mb-3">
                {eventDate && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-500 w-16 flex-shrink-0">
                      Date
                    </span>
                    <span className="font-medium text-slate-800">{eventDate}</span>
                  </div>
                )}
                {venue && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                    <FaMapMarkerAlt className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-500 w-16 flex-shrink-0">
                      Venue
                    </span>
                    <span className="line-clamp-1 font-medium text-slate-800">{venue}</span>
                  </div>
                )}
                {participants && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                    <FaUsers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-500 w-16 flex-shrink-0">
                      Target
                    </span>
                    <span className="line-clamp-1 font-medium text-slate-800">{participants}</span>
                  </div>
                )}
              </div>
            </div>

            {/* View Details button */}
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold px-4 py-2 shadow-xs transition self-start cursor-pointer"
            >
              <span>View Details</span>
              <FaChevronRight className="w-3 h-3 text-slate-600" />
            </a>
          </div>
        </div>

        {/* Prev / Next arrows */}
        {length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition cursor-pointer"
              aria-label="Previous event"
            >
              <FaChevronLeft className="h-3 w-3 text-slate-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition cursor-pointer"
              aria-label="Next event"
            >
              <FaChevronRight className="h-3 w-3 text-slate-700" />
            </button>
          </>
        )}

        {/* Dot indicators inside card footer */}
        {length > 1 && (
          <div className="flex justify-center gap-1.5 py-2.5 bg-slate-50/80 border-t border-slate-100">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIndex(i);
                  resetTimer();
                }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  i === index ? "bg-blue-600 scale-125 shadow-xs" : "bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Show event ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
