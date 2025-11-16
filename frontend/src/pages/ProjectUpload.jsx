import React, { useState } from "react";
import apiClient from "../api/axiosClient";

export default function ProjectUpload() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    mentor_name: "",
    academic_year: "",
    status: "ongoing",
    team_members_count: "",
    team_members: [], // dynamic list of names
    github_url: "",
  });
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.description) fd.append("description", form.description);
      fd.append("mentor_name", form.mentor_name);
      if (form.academic_year) fd.append("academic_year", form.academic_year);
      if (form.status) fd.append("status", form.status);
      if (form.github_url) fd.append("github_url", form.github_url);
      if (form.team_members_count)
        fd.append("team_members_count", String(form.team_members_count).trim());
      if (Array.isArray(form.team_members) && form.team_members.length)
        fd.append(
          "team_member_names",
          form.team_members
            .map((s) => s?.trim())
            .filter(Boolean)
            .join(", ")
        );
      for (const f of files) fd.append("files", f);
      await apiClient.uploadFile("/projects", fd);
      setSuccess(true);
      setMessage("Project uploaded successfully.");
      setForm({
        title: "",
        description: "",
        mentor_name: "",
        academic_year: "",
        status: "ongoing",
        team_members_count: "",
        team_members: [],
        github_url: "",
      });
      setFiles([]);
    } catch (e) {
      setSuccess(false);
      setMessage(e.message || "Failed to upload project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Upload Project
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Provide basic details and attach related files (SRS, PPT, papers, code
          ZIP, etc.).
        </p>

        {message && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${
              success
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {success ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="mt-0.5 h-5 w-5"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path
                  d="M8 12l2.5 2.5L16 9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="mt-0.5 h-5 w-5"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path
                  d="M15 9l-6 6M9 9l6 6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className="font-medium">{message}</div>
          </div>
        )}

        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Mentor Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Prof. S. Kumar"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
                value={form.mentor_name}
                onChange={(e) =>
                  setForm({ ...form, mentor_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Academic Year <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="2025-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
                value={form.academic_year}
                onChange={(e) =>
                  setForm({ ...form, academic_year: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Status <span className="text-red-600">*</span>
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                required
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Project GitHub URL <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://github.com/username/repo"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
              value={form.github_url}
              onChange={(e) => setForm({ ...form, github_url: e.target.value })}
            />
          </div>

          {/* Team details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Total Team Members <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                placeholder="e.g., 3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
                value={form.team_members_count}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = Math.max(
                    1,
                    Math.min(10, parseInt(raw || "", 10) || 0)
                  );
                  const next = [...(form.team_members || [])];
                  if (n > next.length) {
                    while (next.length < n) next.push("");
                  } else if (n < next.length) {
                    next.length = n;
                  }
                  setForm({
                    ...form,
                    team_members_count: raw,
                    team_members: next,
                  });
                }}
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-3">
              {Number(form.team_members_count) > 0 &&
                (form.team_members || []).map((name, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Team Member {idx + 1}{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`Name of member ${idx + 1}`}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
                      value={name}
                      onChange={(e) => {
                        const next = [...(form.team_members || [])];
                        next[idx] = e.target.value;
                        setForm({ ...form, team_members: next });
                      }}
                      required
                    />
                  </div>
                ))}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We’ll save the names in order you enter.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Attach Files <span className="text-red-600">*</span>
            </label>
            <input
              type="file"
              multiple
              accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,image/*,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="mt-1 block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You can attach SRS, PPT, research papers, code ZIP, and other
              supporting files.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Upload Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
