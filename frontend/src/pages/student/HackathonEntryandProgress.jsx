import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SuccessModal from "../../components/ui/SuccessModal";
import CustomSelect from "../../components/ui/CustomSelect";
import { getFileUrl } from "../../utils/fileUrl";
import { jsPDF } from "jspdf";
import {
  FaLaptopCode,
  FaArrowLeft,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSyncAlt,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaTrophy,
  FaFilePdf,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUserFriends,
  FaUser,
  FaPhoneAlt,
  FaUserPlus,
  FaBuilding,
  FaPaperPlane,
  FaRegFileAlt,
  FaChartLine,
  FaHourglassHalf,
  FaCircle,
  FaThList,
  FaGift,
  FaRocket,
} from "react-icons/fa";
import RecordLoader from "../../components/ui/RecordLoader";

const progressOptions = [
  "Completed",
  "Finalist",
  "Not shortlisted",
  "Registered",
  "Round 1 Qualified",
  "Round 2 Qualified",
  "Round 3 Qualified",
  "Runner-up",
  "Shortlisted",
  "Winner",
];

export default function HackathonEntryandProgress() {
  const nav = useNavigate();
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
    progress: "Registered",
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
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    duration_end_date: "",
    no_of_rounds: "",
    progress: "Registered",
    prize: "",
  });
  const [updatingResult, setUpdatingResult] = useState(false);

  const formatDate = (value) => {
    if (!value) return "N/A";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "N/A";
    return dt.toLocaleDateString("en-GB");
  };

  const safeFilePart = (value, fallback) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  };

  const buildOdSerialNumber = (item) => {
    const entryId = item?.id ? String(item.id).padStart(4, "0") : "DRAFT";
    const startDate = item?.duration_start_date ? new Date(item.duration_start_date) : new Date();
    const year = Number.isNaN(startDate.getTime()) ? new Date().getFullYear() : startDate.getFullYear();
    return `SCT/IT/OD/HACK/${year}/${entryId}`;
  };

  const downloadOdLetterPdf = (item) => {
    if (!item) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const addTextBlock = (text, spacing = 5, size = 11) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * spacing;
    };

    const registerNumber =
      user?.register_number || user?.registerNumber || user?.register_no || "________________";
    const odSerialNumber = buildOdSerialNumber(item);
    const today = new Date().toLocaleDateString("en-GB");

    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text("SONA COLLEGE OF TECHNOLOGY - SALEM", pageWidth / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(13);
    doc.text("DEPARTMENT OF INFORMATION TECHNOLOGY", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(14);
    doc.text("ON-DUTY REQUEST LETTER", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`OD Serial Register No: ${odSerialNumber}`, margin, y);
    y += 6;
    doc.text(`Date: ${today}`, pageWidth - margin, y, { align: "right" });
    y += 10;

    addTextBlock(
      `FROM:\n${item.student_name || user?.full_name || "N/A"}\nRegister Number: ${registerNumber}\nMobile Number: ${
        item.mobile_number || user?.phone || "N/A"
      }\nDepartment of Information Technology`,
      5,
      11
    );
    y += 3;

    addTextBlock(
      "TO:\nThe Head of the Department,\nDepartment of Information Technology,\nSona College of Technology - Salem.",
      5,
      11
    );
    y += 3;

    addTextBlock(
      `SUBJECT: Request for On-Duty Permission to Participate in ${item.hackathon_name || "Hackathon"}`,
      5,
      11
    );
    y += 3;

    addTextBlock("Respected Sir/Madam,");

    addTextBlock(
      `I respectfully request On-Duty permission for my participation in the hackathon "${
        item.hackathon_name || "N/A"
      }", organized by ${item.hosted_by || "N/A"} at ${item.location || "N/A"}. ` +
        `The event duration is from ${formatDate(item.duration_start_date)} to ${formatDate(item.duration_end_date)}.`
    );

    addTextBlock(
      `Participation Details:\n` +
        `Team Leader: ${item.team_leader_name || "N/A"}\n` +
        `Team Members (${item.team_members_count || 1}): ${item.team_member_names || "N/A"}\n` +
        `Mentor: ${item.mentor || "________________"}\n` +
        `Current Progress: ${item.progress || "Registered"}${
          item.no_of_rounds ? `\nNumber of Rounds: ${item.no_of_rounds}` : ""
        }${item.prize ? `\nResult/Prize: ${item.prize}` : ""}`
    );

    addTextBlock(
      "I kindly request you to grant me On-Duty permission for the above period. I assure you that I will submit all relevant proofs and updates after the event."
    );
    y += 2;

    addTextBlock("Thank you.");
    y += 8;

    doc.text("Yours faithfully,", margin, y);
    y += 6;
    doc.text("Student Signature: __________________________", margin, y);
    y += 16;

    doc.setFont("times", "bold");
    doc.text("Recommended / Approved Signatures", margin, y);
    y += 8;
    doc.setFont("times", "normal");

    const colWidth = contentWidth / 2;
    doc.text("Mentor", margin, y + 8);
    doc.text("Class Counsellor", margin + colWidth, y + 8);
    doc.line(margin, y, margin + colWidth - 8, y);
    doc.line(margin + colWidth, y, pageWidth - margin, y);

    y += 24;
    doc.text("Hackathon Coordinator", margin, y + 8);
    doc.text("HOD/Deputy HOD", margin + colWidth, y + 8);
    doc.line(margin, y, margin + colWidth - 8, y);
    doc.line(margin + colWidth, y, pageWidth - margin, y);

    const fileName = `hackathon-od-letter-${safeFilePart(item.hackathon_name, "entry")}-${item.id || "draft"}.pdf`;
    doc.save(fileName);
  };

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const data = await apiClient.get("/hackathons?mine=true&limit=100");
      const items = data.hackathons || [];
      setList(items);
      if (items.length > 0) {
        setSelectedEntry(items[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMine();
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

  const activeItem = selectedEntry || (list.length > 0 ? list[0] : null);

  // Dynamic Progress calculation based on real user entry data
  const calcProgressTimeline = (item) => {
    if (!item) {
      return {
        percent: 0,
        barWidth: "w-0",
        step1: { completed: false, date: "Not registered", status: "Pending" },
        step2: { completed: false, date: "Not submitted", status: "Pending" },
        step3: { completed: false, title: "Round Results", desc: "Awaiting entry", status: "Pending" },
        step4: { completed: false, title: "Final Evaluation", desc: "After all rounds", status: "Pending" },
      };
    }

    const createdDateStr = item.created_at
      ? new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : formatDate(item.duration_start_date);

    const isVerified = item.verified || (item.verification_status || "").toLowerCase() === "approved";
    const isRejected = (item.verification_status || "").toLowerCase() === "rejected";
    const progressText = item.progress || "Registered";

    const isFinalStage =
      progressText === "Winner" ||
      progressText === "Runner-up" ||
      progressText === "Completed" ||
      !!item.prize;

    const isRoundQualified =
      progressText.includes("Qualified") ||
      progressText === "Finalist" ||
      progressText === "Shortlisted" ||
      isFinalStage ||
      isVerified;

    let percent = 25;
    if (item.team_member_names || item.proof_filename) percent = 50;
    if (isRoundQualified) percent = 75;
    if (isFinalStage && isVerified) percent = 100;

    let barWidth = "w-1/4";
    if (percent === 50) barWidth = "w-2/4";
    if (percent === 75) barWidth = "w-3/4";
    if (percent === 100) barWidth = "w-full";

    return {
      percent,
      barWidth,
      step1: {
        completed: true,
        date: createdDateStr,
        status: "Completed",
      },
      step2: {
        completed: Boolean(item.team_member_names || item.proof_filename),
        date: createdDateStr,
        status: item.team_member_names || item.proof_filename ? "Completed" : "Pending",
      },
      step3: {
        completed: isRoundQualified,
        title: progressText !== "Registered" ? progressText : "Round 1 Result",
        desc: isRoundQualified
          ? (isVerified ? "Verified & Qualified" : "Qualified round")
          : (isRejected ? "Rejected in review" : "Awaiting announcement"),
        status: isRoundQualified ? (isVerified ? "Approved" : "Qualified") : (isRejected ? "Rejected" : "Pending"),
      },
      step4: {
        completed: isFinalStage && isVerified,
        title: item.prize ? `Prize: ${item.prize}` : "Final Evaluation",
        desc: isFinalStage ? (isVerified ? "Completed & Evaluated" : "Under coordinator review") : "After all rounds",
        status: isFinalStage && isVerified ? "Completed" : (isRejected ? "Rejected" : "Pending"),
      },
    };
  };

  const timelineData = calcProgressTimeline(activeItem);

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

      const response = await apiClient.uploadFile("/hackathons", fd);
      setSuccess(true);
      setMessage("Hackathon entry submitted successfully. OD letter downloaded as PDF.");
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
        progress: "Registered",
        prize: "",
      });
      setProof(null);

      if (response?.hackathon) {
        setSelectedEntry(response.hackathon);
        downloadOdLetterPdf(response.hackathon);
      }

      await loadMine();
    } catch (err) {
      setSuccess(false);
      setMessage(err.message || "Failed to submit hackathon entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  };

  const openPreview = (item) => {
    setSelectedEntry(item);
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      {submitting && <RecordLoader text="Submitting Hackathon Entry..." fullScreen={true} />}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle="Your hackathon entry has been submitted."
          onClose={() => setShowSuccess(false)}
        />

        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaRocket className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hackathon Entry & Progress Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Submit your hackathon details, track verification status, and generate On-Duty letters.
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
          {/* Left Column: Submit Hackathon Entry Form */}
          <form
            onSubmit={submit}
            className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <FaRegFileAlt className="w-4 h-4 text-blue-600" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Submit Hackathon Entry
              </h2>
            </div>

            {/* Sub-section 1: Team Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                <FaUserFriends className="w-3.5 h-3.5" />
                <span>1. Team Information</span>
              </div>

              {/* Student Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaUser className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.student_name}
                      onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaPhoneAlt className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Enter mobile number"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.mobile_number}
                      onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Team Leader & Number of Team Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Team Leader Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaUserPlus className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter team leader name"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.team_leader_name}
                      onChange={(e) => setForm({ ...form, team_leader_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Number of Team Members <span className="text-rose-600">*</span>
                  </label>
                  <CustomSelect
                    value={String(form.team_members_count)}
                    onChange={(val) => setForm({ ...form, team_members_count: val })}
                    options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: String(n) }))}
                    placeholder="Select count"
                    buttonClassName="rounded-xl border-slate-300 py-2.5 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Team Member Names */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Team Member Names <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter all team member names (comma-separated)"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.team_member_names}
                  onChange={(e) => setForm({ ...form, team_member_names: e.target.value })}
                />
              </div>
            </div>

            {/* Sub-section 2: Hackathon Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                <FaCalendarAlt className="w-3.5 h-3.5" />
                <span>2. Hackathon Details</span>
              </div>

              {/* Hackathon Name & Mentor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hackathon Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaTrophy className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter hackathon name"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.hackathon_name}
                      onChange={(e) => setForm({ ...form, hackathon_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mentor
                  </label>
                  <div className="relative flex items-center">
                    <FaUser className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Enter mentor name"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.mentor}
                      onChange={(e) => setForm({ ...form, mentor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Hosted By & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hosted By <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaBuilding className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Organization or institution name"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.hosted_by}
                      onChange={(e) => setForm({ ...form, hosted_by: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <FaMapMarkerAlt className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="City or venue"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Start Date, End Date, Number of Rounds, Progress in 4 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                    value={form.duration_start_date}
                    onChange={(e) => setForm({ ...form, duration_start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    min={form.duration_start_date}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                    value={form.duration_end_date}
                    onChange={(e) => setForm({ ...form, duration_end_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Number of Rounds
                  </label>
                  <CustomSelect
                    value={form.no_of_rounds}
                    onChange={(val) => setForm({ ...form, no_of_rounds: val })}
                    options={[1, 2, 3, 4, 5].map((r) => ({ value: String(r), label: `${r} Rounds` }))}
                    placeholder="Select rounds"
                    buttonClassName="rounded-xl border-slate-300 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Progress <span className="text-rose-600">*</span>
                  </label>
                  <CustomSelect
                    value={form.progress}
                    onChange={(val) => setForm({ ...form, progress: val })}
                    options={progressOptions.map((p) => ({ value: p, label: p }))}
                    placeholder="Select progress"
                    buttonClassName="rounded-xl border-slate-300 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Prize */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Prize <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <div className="relative flex items-center">
                  <FaGift className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="e.g., 1st Prize, Runner-up"
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                    value={form.prize}
                    onChange={(e) => setForm({ ...form, prize: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Sub-section 3: Proof & Documents */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                <FaUpload className="w-3.5 h-3.5" />
                <span>3. Proof & Documents</span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Upload proof (certificate, email, screenshot) <span className="text-rose-600">*</span>
                </label>
                <p className="text-[11px] text-slate-500 font-medium mb-3">
                  Allowed: JPEG, JPG, PDF, DOCX, PNG, PPTX (Max 25 MB)
                </p>

                <FileDropzoneCard
                  selectedFile={proof}
                  onSelect={(f) => setProof(f)}
                  maxSize="25 MB"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold px-6 py-2.5 text-sm shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <FaPaperPlane className="w-3.5 h-3.5" />
                {submitting ? "Submitting..." : "Submit Entry"}
              </button>

              <button
                type="button"
                onClick={() => setForm({
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
                  progress: "Registered",
                  prize: "",
                })}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-extrabold px-6 py-2.5 text-sm shadow-sm transition cursor-pointer"
              >
                <FaRegFileAlt className="w-3.5 h-3.5 text-slate-600" />
                Save as Draft
              </button>
            </div>
          </form>

          {/* Right Column: My Hackathon Entries & DYNAMIC Timeline */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Entry Card Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900">
                  My Hackathon Entries
                </h3>

                <button
                  type="button"
                  onClick={loadMine}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] px-3 py-1.5 text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  <FaThList className="w-3 h-3" />
                  View All
                </button>
              </div>

              {activeItem ? (
                <div className="rounded-2xl border border-slate-200/90 p-4 bg-white shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-900 text-white shadow-md flex-shrink-0">
                      <FaTrophy className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-extrabold text-slate-900 truncate">
                          {activeItem.hackathon_name}
                        </h4>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                          (activeItem.verification_status || "").toLowerCase() === "approved" || activeItem.verified
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : (activeItem.verification_status || "").toLowerCase() === "rejected"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {activeItem.verification_status || "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold mt-0.5 truncate">
                        Team Leader: <span className="font-semibold text-slate-700">{activeItem.team_leader_name}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Location: <span className="font-semibold text-slate-700">{activeItem.location}</span> • Date: <span className="font-semibold text-slate-700">{formatDate(activeItem.duration_start_date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700">
                        {activeItem.progress || "Registered"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPreview(activeItem)}
                      className="rounded-xl border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 px-3 py-1 text-xs font-extrabold shadow-sm transition cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm font-semibold">
                  No hackathon entries submitted yet.
                </div>
              )}
            </div>

            {/* DYNAMIC "Your Progress" Vertical Timeline Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FaChartLine className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Your Progress
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span>Overall Completion</span>
                  <span className="flex h-8 px-2.5 items-center justify-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs shadow-sm">
                    {timelineData.percent}%
                  </span>
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${timelineData.percent}%` }}
                />
              </div>

              {/* 4-Step Dynamic Vertical Timeline */}
              <div className="space-y-6 pt-2 relative">
                {/* Connecting Line */}
                <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-slate-200 -z-0" />

                {/* Step 1: Registration Completed */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm flex-shrink-0 ${
                      timelineData.step1.completed ? "bg-emerald-500" : "bg-slate-300"
                    }`}>
                      <FaCheck className="w-3 h-3" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Registration Completed
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {timelineData.step1.date}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                    timelineData.step1.completed
                      ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}>
                    {timelineData.step1.status}
                  </span>
                </div>

                {/* Step 2: Team Details Submitted */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm flex-shrink-0 ${
                      timelineData.step2.completed ? "bg-emerald-500" : "bg-slate-300"
                    }`}>
                      <FaCheck className="w-3 h-3" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Team Details Submitted
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {timelineData.step2.date}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                    timelineData.step2.completed
                      ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}>
                    {timelineData.step2.status}
                  </span>
                </div>

                {/* Step 3: Round Results */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm flex-shrink-0 ${
                      timelineData.step3.completed
                        ? "bg-emerald-500 text-white"
                        : "bg-blue-50 border border-blue-200 text-blue-600"
                    }`}>
                      {timelineData.step3.completed ? <FaCheck className="w-3 h-3" /> : <FaHourglassHalf className="w-3 h-3" />}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {timelineData.step3.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {timelineData.step3.desc}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                    timelineData.step3.completed
                      ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}>
                    {timelineData.step3.status}
                  </span>
                </div>

                {/* Step 4: Final Evaluation */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm flex-shrink-0 ${
                      timelineData.step4.completed
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 border border-slate-300 text-slate-400"
                    }`}>
                      {timelineData.step4.completed ? <FaCheck className="w-3 h-3" /> : <FaCircle className="w-2.5 h-2.5" />}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {timelineData.step4.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {timelineData.step4.desc}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                    timelineData.step4.completed
                      ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}>
                    {timelineData.step4.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal.open && previewModal.item && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setPreviewModal({ open: false, item: null })}
        >
          <div
            className="max-w-2xl w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-200">
                  <FaTrophy className="w-3 h-3" /> Hackathon Entry Details
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                  {previewModal.item.hackathon_name}
                </h3>
              </div>
              <button
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-1.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                onClick={() => setPreviewModal({ open: false, item: null })}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { label: "Student Name", value: previewModal.item.student_name },
                { label: "Mobile", value: previewModal.item.mobile_number },
                { label: "Team Leader", value: previewModal.item.team_leader_name },
                { label: "Team Members", value: previewModal.item.team_member_names },
                { label: "Hosted By", value: previewModal.item.hosted_by },
                { label: "Location", value: previewModal.item.location },
                { label: "Start Date", value: formatDate(previewModal.item.duration_start_date) },
                { label: "End Date", value: formatDate(previewModal.item.duration_end_date) },
                { label: "Progress", value: previewModal.item.progress },
                { label: "Verification Status", value: previewModal.item.verification_status },
              ].map((field) => (
                <div key={field.label} className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {field.label}
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-slate-900 break-words">
                    {field.value || "-"}
                  </div>
                </div>
              ))}
            </div>

            {/* Proof Document Link & OD PDF button */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => downloadOdLetterPdf(previewModal.item)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-extrabold shadow-sm hover:bg-blue-700 transition cursor-pointer"
              >
                <FaFilePdf className="w-3.5 h-3.5" /> Download OD Letter (PDF)
              </button>

              {previewModal.item.proof_filename && (
                <a
                  href={getFileUrl(previewModal.item.proof_filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50 transition"
                >
                  <FaUpload className="w-3.5 h-3.5 text-blue-600" /> View Proof File
                </a>
              )}
            </div>

            {/* Update Result Form */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FaTrophy className="w-4 h-4 text-amber-500" />
                Update Hackathon Progress & Result
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={updateForm.duration_end_date}
                    onChange={(e) => setUpdateForm({ ...updateForm, duration_end_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    No. of Rounds
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={updateForm.no_of_rounds}
                    onChange={(e) => setUpdateForm({ ...updateForm, no_of_rounds: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Progress
                  </label>
                  <CustomSelect
                    value={updateForm.progress}
                    onChange={(val) => setUpdateForm({ ...updateForm, progress: val })}
                    options={progressOptions.map((p) => ({ value: p, label: p }))}
                    buttonClassName="rounded-xl border-slate-300 py-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Prize / Result
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Winner / 1st Prize"
                    value={updateForm.prize}
                    onChange={(e) => setUpdateForm({ ...updateForm, prize: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={updateResult}
                  disabled={updatingResult}
                  className="rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold px-5 py-2 text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {updatingResult ? "Updating..." : "Save Progress Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// File Picker Subcomponent
function FileDropzoneCard({ selectedFile, onSelect, maxSize }) {
  const fileInputRef = React.useRef(null);

  return (
    <div
      onClick={() => fileInputRef.current && fileInputRef.current.click()}
      className="group border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-between"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
      />

      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
          <FaUpload className="w-4 h-4" />
        </div>
        <p className="text-xs text-blue-600 font-extrabold">
          <span className="underline">Click to Upload</span> or drag and drop
        </p>
        <p className="text-[10px] text-slate-400 font-semibold">
          (Max. File size: {maxSize})
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
