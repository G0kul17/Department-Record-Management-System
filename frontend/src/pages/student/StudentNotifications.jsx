import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import { getFileUrl } from "../../utils/fileUrl";
import {
  FaBell,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaBullhorn,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
} from "react-icons/fa";

export default function StudentNotifications() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [approvalNotifs, setApprovalNotifs] = useState([]);
  const [rejectionNotifs, setRejectionNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [clearedNotifications, setClearedNotifications] = useState(new Set());
  const [clearedAllAt, setClearedAllAt] = useState(0);

  const getStoredClearedAllAt = (id) => {
    const userKey = id ? `cleared_notifications_all_at_${id}` : null;
    if (userKey) {
      const value = Number(localStorage.getItem(userKey) || 0);
      if (value) return value;
    }
    return Number(localStorage.getItem("cleared_notifications_all_at") || 0);
  };

  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `cleared_notifications_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    const storedAllAt = getStoredClearedAllAt(user.id);
    if (stored) {
      try {
        setClearedNotifications(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to parse cleared notifications", e);
      }
    }
    if (storedAllAt) setClearedAllAt(storedAllAt);
  }, [user?.id]);

  const [pendingStaffNotifs, setPendingStaffNotifs] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const role = (user?.role || "").toLowerCase();

        if (role === "staff" || role === "admin") {
          const [ann, pendingProj, pendingAch, pendingHack] = await Promise.all([
            apiClient.get(`/announcements/mine?limit=100`).catch(() => ({ announcements: [] })),
            apiClient.get(`/projects?verified=false&limit=50`).catch(() => ({ projects: [] })),
            apiClient.get(`/achievements?verified=false&status=pending&limit=200`).catch(() => ({ achievements: [] })),
            apiClient.get(`/hackathons/coordinator/queue?status=pending&limit=50`).catch(() => ({ hackathons: [] })),
          ]);

          if (!mounted) return;

          setAnnouncements(ann.announcements || []);

          const staffPending = [
            ...(pendingProj.projects || []).map((p) => ({
              type: "pending_project",
              title: `Project "${p.title}" awaiting verification`,
              item_id: p.id,
              by_name: p.uploader_full_name || p.uploader_email || "Student",
              timestamp: new Date(p.created_at).getTime(),
              href: role === "admin" ? `/admin/verify-projects` : `/verify-projects`,
            })),
            ...(pendingAch.achievements || []).map((a) => ({
              type: "pending_achievement",
              title: `Achievement "${a.title}" awaiting verification`,
              item_id: a.id,
              by_name: a.user_fullname || a.user_email || "Student",
              timestamp: new Date(a.created_at).getTime(),
              href: role === "admin" ? `/admin/verify-achievements` : `/verify-achievements`,
            })),
            ...(pendingHack.hackathons || []).map((h) => ({
              type: "pending_hackathon",
              title: `Hackathon "${h.hackathon_name}" progress awaiting verification`,
              item_id: h.id,
              by_name: h.student_name || h.team_leader_name || h.user_fullname || "Student",
              timestamp: new Date(h.created_at).getTime(),
              href: `/verify-hackathon-progress`,
            })),
          ].sort((x, y) => y.timestamp - x.timestamp);

          setPendingStaffNotifs(staffPending);
          setApprovalNotifs([]);
          setRejectionNotifs([]);
        } else {
          const [ann, proj, ach] = await Promise.all([
            apiClient.get(`/announcements/mine?limit=100`),
            apiClient.get(`/projects?limit=50&mine=true`),
            apiClient.get(
              `/achievements?limit=50${user?.id ? `&user_id=${user.id}` : ""}`,
            ),
          ]);

          if (!mounted) return;

          setAnnouncements(ann.announcements || []);

          const approvedProj = (proj.projects || []).filter(
            (p) => (p.verification_status || "").toLowerCase() === "approved",
          );
          const approvedAch = (ach.achievements || []).filter(
            (a) => (a.verification_status || "").toLowerCase() === "approved",
          );
          const rejectedProj = (proj.projects || []).filter(
            (p) => (p.verification_status || "").toLowerCase() === "rejected",
          );
          const rejectedAch = (ach.achievements || []).filter(
            (a) => (a.verification_status || "").toLowerCase() === "rejected",
          );

          const approvals = [
            ...approvedProj.map((p) => ({
              type: "project_approved",
              title: p.title,
              item_id: p.id,
              status: "approved",
              comment: p.verification_comment || "",
              by_name: p.verified_by_fullname || p.verified_by_email || "Staff",
              timestamp: new Date(
                p.verified_at || p.updated_at || p.created_at,
              ).getTime(),
            })),
            ...approvedAch.map((a) => ({
              type: "achievement_approved",
              title: a.title,
              item_id: a.id,
              status: "approved",
              comment: a.verification_comment || "",
              by_name: a.verified_by_fullname || a.verified_by_email || "Staff",
              timestamp: new Date(
                a.verified_at || a.updated_at || a.created_at,
              ).getTime(),
            })),
          ].sort((x, y) => y.timestamp - x.timestamp);

          const rejections = [
            ...rejectedProj.map((p) => ({
              type: "project_rejected",
              title: p.title,
              item_id: p.id,
              status: "rejected",
              comment: p.verification_comment || "",
              by_name: p.verified_by_fullname || p.verified_by_email || "Staff",
              timestamp: new Date(
                p.verified_at || p.updated_at || p.created_at,
              ).getTime(),
            })),
            ...rejectedAch.map((a) => ({
              type: "achievement_rejected",
              title: a.title,
              item_id: a.id,
              status: "rejected",
              comment: a.verification_comment || "",
              by_name: a.verified_by_fullname || a.verified_by_email || "Staff",
              timestamp: new Date(
                a.verified_at || a.updated_at || a.created_at,
              ).getTime(),
            })),
          ].sort((x, y) => y.timestamp - x.timestamp);

          setPendingStaffNotifs([]);
          setApprovalNotifs(approvals);
          setRejectionNotifs(rejections);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
        if (!mounted) return;
        setAnnouncements([]);
        setPendingStaffNotifs([]);
        setApprovalNotifs([]);
        setRejectionNotifs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const clearNotification = (notificationId) => {
    const updated = new Set(clearedNotifications);
    updated.add(notificationId);
    setClearedNotifications(updated);

    if (user?.id) {
      const storageKey = `cleared_notifications_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));
    }
  };

  const clearAllNotifications = () => {
    const allIds = new Set([
      ...announcements.map((ann, idx) => getAnnouncementId(ann, idx)),
      ...approvalNotifs.map((item) => getReviewNotifId(item)),
      ...rejectionNotifs.map((item) => getReviewNotifId(item)),
    ]);
    const now = Date.now();

    setClearedNotifications(allIds);
    setClearedAllAt(now);

    if (user?.id) {
      const storageKey = `cleared_notifications_${user.id}`;
      const clearedAllKey = `cleared_notifications_all_at_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)));
      localStorage.setItem(clearedAllKey, String(now));
    }
    localStorage.setItem("cleared_notifications_all_at", String(now));

    setExpandedId(null);
  };

  const isCleared = (notificationId) => {
    return clearedNotifications.has(notificationId);
  };

  const isClearedByTimestamp = (ts) => {
    const effectiveClearedAllAt =
      clearedAllAt || getStoredClearedAllAt(user?.id);
    if (!effectiveClearedAllAt) return false;
    return (ts || 0) <= effectiveClearedAllAt;
  };

  const getAnnouncementId = (ann, idx) => {
    const base =
      ann?.id ||
      ann?.announcement_id ||
      ann?.brochure_filename ||
      ann?.created_at ||
      ann?.delivered_at ||
      idx;
    return `ann-${String(base)}`;
  };

  const getReviewNotifId = (notif) => {
    const base = notif?.item_id || notif?.id || notif?.timestamp;
    return `${notif?.type || "review"}-${String(base)}`;
  };

  const formatDate = (ts) => {
    if (!ts) return "Unknown";
    try {
      return new Date(ts).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  const visibleAnnouncements = announcements.filter((ann, idx) => {
    const notifId = getAnnouncementId(ann, idx);
    const annTs = new Date(ann.created_at || ann.delivered_at || 0).getTime();
    return !isCleared(notifId) && !isClearedByTimestamp(annTs);
  });

  const visibleApprovals = approvalNotifs.filter((notif) => {
    const notifId = getReviewNotifId(notif);
    const notifTs = notif.timestamp || 0;
    return !isCleared(notifId) && !isClearedByTimestamp(notifTs);
  });

  const visibleRejections = rejectionNotifs.filter((notif) => {
    const notifId = getReviewNotifId(notif);
    const notifTs = notif.timestamp || 0;
    return !isCleared(notifId) && !isClearedByTimestamp(notifTs);
  });

  const visiblePendingStaff = pendingStaffNotifs.filter((notif) => {
    const notifId = `pending-${notif.type}-${notif.item_id}`;
    const notifTs = notif.timestamp || 0;
    return !isCleared(notifId) && !isClearedByTimestamp(notifTs);
  });

  const totalCount =
    visibleAnnouncements.length +
    visibleApprovals.length +
    visibleRejections.length +
    visiblePendingStaff.length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">

        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>

        {/* Title Header Card */}
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
              <FaBell className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Notifications
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                View your approval feedback, rejection comments, and department announcements.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearAllNotifications}
            disabled={totalCount === 0}
            className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 font-extrabold text-xs px-4 py-2.5 shadow-xs transition disabled:opacity-50 cursor-pointer flex-shrink-0"
          >
            <FaTrashAlt className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {loading ? "Loading..." : `${totalCount} active notification${totalCount !== 1 ? "s" : ""}`}
          </p>
          <button
            type="button"
            onClick={clearAllNotifications}
            disabled={totalCount === 0}
            className="sm:hidden inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-extrabold text-xs px-3 py-1.5 disabled:opacity-50 transition cursor-pointer"
          >
            <FaTrashAlt className="w-3 h-3" /> Clear All
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading notifications...</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 mx-auto">
              <FaBell className="w-6 h-6" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
              All caught up!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              You have no new unread notifications or announcements.
            </p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* 0. Staff Pending Verification Actions */}
            {visiblePendingStaff.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <FaBell className="w-4 h-4 animate-pulse" />
                  <span>Pending Verification Actions ({visiblePendingStaff.length})</span>
                </div>

                <div className="space-y-3">
                  {visiblePendingStaff.map((notif) => {
                    const notifId = `pending-${notif.type}-${notif.item_id}`;

                    return (
                      <div
                        key={notifId}
                        className="group rounded-3xl border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 p-5 shadow-xs hover:shadow-md hover:shadow-amber-500/10 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex items-start gap-3.5 flex-1 cursor-pointer min-w-0"
                            onClick={() => nav(notif.href)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-500/25 flex-shrink-0">
                              <FaBell className="w-4 h-4" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                  {notif.title}
                                </h4>
                                <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                                  Pending Action
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                                Submitted by: <strong className="text-slate-700 dark:text-slate-300">{notif.by_name}</strong> • {formatDate(notif.timestamp)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => clearNotification(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                              title="Clear notification"
                            >
                              <FaTrashAlt className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link
                            to={notif.href}
                            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-extrabold shadow-md shadow-blue-600/25 transition"
                          >
                            <FaExternalLinkAlt className="w-3 h-3" />
                            Go to Verification Page
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. Announcements */}
            {visibleAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <FaBullhorn className="w-4 h-4" />
                  <span>Announcements ({visibleAnnouncements.length})</span>
                </div>

                <div className="space-y-3">
                  {visibleAnnouncements.map((ann, idx) => {
                    const notifId = getAnnouncementId(ann, idx);
                    const isExpanded = expandedId === notifId;
                    const hasFile = ann.brochure_filename;
                    const fileUrl = hasFile ? getFileUrl(ann.brochure_filename) : null;

                    return (
                      <div
                        key={notifId}
                        className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500/50 dark:hover:border-blue-700 transition-all duration-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex items-start gap-3.5 flex-1 cursor-pointer min-w-0"
                            onClick={() => toggleExpanded(notifId)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 shadow-xs flex-shrink-0">
                              <FaBullhorn className="w-4 h-4" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {ann.title}
                                </h4>
                                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700 dark:text-blue-300">
                                  Announcement
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                                From: <strong className="text-slate-700 dark:text-slate-300">{ann.created_by_name || ann.created_by_email || "Staff"}</strong> • {formatDate(ann.created_at || ann.delivered_at)}
                              </p>
                              {ann.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                                  {ann.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            >
                              {isExpanded ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => clearNotification(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                              title="Clear notification"
                            >
                              <FaTrashAlt className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            {ann.message && (
                              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-slate-200/70 dark:border-slate-700">
                                {ann.message}
                              </div>
                            )}

                            {hasFile && fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3.5 py-2 text-xs font-extrabold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                              >
                                <FaFileAlt className="w-3.5 h-3.5" />
                                {ann.brochure_name || "Download Brochure"}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Approvals */}
            {visibleApprovals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <FaCheckCircle className="w-4 h-4" />
                  <span>Approved Feedback ({visibleApprovals.length})</span>
                </div>

                <div className="space-y-3">
                  {visibleApprovals.map((notif) => {
                    const notifId = getReviewNotifId(notif);
                    const isExpanded = expandedId === notifId;
                    const linkHref =
                      notif.type === "project_approved"
                        ? `/projects/${notif.item_id}`
                        : `/achievements/${notif.item_id}`;
                    const itemLabel =
                      notif.type === "project_approved"
                        ? "Project"
                        : "Achievement";

                    return (
                      <div
                        key={notifId}
                        className="group rounded-3xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 shadow-xs hover:shadow-md hover:shadow-emerald-500/10 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex items-start gap-3.5 flex-1 cursor-pointer min-w-0"
                            onClick={() => nav(linkHref)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 flex-shrink-0">
                              <FaCheckCircle className="w-5 h-5" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {itemLabel} "{notif.title}" was approved
                                </h4>
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                                  Approved
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                                Verified by: <strong className="text-slate-700 dark:text-slate-300">{notif.by_name}</strong> • {formatDate(notif.timestamp)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                            >
                              {isExpanded ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => clearNotification(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                              title="Clear notification"
                            >
                              <FaTrashAlt className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
                            {notif.comment && (
                              <div className="rounded-2xl bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-emerald-200 dark:border-emerald-800/40">
                                <strong className="text-slate-900 dark:text-white block mb-1">Feedback / Comment:</strong>
                                {notif.comment}
                              </div>
                            )}

                            <Link
                              to={linkHref}
                              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-md shadow-blue-600/25 transition"
                            >
                              <FaExternalLinkAlt className="w-3 h-3" />
                              View Item Details
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Rejections */}
            {visibleRejections.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  <FaTimesCircle className="w-4 h-4" />
                  <span>Rejection Feedback ({visibleRejections.length})</span>
                </div>

                <div className="space-y-3">
                  {visibleRejections.map((notif) => {
                    const notifId = getReviewNotifId(notif);
                    const isExpanded = expandedId === notifId;
                    const linkHref =
                      notif.type === "project_rejected"
                        ? `/projects/${notif.item_id}`
                        : `/achievements/${notif.item_id}`;
                    const itemLabel =
                      notif.type === "project_rejected"
                        ? "Project"
                        : "Achievement";

                    return (
                      <div
                        key={notifId}
                        className="group rounded-3xl border border-rose-200/80 dark:border-rose-800/40 bg-rose-50/40 dark:bg-rose-950/20 p-5 shadow-xs hover:shadow-md hover:shadow-rose-500/10 hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex items-start gap-3.5 flex-1 cursor-pointer min-w-0"
                            onClick={() => nav(linkHref)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm shadow-rose-500/25 flex-shrink-0">
                              <FaTimesCircle className="w-5 h-5" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
                                  {itemLabel} "{notif.title}" was rejected
                                </h4>
                                <span className="rounded-full bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800 dark:text-rose-300">
                                  Rejected
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                                Reviewed by: <strong className="text-slate-700 dark:text-slate-300">{notif.by_name}</strong> • {formatDate(notif.timestamp)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                            >
                              {isExpanded ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => clearNotification(notifId)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                              title="Clear notification"
                            >
                              <FaTrashAlt className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-rose-200/60 dark:border-rose-800/40 space-y-3">
                            {notif.comment && (
                              <div className="rounded-2xl bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-rose-200 dark:border-rose-800/40">
                                <strong className="text-rose-900 dark:text-rose-300 block mb-1">Rejection Reason / Feedback:</strong>
                                {notif.comment}
                              </div>
                            )}

                            <Link
                              to={linkHref}
                              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-md shadow-blue-600/25 transition"
                            >
                              <FaExternalLinkAlt className="w-3 h-3" />
                              View Item Details
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
