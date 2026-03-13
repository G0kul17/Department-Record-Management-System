import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SuccessModal from "../../components/ui/SuccessModal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import { getFileUrl } from "../../utils/fileUrl";

const progressOptions = [
  "Registered",
  "Round 1 Qualified",
  "Round 2 Qualified",
  "Round 3 Qualified",
  "Finalist",
  "Winner",
  "Runner-up",
  "Shortlisted",
  "Completed",
  "Not shortlisted",
];

export default function HackathonEntryandProgress() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    student_name: "",
    mobile_number: "",
    team_leader_name: "",
    team_members_count: 1,
    team_member_names: "",
    hackathon_name: "",
    mentor: "",
    hosted_by: "",
    location: "",
    duration_start_date: "",
    duration_end_date: "",
    no_of_rounds: "",
    progress: "",
    prize: "",
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [list, setList] = useState([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [page, setPage] = useState(1);
  const [previewModal, setPreviewModal] = useState({ open: false, item: null });
  const [updateForm, setUpdateForm] = useState({
    duration_end_date: "",
    no_of_rounds: "",
    progress: "Registered",
    prize: "",
  });
  const [updatingResult, setUpdatingResult] = useState(false);

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const data = await apiClient.get("/hackathons?mine=true&limit=100");
      setList(data.hackathons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMine();
      // Pre-fill student name from user profile
      if (user.full_name) {
        setForm((prev) => ({ ...prev, student_name: user.full_name }));
      }
      if (user.phone) {
        setForm((prev) => ({ ...prev, mobile_number: user.phone }));
      }
    }
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [list.length]);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const startIndex = (page - 1) * perPage;
  const pagedList = list.slice(startIndex, startIndex + perPage);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSuccess(false);
    try {
      if (!proof) {
        throw new Error("Please upload proof document.");
      }

      const fd = new FormData();
      fd.append("student_name", form.student_name.trim());
      fd.append("mobile_number", form.mobile_number.trim());
      fd.append("team_leader_name", form.team_leader_name.trim());
      fd.append("team_members_count", form.team_members_count);
      fd.append("team_member_names", form.team_member_names.trim());
      fd.append("hackathon_name", form.hackathon_name.trim());
      if (form.mentor) fd.append("mentor", form.mentor.trim());
      fd.append("hosted_by", form.hosted_by.trim());
      fd.append("location", form.location.trim());
      fd.append("duration_start_date", form.duration_start_date);
      if (form.duration_end_date) fd.append("duration_end_date", form.duration_end_date);
      if (form.no_of_rounds) fd.append("no_of_rounds", form.no_of_rounds);
      fd.append("progress", form.progress);
      if (form.prize) fd.append("prize", form.prize.trim());
      fd.append("proof", proof);

      await apiClient.uploadFile("/hackathons", fd);
      setSuccess(true);
      setMessage("Hackathon entry submitted successfully.");
      setShowSuccess(true);
      setForm({
        student_name: user?.full_name || "",
        mobile_number: user?.phone || "",
        team_leader_name: "",
        team_members_count: 1,
        team_member_names: "",
        hackathon_name: "",
        mentor: "",
        hosted_by: "",
        location: "",
        duration_start_date: "",
        duration_end_date: "",
        no_of_rounds: "",
        progress: "",
        prize: "",
      });
      setProof(null);
      await loadMine();
    } catch (err) {
      setSuccess(false);
      setMessage(err.message || "Failed to submit hackathon entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return badges[status] || badges.pending;
  };

  const getProgressBadge = (progress) => {
    const badges = {
      Registered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "Round 1 Qualified": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      "Round 2 Qualified": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      "Round 3 Qualified": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      Finalist: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Winner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      "Runner-up": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      Shortlisted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      Completed: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      "Not shortlisted": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return badges[progress] || badges.Registered;
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  };

  const openPreview = (item) => {
    setUpdateForm({
      duration_end_date: toDateInputValue(item.duration_end_date),
      no_of_rounds: item.no_of_rounds || "",
      progress: item.progress || "Registered",
      prize: item.prize || "",
    });
    setPreviewModal({ open: true, item });
  };

  const updateResult = async () => {
    if (!previewModal.item?.id) return;
    setUpdatingResult(true);
    setMessage("");
    try {
      await apiClient.patch(`/hackathons/${previewModal.item.id}/student-update`, {
        duration_end_date: updateForm.duration_end_date || null,
        no_of_rounds: updateForm.no_of_rounds ? Number(updateForm.no_of_rounds) : null,
        progress: updateForm.progress,
        prize: updateForm.prize,
      });
      setSuccess(true);
      setMessage("Hackathon result updated and sent for coordinator review.");
      await loadMine();
      setPreviewModal({ open: false, item: null });
    } catch (err) {
      setSuccess(false);
      setMessage(err.message || "Failed to update hackathon result.");
    } finally {
      setUpdatingResult(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-6 sm:py-10">
        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle="Your hackathon entry has been submitted."
          onClose={() => setShowSuccess(false)}
        />
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Hackathon Entry and Progress
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Register your hackathon participation and track your progress.
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
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Submit Hackathon Entry
            </h3>

            {/* Student Details */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Student Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.mobile_number}
                onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                required
              />
            </div>

            {/* Team Details */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Team Leader Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.team_leader_name}
                onChange={(e) => setForm({ ...form, team_leader_name: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Number of Team Members <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.team_members_count}
                onChange={(e) => setForm({ ...form, team_members_count: parseInt(e.target.value, 10) || 1 })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Team Member Names <span className="text-red-600">*</span>
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                rows="3"
                placeholder="Enter all team member names (comma-separated)"
                value={form.team_member_names}
                onChange={(e) => setForm({ ...form, team_member_names: e.target.value })}
                required
              />
            </div>

            {/* Hackathon Details */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Hackathon Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.hackathon_name}
                onChange={(e) => setForm({ ...form, hackathon_name: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Mentor 
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.mentor}
                onChange={(e) => setForm({ ...form, mentor: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Hosted By <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="Organization or institution name"
                value={form.hosted_by}
                onChange={(e) => setForm({ ...form, hosted_by: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Location <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="City or venue"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={form.duration_start_date}
                  onChange={(e) => setForm({ ...form, duration_start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={form.duration_end_date}
                  onChange={(e) => setForm({ ...form, duration_end_date: e.target.value })}
                  min={form.duration_start_date}
                />
              </div>
            </div>

            {/* Rounds and Progress */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Number of Rounds (Optional)
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.no_of_rounds}
                onChange={(e) => setForm({ ...form, no_of_rounds: e.target.value })}
              >
                <option value="">Select rounds</option>
                {Array.from({ length: 10 }).map((_, idx) => {
                  const round = idx + 1;
                  return (
                    <option key={round} value={round}>
                      {round} {round === 1 ? "Round" : "Rounds"}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Progress <span className="text-red-600">*</span>
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
                required
              >
                <option value="">Select progress</option>
                {progressOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Prize (Optional)
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                placeholder="e.g., 1st Prize, Runner-up"
                value={form.prize}
                onChange={(e) => setForm({ ...form, prize: e.target.value })}
              />
            </div>

            {/* Proof Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Proof Document <span className="text-red-600">*</span>
              </label>
              <UploadDropzone
                selectedFile={proof}
                onFileSelected={setProof}
                label="Upload proof (certificate, email, screenshot)"
                subtitle="Allowed: JPEG, JPG, PDF, DOCX, PNG, PPTX"
                accept=".jpeg,.jpg,.pdf,.docx,.png,.pptx"
                maxSizeMB={25}
                required={true}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Entry"}
            </button>
          </form>

          {/* My Entries List */}
          <div className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              My Hackathon Entries
            </h3>
            {loadingMine ? (
              <p className="text-slate-600 dark:text-slate-400">Loading...</p>
            ) : pagedList.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">
                No entries yet. Submit your first hackathon entry above!
              </p>
            ) : (
              <div className="space-y-4">
                {pagedList.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openPreview(item)}
                  >
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      {item.hackathon_name}
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <p><strong>Team Leader:</strong> {item.team_leader_name}</p>
                      <p><strong>Location:</strong> {item.location}</p>
                      <p><strong>Date:</strong> {new Date(item.duration_start_date).toLocaleDateString()}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressBadge(item.progress)}`}>
                          {item.progress}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.verification_status)}`}>
                          {item.verification_status}
                        </span>
                      </div>
                      {item.prize && (
                        <p className="mt-2 text-green-600 dark:text-green-400 font-medium">
                          🏆 {item.prize}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {previewModal.open && previewModal.item && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewModal({ open: false, item: null })}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {previewModal.item.hackathon_name}
                </h3>
                <button
                  onClick={() => setPreviewModal({ open: false, item: null })}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Student Name</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.student_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Mobile</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.mobile_number}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Team Leader</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.team_leader_name}</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Team Members ({previewModal.item.team_members_count})</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.team_member_names}</p>
                </div>
                {previewModal.item.mentor && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Mentor</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.mentor}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Hosted By</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.hosted_by}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Location</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Start Date</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {new Date(previewModal.item.duration_start_date).toLocaleDateString()}
                    </p>
                  </div>
                  {previewModal.item.duration_end_date && (
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">End Date</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {new Date(previewModal.item.duration_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {previewModal.item.no_of_rounds && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Number of Rounds</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.no_of_rounds}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Progress</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProgressBadge(previewModal.item.progress)}`}>
                      {previewModal.item.progress}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(previewModal.item.verification_status)}`}>
                      {previewModal.item.verification_status}
                    </span>
                  </div>
                </div>
                {previewModal.item.prize && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Prize</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">🏆 {previewModal.item.prize}</p>
                  </div>
                )}
                {previewModal.item.proof_filename && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Proof</p>
                    <a
                      href={getFileUrl(previewModal.item.proof_filename)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Proof Document
                    </a>
                  </div>
                )}
                {previewModal.item.verification_comment && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Verification Comment</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{previewModal.item.verification_comment}</p>
                  </div>
                )}

                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
                    Update Result
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={updateForm.duration_end_date}
                        min={toDateInputValue(previewModal.item.duration_start_date)}
                        onChange={(e) =>
                          setUpdateForm((prev) => ({ ...prev, duration_end_date: e.target.value }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        No. of Rounds
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={updateForm.no_of_rounds}
                        onChange={(e) =>
                          setUpdateForm((prev) => ({ ...prev, no_of_rounds: e.target.value }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Progress
                      </label>
                      <select
                        value={updateForm.progress}
                        onChange={(e) =>
                          setUpdateForm((prev) => ({ ...prev, progress: e.target.value }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {progressOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Prize
                      </label>
                      <input
                        type="text"
                        value={updateForm.prize}
                        onChange={(e) =>
                          setUpdateForm((prev) => ({ ...prev, prize: e.target.value }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="e.g., Winner / Runner-up"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={updateResult}
                      disabled={updatingResult}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingResult ? "Updating..." : "Update Result"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
