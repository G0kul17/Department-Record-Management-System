import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";

export default function EventsManagement() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    start_date: "",
    end_date: "",
    event_url: "",
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

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

  const onFiles = (e) => setFiles(Array.from(e.target.files || []));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.venue || !form.description)
      return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("venue", form.venue);
      fd.append("start_date", form.start_date);
      if (form.end_date) fd.append("end_date", form.end_date);
      if (form.event_url) fd.append("event_url", form.event_url);
      for (const f of files) fd.append("files", f);
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
      await load();
    } catch (err) {
      // optionally show error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {successOpen && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
          <div className="flex items-center justify-between">
            <span>Event successfully uploaded.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
              >
                View on Home
              </button>
              <button
                onClick={() => setSuccessOpen(false)}
                className="rounded px-2 py-1 text-xs text-green-800 underline dark:text-green-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        Upload Events
      </h2>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-sm font-medium">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Venue <span className="text-red-600">*</span>
          </label>
          <input
            name="venue"
            value={form.venue}
            onChange={onChange}
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">
            Event URL <span className="text-red-600">*</span>
          </label>
          <input
            type="url"
            name="event_url"
            value={form.event_url}
            onChange={onChange}
            placeholder="https://..."
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Start Date <span className="text-red-600">*</span>
          </label>
          <input
            type="datetime-local"
            name="start_date"
            value={form.start_date}
            onChange={onChange}
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="datetime-local"
            name="end_date"
            value={form.end_date}
            onChange={onChange}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Attachments</label>
          <input type="file" multiple onChange={onFiles} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Upload Event"}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Upcoming Events</h3>
          <button
            onClick={load}
            disabled={loading}
            className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {events.length === 0 && !loading && (
            <div className="text-slate-600 dark:text-slate-300">
              No upcoming events.
            </div>
          )}
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {ev.title}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {ev.venue || ""}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {new Date(ev.start_date).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
