import React, { useEffect, useState, useRef } from "react";
import EventCard from "./EventCard";

export default function EventsCarousel({ events = [], intervalMs = 4000 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const length = events.length;

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
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(${ -index * 100 }%)` }}>
          {events.map((ev) => (
            <div key={ev.id} className="flex-shrink-0 w-full p-4">
              <EventCard
                id={ev.id}
                title={ev.title}
                summary={ev.description}
                start_date={ev.start_date}
                end_date={ev.end_date}
                time={ev.time}
                location={ev.venue}
                venue={ev.venue}
                image={ev.image || ev.thumbnail}
                attachments={ev.attachments}
                to={`/events/${ev.id}`}
                eventUrl={ev.event_url}
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-gray-400/60"}`}
              aria-label={`Show event ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
