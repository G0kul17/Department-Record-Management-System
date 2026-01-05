import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SuccessModal from "../../components/ui/SuccessModal";
import UploadDropzone from "../../components/ui/UploadDropzone";

export default function Achievements() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    date: "",
    event_id: "",
    name: "",
    post: false,
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [list, setList] = useState([]);
  const [loadingMine, setLoadingMine] = useState(false);

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const data = await apiClient.get(`/achievements?limit=100`);
      const mine = (data.achievements || []).filter(
        (a) => a.user_email === user?.email
      );
      setList(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSuccess(false);
    try {
      // Client-side file type guard for better UX
      if (proof) {
        const allowed = new Set([
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
          // Common Windows/IE legacy aliases
          "image/x-png",
          "image/pjpeg",
        ]);
        const typeOk = allowed.has(proof.type);
        const name = proof.name || proof.filename || "";
        const ext = name.toLowerCase().split(".").pop();
        const extOk = ["pdf", "png", "jpg", "jpeg"].includes(ext);
        if (!(typeOk || extOk)) {
          setMessage("Please upload a PDF or JPG/PNG image");
          setSuccess(false);
          setSubmitting(false);
          return;
        }
      }
      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.issuer) fd.append("issuer", form.issuer);
      if (form.date) fd.append("date_of_award", form.date);
      if (form.date) fd.append("date", form.date); // also send generic 'date' for backend column
      if (form.event_id) fd.append("event_id", form.event_id);
      if (form.title) fd.append("activity_type", form.title);
      if (form.name) fd.append("name", form.name);
      fd.append("post_to_community", form.post ? "true" : "false");
      if (proof) fd.append("proof", proof);
      await apiClient.uploadFile("/achievements", fd);
      setSuccess(true);
      setMessage("Achievement submitted successfully.");
      setShowSuccess(true);
      setForm({
        title: "",
        issuer: "",
        date: "",
        proof_file_url: "",
        event_id: "",
        name: "",
        post: false,
      });
      setProof(null);
      await loadMine();
    } catch (err) {
      setSuccess(false);
      setMessage(err.message || "Failed to submit achievement.");
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff =
    (user?.role || "").toLowerCase() === "staff" ||
    (user?.role || "").toLowerCase() === "admin";
  const nameLabel = isStaff ? "Name of the Staff" : "Name of the Student";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle="Your achievement has been submitted."
          onClose={() => setShowSuccess(false)}
        />
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Add Achievement
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Provide details and optionally upload a proof document.
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
            className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Title <span className="text-red-600">*</span>
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            >
              <option value="">Select a title</option>
              <option>Hackathon</option>
              <option>Paper presentation</option>
              <option>Coding competition</option>
              <option>Conference presentation</option>
              <option>Journal publications</option>
              <option>NPTEL certificate</option>
              <option>Internship certificate</option>
              <option>Other MOOC courses</option>
            </select>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Issuer <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Date of Award <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Event Name{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={form.event_id}
                  onChange={(e) =>
                    setForm({ ...form, event_id: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {nameLabel} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="mt-4">
              <UploadDropzone
                label="Upload and attach proof"
                subtitle="PDF or image (jpeg, jpg, png)"
                accept=".pdf,.png,.jpg,.jpeg"
                maxSizeMB={25}
                selectedFile={proof}
                onFileSelected={(f) => setProof(f)}
              />
            </div>

            <label className="mt-4 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.post}
                onChange={(e) => setForm({ ...form, post: e.target.checked })}
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Post to community
              </span>
            </label>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#87CEEB] px-5 py-2 font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Achievement"}
              </button>
            </div>
          </form>

          <div className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                My Submissions
              </h3>
              <button
                type="button"
                onClick={loadMine}
                disabled={loadingMine}
                className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingMine ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {list.length === 0 && (
                <div className="text-slate-600 dark:text-slate-300">
                  No achievements yet.
                </div>
              )}
              {list.map((a) => {
                const isApproved =
                  (a.verification_status || "").toLowerCase() === "approved" ||
                  a.verified === true;
                const isRejected =
                  (a.verification_status || "").toLowerCase() === "rejected";
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {a.title}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {a.issuer || ""}
                        </div>
                      </div>
                      {isApproved ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          Approved
                        </span>
                      ) : isRejected ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          Rejected
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Pending
                        </span>
                      )}
                    </div>
                    {a.date_of_award && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Awarded:{" "}
                        {new Date(a.date_of_award).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
