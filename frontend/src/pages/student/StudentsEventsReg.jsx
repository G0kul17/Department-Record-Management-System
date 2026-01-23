import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import EventCard from "../../components/EventCard";
import apiClient from "../../api/axiosClient";
import { generateAcademicYears } from "../../utils/academicYears";

function GrantBox({ grant }) {
  if (!grant) return null;
  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
      <h4 className="text-md font-semibold">{grant.title}</h4>
      <div className="mt-2 text-sm text-slate-600">{grant.description}</div>
      <div className="mt-3 flex gap-4">
        <div className="text-sm">
          <div className="text-xs text-slate-500">Amount</div>
          <div className="font-bold">{grant.amount}</div>
        </div>
        <div className="text-sm">
          <div className="text-xs text-slate-500">Eligibility</div>
          <div className="font-medium">{grant.eligibility}</div>
        </div>
      </div>
      <a
        href={grant.apply_link}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Apply / More details
      </a>
    </div>
  );
}

export default function Events() {
  const { id } = useParams();
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const academicYearOptions = useMemo(() => generateAcademicYears(), []);

  // compute selected event early so hooks can react to it
  const selectedEvent = id
    ? events.find((e) => String(e.id) === String(id))
    : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // fetch all events (latest first) so student view shows staff-uploaded events
        const data = await apiClient.get("/events?order=latest");
        if (!mounted) return;
        const evs = (data.events || []).map((e) => {
          // normalize event_url property and parse attachments if stored as JSON string
          let attachments = e.attachments;
          try {
            if (typeof attachments === "string" && attachments.trim()) {
              attachments = JSON.parse(attachments);
            }
          } catch (_) {
            attachments = [];
          }
          return {
            ...e,
            event_url: e.event_url || e.eventUrl || null,
            attachments: Array.isArray(attachments) ? attachments : [],
            // Build a usable thumbnail URL if present
            thumbnail: e.thumbnail_filename
              ? `/uploads/${encodeURIComponent(e.thumbnail_filename)}`
              : null,
          };
        });
        setEvents(evs);
      } catch (e) {
        console.error(e);
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // If user opened the detail route for an event that has an external URL,
  // automatically open that URL in a new tab and show a redirecting message.
  React.useEffect(() => {
    if (!id) return;
    if (loading) return;
    const ev = selectedEvent;
    if (!ev) return;
    if (ev.event_url) {
      try {
        window.open(ev.event_url, "_blank", "noopener,noreferrer");
      } catch (err) {
        window.location.href = ev.event_url;
      }
    }
  }, [id, loading, selectedEvent]);

  if (id) {
    const ev = selectedEvent;
    if (loading) {
      return (
        <div className="p-8">
          <h3 className="text-xl">Loading event...</h3>
        </div>
      );
    }

    if (!ev)
      return (
        <div className="p-8">
          <h3 className="text-xl">Event not found</h3>
          <Link to="/events" className="text-blue-600 underline">
            Back to events
          </Link>
        </div>
      );

    // If the event has an external URL, we've already attempted to open it in a new tab.
    if (ev.event_url) {
      return (
        <div className="p-8">
          <h3 className="text-xl">Redirecting to external event link…</h3>
          <p className="mt-2 text-sm">
            If you are not redirected,{" "}
            <a
              href={ev.event_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              open the link manually
            </a>
            .
          </p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl p-8">
        <button
          onClick={() => nav(-1)}
          className="mb-6 text-sm text-slate-600 underline"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 p-8 text-white shadow-lg">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {ev.title}
            </h1>
            <p className="mt-3 text-sm opacity-90">
              {ev.venue} •{" "}
              {ev.start_date ? new Date(ev.start_date).toLocaleString() : ""}
              {ev.end_date
                ? ` – ${new Date(ev.end_date).toLocaleString()}`
                : ""}
            </p>
            <p className="mt-6 text-base leading-relaxed">{ev.description}</p>

            <div className="mt-6 flex items-center gap-3">
              {ev.event_url ? (
                <a
                  href={ev.event_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
                >
                  Open External Link
                </a>
              ) : (
                <span className="inline-block rounded-md bg-white/20 px-3 py-1 text-sm">
                  No external link provided
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold">Details</h3>
            <div className="mt-3 text-sm text-slate-700">
              <div>
                <strong>Date:</strong>{" "}
                {ev.start_date
                  ? new Date(ev.start_date).toLocaleString()
                  : "TBD"}
                {ev.end_date
                  ? ` — ${new Date(ev.end_date).toLocaleString()}`
                  : ""}
              </div>
              <div className="mt-2">
                <strong>Venue:</strong> {ev.venue || "TBD"}
              </div>
              {ev.attachments && ev.attachments.length > 0 && (
                <div className="mt-3">
                  <strong>Attachments:</strong>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {ev.attachments.map((a, idx) => (
                      <li key={idx}>
                        <a
                          href={a.url || a}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          {a.name || a}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = events.filter((e) => {
    const matchesSearch = !q
      || [e.title, e.venue, e.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    const eventYear = e.academic_year || e.start_date?.substring(0, 4);
    const matchesYear = !academicYear
      || (eventYear && eventYear.includes(academicYear.substring(0, 4)));

    return matchesSearch && matchesYear;
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-4">Events</h1>
      
      {/* Search and Filter Bar */}
      <div className="mb-6">
        <div className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* Search input */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Search
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21l-4.3-4.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full rounded-md border border-slate-300 bg-slate-50 pl-9 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>
            {/* Academic Year dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All Years</option>
                {academicYearOptions.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 mb-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Filter by title, venue, or description.
        </p>
        <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
          {loading ? "Loading..." : `${events.length} total`}
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="mt-8 text-sm text-slate-600">
          No events match your search.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((ev) => (
            <EventCard
              key={ev.id}
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
              grant={null}
              eventUrl={ev.event_url}
              to={ev.event_url ? undefined : `/events/${ev.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
