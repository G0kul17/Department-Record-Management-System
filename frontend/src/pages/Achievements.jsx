import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";

export default function Achievements() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    date: "",
    proof_file_url: "",
    event_id: "",
    name: "",
    post: false,
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [list, setList] = useState([]);

  const loadMine = async () => {
    try {
      const data = await apiClient.get(`/achievements?limit=100`);
      const mine = (data.achievements || []).filter(
        (a) => a.user_email === user?.email
      );
      setList(mine);
    } catch (e) {
      console.error(e);
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
        const allowed = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
        ];
        if (!allowed.includes(proof.type)) {
          setMessage("Please upload PDF or image");
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
      if (form.proof_file_url) fd.append("proof_file_url", form.proof_file_url);
      if (form.event_id) fd.append("event_id", form.event_id);
      if (form.name) fd.append("name", form.name);
      fd.append("post_to_community", form.post ? "true" : "false");
      if (proof) fd.append("proof", proof);
      await apiClient.uploadFile("/achievements", fd);
      setSuccess(true);
      setMessage("Achievement submitted successfully.");
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-extrabold text-slate-800">
          Add Achievement
        </h2>
        <p className="text-slate-600 mb-6">
          Provide details and optionally upload a proof document.
        </p>

        {message && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${
              success
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
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
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block text-sm font-medium text-slate-700">
              Title *
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Issuer *
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Date of Award *
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Project File URL *
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.proof_file_url}
                  onChange={(e) =>
                    setForm({ ...form, proof_file_url: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Event ID
                </label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.event_id}
                  onChange={(e) =>
                    setForm({ ...form, event_id: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Name of the Student
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Proof (PDF/Image) *
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
              />
            </div>

            <label className="mt-4 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.post}
                onChange={(e) => setForm({ ...form, post: e.target.checked })}
              />
              <span className="text-sm text-slate-700">Post to community</span>
            </label>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Achievement"}
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800">My Submissions</h3>
            <div className="mt-4 space-y-3">
              {list.length === 0 && (
                <div className="text-slate-600">No achievements yet.</div>
              )}
              {list.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {a.title}
                      </div>
                      <div className="text-sm text-slate-600">
                        {a.issuer || ""}
                      </div>
                    </div>
                    {a.verified ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    )}
                  </div>
                  {a.date_of_award && (
                    <div className="mt-1 text-xs text-slate-500">
                      Awarded: {new Date(a.date_of_award).toLocaleDateString()}
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
