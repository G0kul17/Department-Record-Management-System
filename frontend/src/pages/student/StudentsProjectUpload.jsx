import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SuccessModal from "../../components/ui/SuccessModal";
import CustomSelect from "../../components/ui/CustomSelect";
import { getFileUrl } from "../../utils/fileUrl";
import {
  FaFolder,
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
  FaLink,
  FaFilePdf,
  FaFileArchive,
  FaCalendarAlt,
  FaUsers,
  FaInfoCircle,
  FaPaperPlane,
} from "react-icons/fa";
import RecordLoader from "../../components/ui/RecordLoader";

export default function ProjectUpload() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    mentor_name: "",
    academic_year: "2025-2026",
    status: "ongoing",
    team_members_count: "",
    team_members: [],
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
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [previewModal, setPreviewModal] = useState({ open: false, item: null });

  const loadProjects = async (retainExisting = false) => {
    setLoadingProjects(true);
    try {
      const data = await apiClient.get(`/projects?limit=100&mine=true`);
      const list = data.projects || [];
      if (list.length === 0 && retainExisting) {
        // Retain optimistic
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

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [projects.length, activeTab]);

  // Compute status counts
  const pendingCount = projects.filter(
    (p) => !p.verified && (p.verification_status || "").toLowerCase() !== "rejected" && (p.verification_status || "").toLowerCase() !== "under review"
  ).length;
  const underReviewCount = projects.filter(
    (p) => (p.verification_status || "").toLowerCase() === "under review"
  ).length;
  const approvedCount = projects.filter(
    (p) => p.verified || (p.verification_status || "").toLowerCase() === "approved"
  ).length;

  const filteredProjects = projects.filter((p) => {
    const status = (p.verification_status || "").toLowerCase();
    if (activeTab === "pending") return !p.verified && status !== "rejected" && status !== "under review";
    if (activeTab === "under_review") return status === "under review";
    if (activeTab === "approved") return p.verified || status === "approved";
    return true;
  });

  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / perPage));
  const startIndex = (page - 1) * perPage;
  const pagedProjects = filteredProjects.slice(startIndex, startIndex + perPage);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      if (!srsFile) {
        throw new Error("Please attach the SRS document (PDF) before uploading.");
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
            .map((member) => {
              const name = typeof member === "string" ? member : member?.name || "";
              const role =
                typeof member === "object"
                  ? member?.role || "Team Member"
                  : "Team Member";
              return name.trim() ? `${name.trim()} (${role})` : "";
            })
            .filter(Boolean)
            .join(", ")
        );
      fd.append("srs_document", srsFile);
      if (zipFile) {
        const sizeLimit = 15 * 1024 * 1024;
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
        academic_year: "2025-2026",
        status: "ongoing",
        team_members_count: "",
        team_members: [],
        github_url: "",
      });
      setZipFile(null);
      setSrsFile(null);
      if (resp && resp.project) {
        setProjects((prev) => [resp.project, ...prev]);
      }
      await loadProjects(true);
    } catch (e) {
      setSuccess(false);
      if (e.message && e.message.includes("team has already uploaded")) {
        setMessage(
          "⚠️ Your team has already uploaded this project. GitHub URL must be unique."
        );
      } else {
        setMessage(e.message || "Failed to upload project");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      {submitting && <RecordLoader text="Uploading Project Record..." fullScreen={true} />}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle="Your project has been uploaded."
          onClose={() => setShowSuccess(false)}
        />

        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs flex-shrink-0">
            <FaUpload className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Upload Project
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Provide basic details and SRS (PDF). Optionally attach a single ZIP (max 15MB) with supporting files.
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

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
          {/* Left Column: Form Panel (7 cols / 8 cols) */}
          <form
            onSubmit={submit}
            className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <FaFolder className="w-4 h-4 text-blue-600" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Project Details
              </h2>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter project title"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Description with character counter */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Description <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  required
                  maxLength={500}
                  placeholder="Briefly describe your project"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm resize-y"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <span className="absolute bottom-2.5 right-3 text-[11px] font-bold text-slate-400">
                  {form.description.length} / 500
                </span>
              </div>
            </div>

            {/* Mentor, Academic Year, Status in 3 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mentor Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Prof. S. Kumar"
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.mentor_name}
                  onChange={(e) =>
                    setForm({ ...form, mentor_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Year <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <FaCalendarAlt className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="2025-2026"
                    required
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                    value={form.academic_year}
                    onChange={(e) =>
                      setForm({ ...form, academic_year: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status <span className="text-rose-600">*</span>
                </label>
                <CustomSelect
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  options={[
                    { value: "ongoing", label: "Ongoing" },
                    { value: "completed", label: "Completed" },
                  ]}
                  placeholder="Select status"
                  buttonClassName="rounded-xl border-slate-300 py-2.5 text-slate-900 font-semibold"
                />
              </div>
            </div>

            {/* Project GitHub URL */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Project GitHub URL <span className="text-rose-600">*</span>
              </label>
              <div className="relative flex items-center">
                <FaLink className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/repo"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                  value={form.github_url}
                  onChange={(e) =>
                    setForm({ ...form, github_url: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Team Members & Info callout */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Team Members <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <FaUsers className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 3"
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                    value={form.team_members_count}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const n = Math.max(1, Math.min(10, parseInt(raw || "", 10) || 0));
                      const next = [...(form.team_members || [])];
                      if (n > next.length) {
                        while (next.length < n)
                          next.push({ name: "", role: "Team Member" });
                      } else if (n < next.length) {
                        next.length = n;
                      }
                      setForm({
                        ...form,
                        team_members_count: raw,
                        team_members: next,
                      });
                    }}
                    onWheel={(e) => e.target.blur()}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-7">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-blue-700 font-semibold">
                  <FaInfoCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>We'll save the names with their roles in the order you enter.</span>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FaFolder className="w-3.5 h-3.5 text-blue-600" />
                  Documents
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Upload required files. Max limits are mentioned below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SRS Dropzone with PDF Pill */}
                <FileDropzoneCard
                  tag="PDF"
                  tagColor="bg-rose-100 text-rose-700"
                  title="SRS Document (PDF)"
                  subtitle="Upload your Software Requirement Specification"
                  required
                  selectedFile={srsFile}
                  onSelect={(file) => setSrsFile(file)}
                  maxSize="25 MB"
                />

                {/* ZIP Dropzone with ZIP Pill */}
                <FileDropzoneCard
                  tag="ZIP"
                  tagColor="bg-emerald-100 text-emerald-700"
                  title="Attach Zip (optional)"
                  subtitle="Upload a single .zip archive with supporting files"
                  selectedFile={zipFile}
                  onSelect={(file) => setZipFile(file)}
                  maxSize="15 MB"
                />
              </div>
            </div>

            {/* Submit & Save Draft buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold px-6 py-2.5 text-sm shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <FaUpload className="w-3.5 h-3.5" />
                {submitting ? "Uploading..." : "Upload Project"}
              </button>

              <button
                type="button"
                onClick={() => setForm({
                  title: "",
                  description: "",
                  mentor_name: "",
                  academic_year: "2025-2026",
                  status: "ongoing",
                  team_members_count: "",
                  team_members: [],
                  github_url: "",
                })}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-extrabold px-6 py-2.5 text-sm shadow-sm transition cursor-pointer"
              >
                <FaFolder className="w-3.5 h-3.5 text-slate-600" />
                Save as Draft
              </button>
            </div>
          </form>

          {/* Right Column: My Projects Panel */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col justify-between h-full min-h-[550px]">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <h3 className="text-lg font-extrabold text-slate-900">
                  My Projects
                </h3>

                <button
                  type="button"
                  onClick={loadProjects}
                  disabled={loadingProjects}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <FaSyncAlt className={`w-3 h-3 ${loadingProjects ? "animate-spin" : ""}`} />
                  {loadingProjects ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {/* Status Filter Tabs matching target UI */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>{projects.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("pending")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "pending"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Pending <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>{pendingCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("under_review")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "under_review"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Under Review <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "under_review" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>{underReviewCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("approved")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "approved"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Approved <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "approved" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>{approvedCount}</span>
                </button>
              </div>

              {/* Empty State Illustration & Text matching screenshot */}
              {pagedProjects.length === 0 && !loadingProjects && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 my-auto">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-50/70 text-blue-500 mb-4 shadow-sm border border-blue-100">
                    <FaPaperPlane className="w-12 h-12 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    No projects yet!
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold max-w-xs text-center mt-1">
                    Upload your first project to get started. You can track its verification status here.
                  </p>
                </div>
              )}

              {/* Projects List View */}
              {pagedProjects.length > 0 && (
                <div className="space-y-3.5">
                  {pagedProjects.map((p) => {
                    const isApproved = p.verified || (p.verification_status || "").toLowerCase() === "approved";
                    const isUnderReview = (p.verification_status || "").toLowerCase() === "under review";

                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-slate-200/90 p-4 bg-white hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm flex-shrink-0">
                            <FaFolder className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate">
                              {p.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-semibold truncate">
                              {p.mentor_name || "Department"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewModal({ open: true, item: p })}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] px-3.5 py-1 text-xs font-extrabold shadow-sm transition cursor-pointer"
                          >
                            <FaEye className="w-3 h-3 text-[#0284c7]" />
                            View
                          </button>

                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-0.5 text-xs font-extrabold text-[#047857] shadow-sm">
                              <FaCheck className="w-2.5 h-2.5 text-[#047857]" /> Approved
                            </span>
                          ) : isUnderReview ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-extrabold text-blue-700 shadow-sm">
                              Under Review
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
              )}
            </div>

            {/* Pagination */}
            {filteredProjects.length > perPage && (
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
    </div>
  );
}

// File Picker Subcomponent matching Target UI with Tag Pill
function FileDropzoneCard({
  tag,
  tagColor,
  title,
  subtitle,
  required,
  selectedFile,
  onSelect,
  maxSize,
}) {
  const fileInputRef = React.useRef(null);

  return (
    <div
      onClick={() => fileInputRef.current && fileInputRef.current.click()}
      className="group relative border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-between"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
      />

      {/* Top Tag Badge (PDF / ZIP) */}
      <span className={`absolute top-3 right-3 rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold ${tagColor} shadow-sm`}>
        {tag}
      </span>

      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="text-sm font-extrabold text-slate-900 leading-tight">
          {title} {required && <span className="text-rose-600">*</span>}
        </div>
        <p className="text-xs text-slate-500 font-medium max-w-[200px]">
          {subtitle}
        </p>

        {/* Upload Cloud Icon */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mt-1">
          <FaUpload className="w-4 h-4" />
        </div>

        <p className="text-xs text-blue-600 font-extrabold mt-1">
          <span className="underline">Click to Upload</span> or drag and drop
        </p>
        <p className="text-[10px] text-slate-400 font-semibold">
          Max. file size: {maxSize}
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
