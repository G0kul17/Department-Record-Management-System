import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import {
  FaCalendarAlt,
  FaArrowLeft,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaPlusCircle,
  FaSync,
  FaClock,
} from "react-icons/fa";

export default function EventsManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const backTarget = isAdmin ? "/admin/quick-actions" : "/quick-actions";
  const backText = isAdmin ? "Back to Admin Quick Actions" : "Back to Quick Actions";

  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    start_date: "",
    end_date: "",
    event_url: "",
  });
  const [files, setFiles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/events?upcomingOnly=true");
      setEvents(data.events || []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFiles = (list) => setFiles(Array.from(list || []));
  const onThumbnail = (file) => setThumbnail(file || null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.venue || !form.description) {
      setErrorMsg("Please fill Title, Description, Venue and Start Date.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("venue", form.venue);
      fd.append("start_date", form.start_date);
      if (form.end_date) fd.append("end_date", form.end_date);
      if (form.event_url) fd.append("event_url", form.event_url);
      for (const f of files) fd.append("attachments", f);
      if (thumbnail) fd.append("thumbnail", thumbnail);
      await apiClient.uploadFile("/events-admin", fd);
      setSuccessOpen(true);
      setForm({
        title: "",
        description: "",
        venue: "",
        start_date: "",
        end_date: "",
        event_url: "",
      });
      setFiles([]);
      setThumbnail(null);
      await load();
    } catch (err) {
      setErrorMsg(err?.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => navigate(backTarget)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            {backText}
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-xs flex-shrink-0">
            <FaCalendarAlt className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Upload Department Events
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Create and publish new workshops, hackathons, guest lectures, and symposiums.
            </p>
          </div>
        </div>

        <SuccessModal
          open={successOpen}
          title="Event Created Successfully"
          subtitle="Your department event has been published and is visible to students and faculty."
          onClose={() => setSuccessOpen(false)}
        />

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 shadow-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
          {/* Main Event Form Card */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <FaPlusCircle className="text-orange-500 w-4 h-4" />
              Event Details & Specifications
            </h2>

            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Event Title <span className="text-orange-600">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="e.g. AI & ML Workshop 2026"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-600 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Venue / Location <span className="text-orange-600">*</span>
                </label>
                <input
                  name="venue"
                  value={form.venue}
                  onChange={onChange}
                  placeholder="e.g. IT Lab 3 / Mini Auditorium"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-600 shadow-xs"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Description <span className="text-orange-600">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Briefly describe the event objective, agenda, and target audience..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-600 shadow-xs"
                  rows={2}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Registration / External URL (Optional)
                </label>
                <input
                  type="url"
                  name="event_url"
                  value={form.event_url}
                  onChange={onChange}
                  placeholder="https://forms.gle/... or https://event-site.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date & Time <span className="text-orange-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={form.start_date}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-600 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={form.end_date}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-600 shadow-xs"
                />
              </div>

              {/* Side by side dropzones */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <UploadDropzone
                  label="Attach Event Resources (PDFs/Docs)"
                  subtitle="Add brochures, rules, or agenda documents"
                  accept=".pdf,image/*"
                  multiple
                  selectedFiles={files}
                  onFilesSelected={(fs) => onFiles(fs)}
                />

                <UploadDropzone
                  label="Event Thumbnail Image"
                  subtitle="Upload banner image for student event cards"
                  accept="image/*"
                  multiple={false}
                  selectedFile={thumbnail}
                  onFileSelected={(f) => onThumbnail(f)}
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <FaPlusCircle className="w-3.5 h-3.5" />
                  {submitting ? "Publishing Event..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>

          {/* Upcoming Events Sidebar */}
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-slate-900">Upcoming Events</h3>
                </div>
                <button
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 transition cursor-pointer"
                >
                  <FaSync className={`w-2.5 h-2.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {events.length === 0 && !loading && (
                  <div className="text-center py-6 text-xs font-bold text-slate-400">
                    No active upcoming events published.
                  </div>
                )}
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 hover:bg-white hover:shadow-xs hover:border-orange-300 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">
                        {ev.title}
                      </h4>
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.delete(`/events-admin/${ev.id}`);
                            await load();
                          } catch (e) {}
                        }}
                        title="Delete Event"
                        className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                      >
                        <FaTrashAlt className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-0.5 text-[11px] text-slate-600 font-medium">
                      {ev.venue && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <FaMapMarkerAlt className="w-2.5 h-2.5 text-orange-500 flex-shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <FaClock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                        <span>{new Date(ev.start_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </div>

                    {ev.event_url && (
                      <div className="pt-0.5">
                        <a
                          href={ev.event_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:underline"
                        >
                          <FaExternalLinkAlt className="w-2 h-2" />
                          Registration Link
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
