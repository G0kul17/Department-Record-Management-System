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
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] p-8 flex items-center justify-center">
          <div className="text-slate-600 font-bold text-sm">Loading event details...</div>
        </div>
      );
    }

    if (!ev) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] p-8 flex flex-col items-center justify-center space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900">Event not found</h3>
          <Link
            to="/events"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Back to events
          </Link>
        </div>
      );
    }

    if (ev.event_url) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] p-8 flex flex-col items-center justify-center space-y-3">
          <h3 className="text-xl font-extrabold text-slate-900">
            Redirecting to external event link…
          </h3>
          <p className="text-sm text-slate-600 font-medium">
            If you are not redirected,{" "}
            <a
              href={ev.event_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold underline"
            >
              open link manually
            </a>
            .
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] p-6 sm:p-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            Back to Events
          </button>

          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200 mb-3">
                <FaCalendarAlt className="w-3 h-3" /> Event Details
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {ev.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {ev.venue} •{" "}
                {ev.start_date ? new Date(ev.start_date).toLocaleString() : ""}
                {ev.end_date ? ` – ${new Date(ev.end_date).toLocaleString()}` : ""}
              </p>
            </div>

            <p className="text-base text-slate-700 font-medium leading-relaxed border-t border-slate-100 pt-6">
              {ev.description}
            </p>

            {ev.attachments && ev.attachments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Attachments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ev.attachments.map((a, idx) => (
                    <a
                      key={idx}
                      href={normalizeEventFileUrl(a?.url || a)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
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
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Home
          </button>
        </div>

        {/* Title Header Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs flex-shrink-0">
            <FaCalendarAlt className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Department Events
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Browse upcoming and past department events, workshops, and symposiums.
            </p>
          </div>
        </div>

        {/* Search & Academic Year Filter Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Search Events
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by event title, venue, or description..."
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            {/* Academic Year Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
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
                buttonClassName="rounded-xl border-slate-300 py-2.5 text-slate-900 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Count summary bar */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500">
            Showing {filtered.length} of {events.length} events
          </p>
        </div>

        {/* Events Grid */}
        {!loading && filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-sm space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">
              No events found
            </h3>
            <p className="text-xs text-slate-500 font-medium">
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
