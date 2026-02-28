import React, { useEffect, useState, useRef, useMemo } from "react";
import apiClient from "../api/axiosClient";

export default function EventsCarousel({ events = [], intervalMs = 4000 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const length = events.length;

  const uploadsBase = useMemo(
    () => apiClient.baseURL.replace(/\/api$/, "") + "/uploads/",
    []
  );

  useEffect(() => {
    if (!length) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [length, intervalMs]);

  useEffect(() => {
    // Reset index if events change
    setIndex(0);
  }, [events]);

  if (!length) return null;

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg shadow-sm">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(${-index * 100}%)` }}
        >
          {events.map((ev) => {
            const makeAbsolute = (u) => {
              if (!u) return null;
              if (/^https?:\/\//i.test(u)) return u;
              if (u.startsWith("/uploads/"))
                return uploadsBase + u.split("/uploads/")[1];
              return u;
            };
            const thumb =
              makeAbsolute(ev.image) ||
              makeAbsolute(ev.thumbnail) ||
              (ev.thumbnail_filename
                ? uploadsBase + encodeURIComponent(ev.thumbnail_filename)
                : null);
            const href = ev.event_url ? ev.event_url : `/events/${ev.id}`;
            const external = Boolean(ev.event_url);
            return (
              <div key={ev.id} className="flex-shrink-0 w-full p-4">
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="block rounded-xl border border-sky-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 line-clamp-2">
                    {ev.title}
                  </h3>
                  {thumb ? (
                    <div className="mt-3 overflow-hidden rounded-lg bg-white">
                      <img
                        src={thumb}
                        alt={ev.title}
                        className="w-full h-auto max-h-[420px] md:max-h-[520px] object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 h-40 md:h-56 rounded-lg bg-gradient-to-r from-sky-100 to-indigo-100" />
                  )}
                </a>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${
                i === index ? "bg-sky-500" : "bg-gray-300"
              }`}
              aria-label={`Show event ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
