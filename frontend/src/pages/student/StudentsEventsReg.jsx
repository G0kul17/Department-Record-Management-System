import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import EventCard from "../../components/EventCard";
import CustomSelect from "../../components/ui/CustomSelect";
import apiClient from "../../api/axiosClient";
import { generateAcademicYears } from "../../utils/academicYears";
import { getFileUrl } from "../../utils/fileUrl";
import {
  FaCalendarAlt,
  FaArrowLeft,
  FaSearch,
  FaBuilding,
  FaExternalLinkAlt,
  FaFileAlt,
} from "react-icons/fa";

export default function Events() {
  const { id } = useParams();
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const academicYearOptions = useMemo(() => generateAcademicYears(), []);

  const selectedEvent = id
    ? events.find((e) => String(e.id) === String(id))
    : null;

  const normalizeEventFileUrl = (value) => {
    if (!value) return "";
    const raw = String(value).trim();
    if (!raw) return "";

    const uploadsMarker = "/uploads/";
    if (raw.includes(uploadsMarker)) {
      return getFileUrl(raw.split(uploadsMarker)[1]);
    }
    if (/^https?:\/\//i.test(raw)) return raw;
    return getFileUrl(raw);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get("/events?order=latest");
        if (!mounted) return;
        const evs = (data.events || []).map((e) => {
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
            thumbnail: e.thumbnail_filename
              ? getFileUrl(e.thumbnail_filename)
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

  useEffect(() => {
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
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading event details...</p>
          </div>
        </div>
      );
    }

    if (!ev) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
            <FaCalendarAlt className="w-6 h-6" />
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Event not found</h3>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-blue-600/25 transition"
          >
            Back to events
          </Link>
        </div>
      );
    }

    if (ev.event_url) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center space-y-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
            <FaCalendarAlt className="w-6 h-6" />
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Redirecting to external event link…
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            If you are not redirected,{" "}
            <a
              href={ev.event_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 font-bold underline"
            >
              open link manually
            </a>
            .
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 p-6 sm:p-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Events
          </button>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-1 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-3">
                <FaCalendarAlt className="w-3 h-3" /> Event Details
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {ev.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {ev.venue} •{" "}
                {ev.start_date ? new Date(ev.start_date).toLocaleString() : ""}
                {ev.end_date ? ` – ${new Date(ev.end_date).toLocaleString()}` : ""}
              </p>
            </div>

            <p className="text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
              {ev.description}
            </p>

            {ev.attachments && ev.attachments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Attachments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ev.attachments.map((a, idx) => (
                    <a
                      key={idx}
                      href={normalizeEventFileUrl(a?.url || a)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                    >
                      <FaFileAlt className="w-3 h-3" />
                      {a?.name || a?.original_name || a}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = events.filter((e) => {
    const matchesSearch =
      !q ||
      [e.title, e.venue, e.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    const eventYear = e.academic_year || e.start_date?.substring(0, 4);
    const matchesYear =
      !academicYear ||
      (eventYear && eventYear.includes(academicYear.substring(0, 4)));

    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>

        {/* Title Header Box */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaCalendarAlt className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Department Events
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Browse upcoming and past department events, workshops, and symposiums.
            </p>
          </div>
        </div>

        {/* Search & Academic Year Filter Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Search Events
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by event title, venue, or description..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-xs"
                />
              </div>
            </div>

            {/* Academic Year Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Academic Year
              </label>
              <CustomSelect
                value={academicYear}
                onChange={(value) => setAcademicYear(value)}
                options={academicYearOptions.map((year) => ({
                  value: year.value,
                  label: year.label,
                }))}
                placeholder="All Years"
                buttonClassName="rounded-xl border-slate-300 dark:border-slate-700 py-2.5 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Count summary bar */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Events Grid */}
        {!loading && filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 mx-auto">
              <FaCalendarAlt className="w-6 h-6" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              No events found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Try adjusting your search query or academic year filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
