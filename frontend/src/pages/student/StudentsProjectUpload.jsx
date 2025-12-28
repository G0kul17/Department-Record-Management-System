import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SuccessModal from "../../components/ui/SuccessModal";

export default function ProjectUpload() {
  const { user } = useAuth();
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
  const [zipFile, setZipFile] = useState(null);
  const [srsFile, setSrsFile] = useState(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const loadProjects = async (retainExisting = false) => {
    setLoadingProjects(true);
    try {
      const data = await apiClient.get(`/projects?limit=100&mine=true`);
      const list = data.projects || [];
      // If backend returned empty but we have existing (optimistic), retain
      if (list.length === 0 && retainExisting) {
        // keep previous state
      } else {
        setProjects(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadProjects();
  }, [user?.id]);

  // Fallback: load once on mount so the list appears immediately
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      // Basic validation: SRS document is mandatory
      if (!srsFile) {
        throw new Error(
          "Please attach the SRS document (PDF) before uploading."
        );
      }
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
      // Attach mandatory SRS document
      fd.append("srs_document", srsFile);
      // Optional: single ZIP attachment (max 15MB)
      if (zipFile) {
        const sizeLimit = 15 * 1024 * 1024; // 15MB
        const name = zipFile.name || "";
        const ext = name.toLowerCase().split(".").pop();
        const isZip =
          zipFile.type === "application/zip" ||
          zipFile.type === "application/x-zip-compressed" ||
          ext === "zip";
        if (!isZip) throw new Error("Attach files must be a .zip archive.");
        if (zipFile.size > sizeLimit)
          throw new Error("Zip file must be 15MB or smaller.");
        fd.append("files", zipFile);
      }
      const resp = await apiClient.uploadFile("/projects", fd);
      setSuccess(true);
      setMessage("Project uploaded successfully.");
      setShowSuccess(true);
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
      setZipFile(null);
      setSrsFile(null);
      // If response contains project, optimistically prepend before refresh
      if (resp && resp.project) {
        setProjects((prev) => [resp.project, ...prev]);
      }
      await loadProjects(true); // refresh but retain optimistic if API returns empty immediately
    } catch (e) {
      setSuccess(false);
      setMessage(e.message || "Failed to upload project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle="Your project has been uploaded."
          onClose={() => setShowSuccess(false)}
        />
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Upload Project
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Provide basic details and SRS (PDF). Optionally attach a single ZIP
          (max 15MB) containing supporting files. Below you can track
          verification status.
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={submit}
            className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900"
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
                onChange={(e) =>
                  setForm({ ...form, github_url: e.target.value })
                }
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
              {/* Mandatory SRS document */}
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                SRS Document <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setSrsFile((e.target.files && e.target.files[0]) || null)
                }
                className="mt-1 block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#87CEEB] file:px-4 file:py-2 file:text-white hover:file:opacity-90"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Upload your Software Requirement Specification (SRS) as a PDF.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Attach Zip (max 15MB){" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) =>
                  setZipFile((e.target.files && e.target.files[0]) || null)
                }
                className="mt-1 block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#87CEEB] file:px-4 file:py-2 file:text-white hover:file:opacity-90"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Upload a single .zip archive containing your supporting files.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#87CEEB] px-5 py-2 font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Uploading..." : "Upload Project"}
              </button>
            </div>
          </form>
          <div className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                My Projects
              </h3>
              <button
                type="button"
                onClick={loadProjects}
                disabled={loadingProjects}
                className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingProjects ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {projects.length === 0 && !loadingProjects && (
                <div className="text-slate-600 dark:text-slate-300">
                  No projects yet.
                </div>
              )}
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {p.title}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {p.mentor_name || ""}{" "}
                        {p.academic_year && `• ${p.academic_year}`}
                      </div>
                      <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                        Status: {p.status || "ongoing"}
                      </div>
                    </div>
                    {p.verified ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Pending
                      </span>
                    )}
                  </div>
                  {p.created_at && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Uploaded: {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
