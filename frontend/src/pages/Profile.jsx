import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";
import { getInitials, formatDisplayName } from "../utils/displayName";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import AvatarPicker from "../components/ui/AvatarPicker";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaUser,
  FaArrowLeft,
  FaLock,
  FaPencilAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaPhoneAlt,
  FaIdCard,
  FaGithub,
  FaCode,
  FaDownload,
  FaSyncAlt,
  FaSave,
  FaBuilding,
  FaEnvelope,
  FaBolt,
  FaTrophy,
  FaLaptopCode,
  FaCamera,
  FaCheck,
  FaChartLine,
} from "react-icons/fa";

const Profile = () => {
  const nav = useNavigate();
  const { user, updateUser, login, refreshUserProfile } = useAuth();
  const isStaffOrAdmin =
    (user?.role || "").toLowerCase() === "staff" ||
    (user?.role || "").toLowerCase() === "admin";

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    department: "",
    course: "",
    year: "",
    section: "",
    email: user?.email || "",
    register_number: "",
    contact_number: "",
    leetcode_url: "",
    hackerrank_url: "",
    codechef_url: "",
    github_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exportsList, setExportsList] = useState([]);
  const [loadingExports, setLoadingExports] = useState(false);

  const displayName = formatDisplayName(user);
  const photoUrl = (() => {
    const raw =
      (user &&
        (user.photoUrl ||
          user.avatarUrl ||
          user.imageUrl ||
          user.profilePic)) ||
      "";
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;

    const uploadsMarker = "/uploads/";
    if (value.includes(uploadsMarker)) {
      return getFileUrl(value.split(uploadsMarker)[1]);
    }
    if (/^https?:\/\//i.test(value)) return value;

    return getFileUrl(value);
  })();

  // Calculate dynamic completion percentage
  const calculateCompletion = () => {
    const fields = [
      form.email,
      form.register_number,
      form.contact_number,
      form.leetcode_url,
      form.hackerrank_url,
      form.github_url,
    ];
    const filled = fields.filter((v) => typeof v === "string" && v.trim()).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercent = calculateCompletion();

  useEffect(() => {
    let mounted = true;
    if (user?.role === "student") {
      apiClient
        .get("/student/profile")
        .then((data) => {
          if (!mounted) return;
          const profile = data?.profile || {};
          setForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            department: profile.department || "",
            course: profile.course || "",
            year: profile.year || "",
            section: profile.section || "",
            email: profile.email || user?.email || "",
            register_number: profile.register_number || "",
            contact_number: profile.contact_number || "",
            leetcode_url: profile.leetcode_url || "",
            hackerrank_url: profile.hackerrank_url || "",
            codechef_url: profile.codechef_url || "",
            github_url: profile.github_url || "",
          });
        })
        .catch((err) => {
          console.error("Error fetching profile:", err);
          setError("Failed to load profile data");
        });
    } else if (user) {
      const parts = (user.fullName || "").split(" ");
      setForm((prev) => ({
        ...prev,
        first_name: parts[0] || "",
        last_name: parts.slice(1).join(" ") || "",
        email: user.email || "",
        contact_number: user.phone || "",
      }));
    }

    if (isStaffOrAdmin) {
      setLoadingExports(true);
      apiClient
        .get("/bulk-export/list")
        .then((data) => {
          if (!mounted) return;
          setExportsList(data?.files || []);
        })
        .catch((err) => {
          console.error("Error fetching exports list:", err);
        })
        .finally(() => setLoadingExports(false));
    }
    return () => {
      mounted = false;
    };
  }, [user, isStaffOrAdmin]);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (user?.role === "student") {
        const data = await apiClient.put("/student/profile", {
          register_number: form.register_number,
          contact_number: form.contact_number,
          leetcode_url: form.leetcode_url,
          hackerrank_url: form.hackerrank_url,
          codechef_url: form.codechef_url,
          github_url: form.github_url,
        });
        setSuccess(data.message || "Profile updated successfully");
        await refreshUserProfile();
      } else {
        const data = await apiClient.put("/auth/profile", {
          fullName: form.first_name + " " + form.last_name,
          email: form.email,
          phone: form.contact_number,
        });
        if (data?.token) {
          login(
            { email: data.email, role: data.role, fullName: data.fullName },
            data.token
          );
        } else {
          updateUser({ fullName: data.fullName, email: data.email });
        }
        setSuccess("Profile updated successfully");
      }
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Home
          </button>
        </div>

        {/* Title Header Box */}
        <div className="flex items-center gap-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm flex-shrink-0">
            <FaUser className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Edit Profile
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Manage your personal information, contact details, and coding profile links.
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 shadow-sm">
            <FaTimesCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 shadow-sm">
            <FaCheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        {/* Main 12-Column Split Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Summary & Quick Links (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 bg-slate-100 border-4 border-blue-500/20 shadow-lg">
                  {photoUrl ? (
                    <AvatarImage src={photoUrl} alt={displayName || "Profile"} />
                  ) : null}
                  <AvatarFallback className="font-extrabold text-2xl text-slate-700">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
                  title="Change photo"
                >
                  <FaCamera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {displayName}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-extrabold text-blue-700 capitalize">
                    {user?.role || "User"}
                  </span>
                  {form.department && (
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-extrabold text-slate-600 uppercase">
                      {form.department}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm transition cursor-pointer"
              >
                Change Profile Photo
              </button>
            </div>

            {/* Profile Completion Progress Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaChartLine className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Profile Strength
                  </h3>
                </div>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                  {completionPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-600">
                {[
                  { label: "Email Address", done: Boolean(form.email) },
                  { label: "Register Number", done: Boolean(form.register_number) },
                  { label: "Contact Phone", done: Boolean(form.contact_number) },
                  { label: "GitHub Profile", done: Boolean(form.github_url) },
                  { label: "LeetCode Profile", done: Boolean(form.leetcode_url) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                        item.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                      }`}>
                        {item.done ? <FaCheck /> : "•"}
                      </span>
                      {item.label}
                    </span>
                    <span className={item.done ? "text-emerald-700 font-extrabold" : "text-slate-400 font-normal"}>
                      {item.done ? "Linked" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Quick Shortcuts
              </h3>

              <button
                type="button"
                onClick={() => nav("/quick-actions")}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 text-left text-xs font-extrabold text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <FaBolt className="w-4 h-4 text-blue-600" /> Quick Actions
                </span>
                <span className="text-slate-400">→</span>
              </button>

              <button
                type="button"
                onClick={() => nav("/achievements")}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 text-left text-xs font-extrabold text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <FaTrophy className="w-4 h-4 text-amber-500" /> My Achievements
                </span>
                <span className="text-slate-400">→</span>
              </button>

              <button
                type="button"
                onClick={() => nav("/projects/upload")}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 text-left text-xs font-extrabold text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <FaLaptopCode className="w-4 h-4 text-emerald-600" /> My Projects
                </span>
                <span className="text-slate-400">→</span>
              </button>
            </div>
          </div>

          {/* Right Column: Edit Profile Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <form
              onSubmit={onSubmit}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Section 1: Read-Only Academic & Account Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                  <FaLock className="w-3 h-3 text-slate-400" />
                  <span>Academic & Account Information (Read-Only)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={form.first_name}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={form.last_name}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                {form.department && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      disabled
                      value={form.department}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                )}

                {(form.course || form.year || form.section) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Course
                      </label>
                      <input
                        type="text"
                        disabled
                        value={form.course}
                        className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Year
                      </label>
                      <input
                        type="text"
                        disabled
                        value={form.year}
                        className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Section
                      </label>
                      <input
                        type="text"
                        disabled
                        value={form.section}
                        className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={form.email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Section 2: Editable Contact & Profile Links */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider pb-2 border-b border-slate-100">
                  <FaPencilAlt className="w-3 h-3 text-blue-600" />
                  <span>Contact & Profile Links</span>
                </div>

                {user?.role === "student" && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Register Number
                    </label>
                    <div className="relative flex items-center">
                      <FaIdCard className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        name="register_number"
                        value={form.register_number}
                        onChange={onChange}
                        placeholder="Enter your register number"
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Number
                  </label>
                  <div className="relative flex items-center">
                    <FaPhoneAlt className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="tel"
                      name="contact_number"
                      value={form.contact_number}
                      onChange={onChange}
                      placeholder="Enter your contact number"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>

                {user?.role === "student" && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        LeetCode Profile URL
                      </label>
                      <div className="relative flex items-center">
                        <FaCode className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="url"
                          name="leetcode_url"
                          value={form.leetcode_url}
                          onChange={onChange}
                          placeholder="https://leetcode.com/your-username"
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        HackerRank Profile URL
                      </label>
                      <div className="relative flex items-center">
                        <FaCode className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="url"
                          name="hackerrank_url"
                          value={form.hackerrank_url}
                          onChange={onChange}
                          placeholder="https://hackerrank.com/your-username"
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        CodeChef Profile URL <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                      </label>
                      <div className="relative flex items-center">
                        <FaCode className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="url"
                          name="codechef_url"
                          value={form.codechef_url}
                          onChange={onChange}
                          placeholder="https://codechef.com/users/your-username"
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        GitHub Profile URL
                      </label>
                      <div className="relative flex items-center">
                        <FaGithub className="absolute left-3.5 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="url"
                          name="github_url"
                          value={form.github_url}
                          onChange={onChange}
                          placeholder="https://github.com/your-username"
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold px-6 py-2.5 text-sm shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  <FaSave className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            {/* Staff/Admin Downloaded Export Files */}
            {isStaffOrAdmin && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Downloaded Export Files
                  </h3>

                  <button
                    type="button"
                    onClick={async () => {
                      setLoadingExports(true);
                      try {
                        const data = await apiClient.get("/bulk-export/list");
                        setExportsList(data?.files || []);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoadingExports(false);
                      }
                    }}
                    disabled={loadingExports}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] px-3 py-1.5 text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <FaSyncAlt className={`w-3 h-3 ${loadingExports ? "animate-spin" : ""}`} />
                    {loadingExports ? "Refreshing..." : "Refresh List"}
                  </button>
                </div>

                {exportsList.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                    No files found. Generate one from Bulk Export.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exportsList.map((f) => (
                      <div
                        key={f.name}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs font-bold text-slate-800"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-slate-900">{f.name}</div>
                          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                            {(f.size / 1024 / 1024).toFixed(2)} MB • {new Date(f.modifiedAt).toLocaleString()}
                          </div>
                        </div>

                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition self-start sm:self-auto flex-shrink-0"
                        >
                          <FaDownload className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AvatarPicker
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
