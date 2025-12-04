import React, { useState } from "react";
import apiClient from "../../api/axiosClient";

export default function AdminFacultyParticipation() {
  const [form, setForm] = useState({
    faculty_name: "",
    department: "",
    type_of_event: "",
    publications_type: "",
    mode_of_training: "",
    title: "",
    start_date: "",
    end_date: "",
    conducted_by: "",
    details: "",
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ""));
      if (proof) fd.append("proof", proof);
      await apiClient.uploadFile("/faculty-participations", fd);
      setMessage("Faculty participation added");
      setForm({
        faculty_name: "",
        department: "",
        type_of_event: "",
        mode_of_training: "",
        title: "",
        start_date: "",
        end_date: "",
        conducted_by: "",
        details: "",
      });
      setProof(null);
    } catch (err) {
      setMessage(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Admin: Faculty Participation
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Create participation entries on behalf of faculty.
      </p>
      {message && (
        <div className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-slate-800 dark:text-slate-200">
          {message}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Faculty Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Faculty Name <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.faculty_name}
                onChange={update("faculty_name")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Department <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.department}
                onChange={update("department")}
                required
              >
                <option value="">Select Department</option>
                <option value="B.Tech Information Technology">
                  B.Tech Information Technology
                </option>
                <option value="B.Tech Artificial Intelligence and Data Science">
                  B.Tech Artificial Intelligence and Data Science
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Event / Training
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Type of Event <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.type_of_event}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    type_of_event: v,
                    publications_type:
                      v === "Others" ? f.publications_type : "",
                  }));
                }}
                required
              >
                <option value="">Select Type</option>
                <option value="FDP">FDP</option>
                <option value="Webinar">Webinar</option>
                <option value="Seminar">Seminar</option>
                <option value="Online Certification">
                  Online Certification
                </option>
                <option value="NPTEL Online Certification">
                  NPTEL Online Certification
                </option>
                <option value="NPTEL - FDP">NPTEL - FDP</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="STTP">STTP</option>
                <option value="Professional Development Course">
                  Professional Development Course
                </option>
                <option value="Others">Others</option>
              </select>
            </div>
            {form.type_of_event === "Others" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Publications <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.publications_type}
                  onChange={update("publications_type")}
                  required
                >
                  <option value="">Select Publication Type</option>
                  <option value="Journal Publications">
                    Journal Publications
                  </option>
                  <option value="Conference Publications">
                    Conference Publications
                  </option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mode of Training <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.mode_of_training}
                onChange={update("mode_of_training")}
                required
              >
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.title}
                onChange={update("title")}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.start_date}
                  onChange={update("start_date")}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.end_date}
                  onChange={update("end_date")}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Conducted By <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.conducted_by}
                onChange={update("conducted_by")}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Details <span className="text-red-600">*</span>
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              rows={4}
              value={form.details}
              onChange={update("details")}
              required
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Attachments
          </h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Proof (PDF/Image) <span className="text-red-600">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setProof(e.target.files?.[0] || null)}
            className="block w-full text-sm"
            required
          />
        </section>

        <div className="flex justify-end">
          <button
            disabled={submitting}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
