import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../hooks/useAuth";

// Get the base server URL (remove /api from API_BASE_URL)
const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export default function StudentNotifications() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [approvalNotifs, setApprovalNotifs] = useState([]);
  const [rejectionNotifs, setRejectionNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [clearedNotifications, setClearedNotifications] = useState(new Set());

  // Load cleared notifications from localStorage
  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `cleared_notifications_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setClearedNotifications(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to parse cleared notifications from storage", e);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
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

        setApprovalNotifs(approvals);
        setRejectionNotifs(rejections);
      } catch (err) {
        console.error("Failed to load notifications", err);
        if (!mounted) return;
        setAnnouncements([]);
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

    // Save to localStorage
    if (user?.id) {
      const storageKey = `cleared_notifications_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));
    }
  };

  const clearAllNotifications = () => {
    // Create a Set with all notification IDs
    const allIds = new Set([
      ...announcements.map((_, idx) => `ann-${idx}`),
      ...approvalNotifs.map((_, idx) => `approv-${idx}`),
      ...rejectionNotifs.map((_, idx) => `reject-${idx}`),
    ]);

    setClearedNotifications(allIds);

    // Save to localStorage
    if (user?.id) {
      const storageKey = `cleared_notifications_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)));
    }

    // Close any expanded cards
    setExpandedId(null);
  };

  const isCleared = (notificationId) => {
    return clearedNotifications.has(notificationId);
  };

  const formatDate = (ts) => {
    if (!ts) return "Unknown";
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="mx-auto max-w-5xl w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <PageHeader
              title="Notifications"
              subtitle="View your approval/rejection feedback and announcements from staff."
            />
          </div>
          <button
            onClick={clearAllNotifications}
            disabled={
              announcements.length === 0 &&
              approvalNotifs.length === 0 &&
              rejectionNotifs.length === 0
            }
            className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Clear All
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-600 py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            Loading notifications...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Announcements */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Announcements ({announcements.length})
              </h3>
              {announcements.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  No announcements yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann, idx) => {
                    const notifId = `ann-${idx}`;
                    const isExpanded = expandedId === notifId;
                    const isCleared_ = isCleared(notifId);
                    const hasFile = ann.brochure_filename;
                    const fileUrl = hasFile
                      ? `${SERVER_BASE_URL}/uploads/${ann.brochure_filename}`
                      : null;

                    if (isCleared_) return null;

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <button
                          onClick={() => clearNotification(notifId)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Clear notification"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>

                        <div
                          className="flex items-start justify-between cursor-pointer pr-8"
                          onClick={() => toggleExpanded(notifId)}
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">
                              {ann.title}
                            </h4>
                            <div className="text-sm text-slate-600 mt-1">
                              From:{" "}
                              <span className="font-medium">
                                {ann.created_by_name || ann.created_by_email}
                              </span>
                            </div>
                            {ann.description && (
                              <div className="text-sm text-slate-700 mt-2">
                                {ann.description}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
                            {formatDate(ann.created_at || ann.delivered_at)}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            {ann.message && (
                              <div className="mb-3 p-3 bg-slate-50 rounded-md text-sm text-slate-700 whitespace-pre-wrap">
                                {ann.message}
                              </div>
                            )}
                            {hasFile && fileUrl && (
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-5 h-5 text-slate-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                  {ann.brochure_name || "Download Brochure"}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Approvals */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Approvals ({approvalNotifs.length})
              </h3>
              {approvalNotifs.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  No approvals yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalNotifs.map((notif, idx) => {
                    const notifId = `approv-${idx}`;
                    const isExpanded = expandedId === notifId;
                    const isCleared_ = isCleared(notifId);
                    const linkHref =
                      notif.type === "project_approved"
                        ? `/projects/${notif.item_id}`
                        : `/achievements/${notif.item_id}`;
                    const itemLabel =
                      notif.type === "project_approved"
                        ? "Project"
                        : "Achievement";

                    if (isCleared_) return null;

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <button
                          onClick={() => clearNotification(notifId)}
                          className="absolute top-3 right-3 text-green-600 hover:text-green-800 transition-colors"
                          title="Clear notification"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>

                        <div
                          className="flex items-start justify-between cursor-pointer pr-8"
                          onClick={() => toggleExpanded(notifId)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
                                ✓
                              </span>
                              <h4 className="font-semibold text-slate-800">
                                {itemLabel} "{notif.title}" was approved
                              </h4>
                            </div>
                            <div className="text-sm text-slate-600 mt-2">
                              Approved by:{" "}
                              <span className="font-medium">
                                {notif.by_name}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
                            {formatDate(notif.timestamp)}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            {notif.comment && (
                              <div className="mb-3 p-3 bg-white rounded-md text-sm text-slate-700">
                                <div className="font-semibold text-slate-800 mb-1">
                                  Suggestion:
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {notif.comment}
                                </div>
                              </div>
                            )}
                            <a
                              href={linkHref}
                              className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold"
                            >
                              View Details
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rejections */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Rejections ({rejectionNotifs.length})
              </h3>
              {rejectionNotifs.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  No rejections.
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectionNotifs.map((notif, idx) => {
                    const notifId = `reject-${idx}`;
                    const isExpanded = expandedId === notifId;
                    const isCleared_ = isCleared(notifId);
                    const linkHref =
                      notif.type === "project_rejected"
                        ? `/projects/${notif.item_id}`
                        : `/achievements/${notif.item_id}`;
                    const itemLabel =
                      notif.type === "project_rejected"
                        ? "Project"
                        : "Achievement";

                    if (isCleared_) return null;

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <button
                          onClick={() => clearNotification(notifId)}
                          className="absolute top-3 right-3 text-red-600 hover:text-red-800 transition-colors"
                          title="Clear notification"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>

                        <div
                          className="flex items-start justify-between cursor-pointer pr-8"
                          onClick={() => toggleExpanded(notifId)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                                ✕
                              </span>
                              <h4 className="font-semibold text-slate-800">
                                {itemLabel} "{notif.title}" was rejected
                              </h4>
                            </div>
                            <div className="text-sm text-slate-600 mt-2">
                              Rejected by:{" "}
                              <span className="font-medium">
                                {notif.by_name}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
                            {formatDate(notif.timestamp)}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-red-200">
                            {notif.comment && (
                              <div className="mb-3 p-3 bg-white rounded-md text-sm text-slate-700">
                                <div className="font-semibold text-slate-800 mb-1">
                                  Feedback:
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {notif.comment}
                                </div>
                              </div>
                            )}
                            <a
                              href={linkHref}
                              className="inline-flex items-center gap-2 text-red-700 hover:text-red-800 font-semibold"
                            >
                              View Details
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
