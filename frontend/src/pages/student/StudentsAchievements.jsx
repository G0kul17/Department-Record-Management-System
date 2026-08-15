import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SuccessModal from "../../components/ui/SuccessModal";
import CustomSelect from "../../components/ui/CustomSelect";
import { getFileUrl } from "../../utils/fileUrl";
import { loadAchievementTypes } from "../../utils/achievementTypes";
import {
  FaTrophy,
  FaArrowLeft,
  FaUpload,
  FaFileAlt,
  FaImage,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSyncAlt,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
} from "react-icons/fa";
import RecordLoader from "../../components/ui/RecordLoader";

export default function Achievements() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    date: "",
    event_name: "",
    name: "",
    post: false,
    prize_amount: "",
    position: "",
  });
  const [proof, setProof] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [eventPhotos, setEventPhotos] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [list, setList] = useState([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [page, setPage] = useState(1);
  const [previewModal, setPreviewModal] = useState({ open: false, item: null });
  const [achievementTypes, setAchievementTypes] = useState([]);

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const data = await apiClient.get("/achievements?mine=true&limit=100");
      setList(data.achievements || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMine();
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const types = await loadAchievementTypes();
      if (mounted) setAchievementTypes(types);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [list.length]);

  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const startIndex = (page - 1) * perPage;
  const pagedList = list.slice(startIndex, startIndex + perPage);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSuccess(false);
    try {
      if (!certificate || !eventPhotos || !proof) {
        throw new Error(
          "Please upload certificate, event photos, and thumbnail proofs."
        );
      }

      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.issuer) fd.append("issuer", form.issuer);
      if (form.date) fd.append("date_of_award", form.date);
      if (form.date) fd.append("date", form.date);
      if (form.event_name) fd.append("event_name", form.event_name);
      if (form.title) fd.append("activity_type", form.title);
      if (form.name) fd.append("name", form.name);
      if (form.prize_amount) fd.append("prize_amount", form.prize_amount);
      if (form.position) fd.append("position", form.position);
      fd.append("post_to_community", form.post ? "true" : "false");
      if (proof) fd.append("proof", proof);
      if (certificate) fd.append("certificate", certificate);
      if (eventPhotos) fd.append("event_photos", eventPhotos);
      await apiClient.uploadFile("/achievements", fd);
      setSuccess(true);
      setMessage("Achievement submitted successfully.");
      setShowSuccess(true);
      setForm({
        title: "",
        issuer: "",
        date: "",
        proof_file_url: "",
        event_name: "",
        name: "",
        post: false,
        prize_amount: "",
        position: "",
      });
      setProof(null);
      setCertificate(null);
      setEventPhotos(null);
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      {submitting && <RecordLoader text="Uploading Achievement Record..." fullScreen={true} />}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle="Your achievement has been submitted."
          onClose={() => setShowSuccess(false)}
        />

        {/* Top Navigation Row */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Card */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <FaTrophy className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Add Achievement
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Submit your paper, hackathon, coding competition or certification award.
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm ${
              success
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-rose-300 bg-rose-50 text-rose-900"
            }`}
          >
            {success ? (
              <FaCheckCircle className="mt-0.5 h-5 w-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <FaTimesCircle className="mt-0.5 h-5 w-5 text-rose-600 flex-shrink-0" />
            )}
            <div>{message}</div>
          </div>
        )}

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Panel (7 cols) */}
          <form
            onSubmit={submit}
            className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <FaUpload className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                Achievement Details
              </h2>
            </div>

            {/* Title Select */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Title <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                value={form.title}
                onChange={(value) => setForm({ ...form, title: value })}
                options={achievementTypes}
                placeholder="Select a title"
                required
                name="achievement_title"
                buttonClassName="rounded-xl border-slate-300 py-2.5 text-slate-900 font-semibold"
              />
            </div>

            {/* Issuer & Date of Award Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issuer <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter issuer name"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Award <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Event Name & Position Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Name{" "}
                  <span className="text-slate-400 font-normal text-[11px]">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter event name"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.event_name}
                  onChange={(e) =>
                    setForm({ ...form, event_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Position{" "}
                  <span className="text-slate-400 font-normal text-[11px]">
                    (optional)
                  </span>
                </label>
                <CustomSelect
                  value={form.position}
                  onChange={(value) => setForm({ ...form, position: value })}
                  options={[
                    { value: "1st", label: "1st Place" },
                    { value: "2nd", label: "2nd Place" },
                    { value: "3rd", label: "3rd Place" },
                  ]}
                  placeholder="Select position"
                  buttonClassName="rounded-xl border-slate-300 py-2.5 text-slate-900 font-semibold"
                />
              </div>
            </div>

            {/* Name of Staff / Student */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                {nameLabel} <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter staff name"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Prize Amount */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Prize Amount{" "}
                <span className="text-slate-400 font-normal text-[11px]">
                  (optional)
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-600 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-slate-300 pl-8 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.prize_amount}
                  onChange={(e) =>
                    setForm({ ...form, prize_amount: e.target.value })
                  }
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>

            {/* Upload Documents Section */}
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FaUpload className="w-3.5 h-3.5 text-blue-600" />
                  Upload Documents
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  All files are mandatory
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FilePickerCard
                  title="Upload Certificate"
                  required
                  badgeBg="bg-purple-100 text-purple-600"
                  icon={FaFileAlt}
                  selectedFile={certificate}
                  onSelect={(file) => setCertificate(file)}
                />

                <FilePickerCard
                  title="Upload Event Photos"
                  required
                  badgeBg="bg-emerald-100 text-emerald-600"
                  icon={FaImage}
                  selectedFile={eventPhotos}
                  onSelect={(file) => setEventPhotos(file)}
                />

                <FilePickerCard
                  title="Thumbnail"
                  required
                  badgeBg="bg-amber-100 text-amber-600"
                  icon={FaImage}
                  selectedFile={proof}
                  onSelect={(file) => setProof(file)}
                />
              </div>
            </div>

            {/* Post to Community Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.post}
                  onChange={(e) => setForm({ ...form, post: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Post to community
                  </span>
                  <p className="text-xs text-slate-500 font-medium">
                    Allow this achievement to be visible in the community section.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold px-6 py-2.5 text-sm shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <FaUpload className="w-3.5 h-3.5" />
                {submitting ? "Submitting..." : "Submit Achievement"}
              </button>

              <button
                type="button"
                onClick={() => setForm({
                  title: "",
                  issuer: "",
                  date: "",
                  event_name: "",
                  name: "",
                  post: false,
                  prize_amount: "",
                  position: "",
                })}
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-extrabold px-6 py-2.5 text-sm shadow-sm transition cursor-pointer"
              >
                Save as Draft
              </button>
            </div>
          </form>

          {/* Right Column: My Submissions Panel */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <FaTrophy className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    My Submissions
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={loadMine}
                  disabled={loadingMine}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <FaSyncAlt className={`w-3 h-3 ${loadingMine ? "animate-spin" : ""}`} />
                  {loadingMine ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="space-y-3.5">
                {list.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm font-semibold">
                    No achievements submitted yet.
                  </div>
                )}

                {pagedList.map((a) => {
                  const isApproved =
                    (a.verification_status || "").toLowerCase() === "approved" ||
                    a.verified === true;
                  const isRejected =
                    (a.verification_status || "").toLowerCase() === "rejected";

                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-slate-200/90 p-4 bg-white hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 shadow-sm flex-shrink-0">
                          <FaTrophy className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {a.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold truncate">
                            {a.issuer || "Department"}
                          </p>
                          {a.date_of_award && (
                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                              Awarded: {new Date(a.date_of_award).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {/* High-contrast Crisp View Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewModal({ open: true, item: a })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] px-3.5 py-1 text-xs font-extrabold shadow-sm transition cursor-pointer"
                        >
                          <FaEye className="w-3 h-3 text-[#0284c7]" />
                          View
                        </button>

                        {/* High-contrast Status Badges */}
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-0.5 text-xs font-extrabold text-[#047857] shadow-sm">
                            <FaCheck className="w-2.5 h-2.5 text-[#047857]" /> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] px-3 py-0.5 text-xs font-extrabold text-[#be123c] shadow-sm">
                            <FaTimesCircle className="w-2.5 h-2.5 text-[#be123c]" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fffbeb] border border-[#fde68a] px-3 py-0.5 text-xs font-extrabold text-[#b45309] shadow-sm">
                            <FaClock className="w-2.5 h-2.5 text-[#b45309]" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination controls */}
            {list.length > perPage && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <FaChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  Next <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Preview Modal */}
      {previewModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setPreviewModal({ open: false, item: null })}
        >
          <div
            className="max-w-2xl w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200">
                  <FaTrophy className="w-3 h-3" /> Achievement Preview
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                  {previewModal.item?.title || "Achievement"}
                </h3>
              </div>
              <button
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-1.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                onClick={() => setPreviewModal({ open: false, item: null })}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Title", value: previewModal.item?.title || "-" },
                { label: "Issuer", value: previewModal.item?.issuer || "-" },
                {
                  label: "Award Date",
                  value: previewModal.item?.date_of_award
                    ? new Date(previewModal.item.date_of_award).toLocaleDateString()
                    : "-",
                },
                { label: "Name", value: previewModal.item?.name || "-" },
                ...(previewModal.item?.event_name
                  ? [{ label: "Event Name", value: previewModal.item.event_name }]
                  : []),
                ...(previewModal.item?.position
                  ? [{ label: "Position", value: previewModal.item.position }]
                  : []),
                ...(previewModal.item?.prize_amount
                  ? [
                      {
                        label: "Prize Amount",
                        value: `₹${parseFloat(previewModal.item.prize_amount).toFixed(2)}`,
                      },
                    ]
                  : []),
                {
                  label: "Status",
                  value:
                    previewModal.item?.verification_status === "approved" ||
                    previewModal.item?.verified
                      ? "Approved"
                      : previewModal.item?.verification_status === "rejected"
                      ? "Rejected"
                      : "Pending",
                },
              ].map((field) => (
                <div
                  key={field.label}
                  className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100"
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {field.label}
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-slate-900 break-words">
                    {field.value}
                  </div>
                </div>
              ))}

              {/* Proof File */}
              {previewModal.item?.proof_filename && (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Main Proof
                  </div>
                  {previewModal.item?.proof_mime?.startsWith("image/") ? (
                    <img
                      alt="Proof"
                      src={getFileUrl(previewModal.item?.proof_filename)}
                      className="max-h-80 w-full rounded-xl border border-slate-200 object-contain bg-white"
                    />
                  ) : (
                    <a
                      href={getFileUrl(previewModal.item?.proof_filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {previewModal.item?.proof_name || "Download Proof"}
                    </a>
                  )}
                </div>
              )}

              {/* Certificate File */}
              {previewModal.item?.certificate_filename && (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Certificate
                  </div>
                  {previewModal.item?.certificate_mime?.startsWith("image/") ? (
                    <img
                      alt="Certificate"
                      src={getFileUrl(previewModal.item?.certificate_filename)}
                      className="max-h-80 w-full rounded-xl border border-slate-200 object-contain bg-white"
                    />
                  ) : (
                    <a
                      href={getFileUrl(previewModal.item?.certificate_filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {previewModal.item?.certificate_name || "Download Certificate"}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// File Picker Subcomponent with high contrast
function FilePickerCard({
  title,
  required,
  badgeBg,
  icon: Icon,
  selectedFile,
  onSelect,
}) {
  const fileInputRef = React.useRef(null);

  return (
    <div
      onClick={() => fileInputRef.current && fileInputRef.current.click()}
      className="group border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-between"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${badgeBg} shadow-sm group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="text-xs font-extrabold text-slate-900 leading-tight">
          {title} {required && <span className="text-rose-600">*</span>}
        </div>
        <p className="text-[11px] text-blue-600 font-extrabold">
          <span className="underline">Click to upload</span> or drag and drop
        </p>
        <p className="text-[10px] text-slate-500 font-semibold">
          (Max. file size: 25 MB)
        </p>
      </div>

      {selectedFile && (
        <div className="mt-3 w-full bg-emerald-50 border border-emerald-300 rounded-xl p-1.5 text-[11px] font-extrabold text-emerald-800 truncate">
          ✓ {selectedFile.name}
        </div>
      )}
    </div>
  );
}
