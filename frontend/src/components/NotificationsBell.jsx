import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";
import { formatDisplayName } from "../utils/displayName";
import Toast from "./Toast";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaBullhorn,
  FaCalendarAlt,
  FaFileAlt,
  FaExternalLinkAlt,
  FaChevronRight,
  FaInbox,
} from "react-icons/fa";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const lastSeenKey = "notificationsLastSeen";
  const lastToastKey = "notificationsLastToast";
  const lastAnnouncementToastKey = "announcementsLastToast";
  const [unread, setUnread] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  function showToast(message, type = "info") {
    setToastMessage(message || "");
    setToastType(type);
  }

  function timeAgo(ts) {
    const now = Date.now();
    const diff = Math.max(0, now - (ts || 0));
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return "just now";
    if (diff < hour) {
      const m = Math.floor(diff / minute);
      return `${m} ${m === 1 ? "min" : "mins"} ago`;
    }
    if (diff < day) {
      const h = Math.floor(diff / hour);
      return `${h} ${h === 1 ? "hr" : "hrs"} ago`;
    }
    const d = Math.floor(diff / day);
    return `${d} ${d === 1 ? "day" : "days"} ago`;
  }

  useEffect(() => {
    const last = Number(localStorage.getItem(lastSeenKey) || 0);
    computeUnread(items, last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    function onDocClick(e) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    let timer = null;
    async function checkNew() {
      try {
        const lastSeen = Number(localStorage.getItem(lastSeenKey) || 0);
        const role = (user?.role || "").toLowerCase();
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        let maxTs = 0;
        let announcements = [];
        if (role === "staff") {
          const [pendingProj, pendingAch] = await Promise.all([
            apiClient.get(`/projects?verified=false&limit=20`),
            apiClient.get(
              `/achievements?verified=false&status=pending&limit=50`,
            ),
          ]);
          const toCreatedTs = (item) => {
            const t = new Date(item?.created_at);
            return isNaN(t.getTime()) ? 0 : t.getTime();
          };
          const allPend = [
            ...(pendingProj.projects || []),
            ...(pendingAch.achievements || []),
          ];
          maxTs = Math.max(0, ...allPend.map(toCreatedTs));
        } else {
          const [myProj, myAch] = await Promise.all([
            apiClient.get(`/projects?limit=20&mine=true`),
            apiClient.get(
              `/achievements?limit=50${user?.id ? `&user_id=${user.id}` : ""}`,
            ),
          ]);
          const toVerifiedTs = (item) => {
            const t = new Date(item?.verified_at);
            return isNaN(t.getTime()) ? 0 : t.getTime();
          };
          const approvedProjects = (myProj.projects || []).filter(
            (p) => (p.verification_status || "").toLowerCase() === "approved",
          );
          const rejectedProjects = (myProj.projects || []).filter(
            (p) => (p.verification_status || "").toLowerCase() === "rejected",
          );
          const approvedAchievements = (myAch.achievements || []).filter(
            (a) => (a.verification_status || "").toLowerCase() === "approved",
          );
          const rejectedAchievements = (myAch.achievements || []).filter(
            (a) => (a.verification_status || "").toLowerCase() === "rejected",
          );
          const reviewedMine = [
            ...approvedProjects,
            ...rejectedProjects,
            ...approvedAchievements,
            ...rejectedAchievements,
          ];
          maxTs = Math.max(0, ...reviewedMine.map(toVerifiedTs));

          const lastToast = Number(localStorage.getItem(lastToastKey) || 0);
          const suggestions = [
            ...approvedProjects.map((p) => ({
              kind: "project",
              status: "approved",
              title: p.title,
              comment: p.verification_comment || "",
              by:
                formatDisplayName({
                  fullName: p.verified_by_fullname,
                  email: p.verified_by_email,
                }) || "Staff",
              ts: toVerifiedTs(p),
            })),
            ...rejectedProjects.map((p) => ({
              kind: "project",
              status: "rejected",
              title: p.title,
              comment: p.verification_comment || "",
              by:
                formatDisplayName({
                  fullName: p.verified_by_fullname,
                  email: p.verified_by_email,
                }) || "Staff",
              ts: toVerifiedTs(p),
            })),
            ...approvedAchievements.map((a) => ({
              kind: "achievement",
              status: "approved",
              title: a.title,
              comment: a.verification_comment || "",
              by:
                formatDisplayName({
                  fullName: a.verified_by_fullname,
                  email: a.verified_by_email,
                }) || "Staff",
              ts: toVerifiedTs(a),
            })),
            ...rejectedAchievements.map((a) => ({
              kind: "achievement",
              status: "rejected",
              title: a.title,
              comment: a.verification_comment || "",
              by:
                formatDisplayName({
                  fullName: a.verified_by_fullname,
                  email: a.verified_by_email,
                }) || "Staff",
              ts: toVerifiedTs(a),
            })),
          ].filter((item) => item.comment && item.comment.trim());

          if (suggestions.length) {
            const latest = suggestions.sort((a, b) => b.ts - a.ts)[0];
            if (latest.ts > lastToast && latest.ts >= weekAgo) {
              const header = `Suggestion from ${latest.by} on your ${latest.kind} "${latest.title}" (${latest.status})`;
              const msg = `${header}\n${latest.comment}`;
              showToast(msg, "info");
              localStorage.setItem(lastToastKey, String(latest.ts));
            }
          }
        }

        try {
          const ann = await apiClient.get(`/announcements/mine?limit=20`);
          announcements = ann.announcements || [];
        } catch {
          announcements = [];
        }

        if (announcements.length) {
          const annTs = announcements.map((a) => {
            const t = new Date(a?.delivered_at || a?.created_at);
            return isNaN(t.getTime()) ? 0 : t.getTime();
          });
          const latestAnnTs = Math.max(0, ...annTs);
          maxTs = Math.max(maxTs, latestAnnTs);

          const lastAnnToast = Number(
            localStorage.getItem(lastAnnouncementToastKey) || 0,
          );
          const latestAnn = announcements
            .map((a) => ({
              ...a,
              ts: new Date(a?.delivered_at || a?.created_at).getTime(),
            }))
            .filter((a) => !isNaN(a.ts))
            .sort((a, b) => b.ts - a.ts)[0];
          if (latestAnn && latestAnn.ts > lastAnnToast && latestAnn.ts >= weekAgo) {
            const sender =
              formatDisplayName({
                fullName: latestAnn.created_by_name,
                email: latestAnn.created_by_email,
              }) || "Staff";
            const header = `Announcement from ${sender}: ${latestAnn.title}`;
            const msg = `${header}\n${latestAnn.message || ""}`;
            showToast(msg, "info");
            localStorage.setItem(lastAnnouncementToastKey, String(latestAnn.ts));
          }
        }

        setUnread(maxTs > lastSeen && maxTs >= weekAgo ? 1 : 0);
      } catch (e) {
        // ignore polling errors
      }
    }
    checkNew();
    timer = setInterval(checkNew, 30000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  function computeUnread(list, lastTs) {
    const count = list.filter((n) => (n.created_at_ts || 0) > lastTs).length;
    setUnread(count);
  }

  function markSeen() {
    const now = Date.now();
    localStorage.setItem(lastSeenKey, String(now));
    computeUnread(items, now);
  }

  async function toggleOpen() {
    if (!open) {
      await fetchNotifications();
      setOpen(true);
      markSeen();
    } else {
      setOpen(false);
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const role = (user?.role || "").toLowerCase();
      const normalizeDate = (d) => {
        const t = new Date(d);
        return isNaN(t.getTime()) ? Date.now() : t.getTime();
      };
      const items = [];

      if (role === "staff") {
        const [pendingProj, pendingAch] = await Promise.all([
          apiClient.get(`/projects?verified=false&limit=50`),
          apiClient.get(
            `/achievements?verified=false&status=pending&limit=200`,
          ),
        ]);
        const projList = pendingProj.projects || [];
        const achList = pendingAch.achievements || [];
        const projCount = projList.length;
        const achCount = achList.length;
        const latestPendTs = (list) =>
          Math.max(0, ...list.map((x) => normalizeDate(x.created_at)));
        if (projCount > 0) {
          items.push({
            type: "pending",
            title: `${projCount} project${
              projCount > 1 ? "s" : ""
            } awaiting approval`,
            by:
              projCount === 1
                ? formatDisplayName({
                    fullName: projList[0].uploader_full_name,
                    email: projList[0].uploader_email,
                  })
                : "",
            created_at_ts: latestPendTs(projList),
            href:
              role === "admin" ? `/admin/verify-projects` : `/verify-projects`,
          });
        }
        if (achCount > 0) {
          items.push({
            type: "pending",
            title: `${achCount} achievement${
              achCount > 1 ? "s" : ""
            } awaiting approval`,
            by:
              achCount === 1
                ? formatDisplayName({
                    fullName: achList[0].user_fullname,
                    email: achList[0].user_email,
                  })
                : "",
            created_at_ts: latestPendTs(achList),
            href:
              role === "admin"
                ? `/admin/verify-achievements`
                : `/verify-achievements`,
          });
        }
      } else {
        const [myProj, myAch] = await Promise.all([
          apiClient.get(`/projects?limit=20&mine=true`),
          apiClient.get(
            `/achievements?limit=50${user?.id ? `&user_id=${user.id}` : ""}`,
          ),
        ]);
        for (const p of myProj.projects || []) {
          const status = (p.verification_status || "").toLowerCase();
          if (status === "approved" || status === "rejected") {
            const ts = normalizeDate(
              p.verified_at || p.updated_at || p.created_at,
            );
            if (ts >= weekAgo) {
              items.push({
                type: status === "approved" ? "approval" : "rejection",
                title:
                  status === "approved"
                    ? `Project "${p.title}" was approved`
                    : `Project "${p.title}" was rejected`,
                comment: p.verification_comment || "",
                by:
                  formatDisplayName({
                    fullName: p.verified_by_fullname,
                    email: p.verified_by_email,
                  }) || (status === "approved" ? "Approved" : "Rejected"),
                created_at_ts: ts,
                href: `/projects/${p.id}`,
              });
            }
          }
        }
        for (const a of myAch.achievements || []) {
          const status = (a.verification_status || "").toLowerCase();
          if (status === "approved" || status === "rejected") {
            const ts = normalizeDate(
              a.verified_at || a.updated_at || a.created_at,
            );
            if (ts >= weekAgo) {
              items.push({
                type: status === "approved" ? "approval" : "rejection",
                title:
                  status === "approved"
                    ? `Achievement "${a.title}" was approved`
                    : `Achievement "${a.title}" was rejected`,
                comment: a.verification_comment || "",
                by:
                  formatDisplayName({
                    fullName: a.verified_by_fullname,
                    email: a.verified_by_email,
                  }) || (status === "approved" ? "Approved" : "Rejected"),
                created_at_ts: ts,
                href: `/achievements/${a.id}`,
              });
            }
          }
        }
      }

      try {
        const ann = await apiClient.get(`/announcements/mine?limit=50`);
        for (const a of ann.announcements || []) {
          const ts = normalizeDate(a.delivered_at || a.created_at);
          if (ts >= weekAgo) {
            const sender =
              formatDisplayName({
                fullName: a.created_by_name,
                email: a.created_by_email,
              }) || "Staff";
            const brochureHref = a.brochure_filename
              ? getFileUrl(a.brochure_filename)
              : "";
            items.push({
              type: "announcement",
              title: a.title,
              description: a.description || "",
              message: a.message || "",
              by: sender,
              created_at_ts: ts,
              href: brochureHref,
              brochure_name: a.brochure_name || "",
            });
          }
        }
      } catch (e) {
        // ignore
      }

      const ev = await apiClient.get(`/events?order=latest&limit=10`);
      for (const e of ev.events || []) {
        items.push({
          type: "event",
          title: e.title,
          by: "Staff",
          created_at_ts: normalizeDate(e.created_at),
          href: `/events`,
        });
      }
      const filtered = items.filter((i) => (i.created_at_ts || 0) >= weekAgo);
      filtered.sort((x, y) => y.created_at_ts - x.created_at_ts);
      setItems(filtered);
    } catch (err) {
      console.error("Notifications error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const dot = unread > 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        title="Notifications"
        onClick={toggleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 hover:text-white transition cursor-pointer shadow-sm"
      >
        <FaBell className="h-4 w-4 text-purple-400" />
        {dot && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
        )}
      </button>

      {open && (
        <div className="fixed right-3 top-16 z-50 w-[330px] rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FaBell className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                Notifications
              </span>
            </div>

            {items.length > 0 && (
              <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700">
                {items.length} Recent
              </span>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[340px] overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                Loading notifications...
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-400">
                  <FaInbox className="w-6 h-6" />
                </span>
                <p className="text-xs font-extrabold text-slate-800 mt-1">
                  No notifications right now
                </p>
                <p className="text-[11px] text-slate-400 font-medium max-w-[200px]">
                  You are all caught up on your event announcements and reviews!
                </p>
              </div>
            ) : (
              items.map((n, idx) => {
                const Wrapper = n.href ? Link : "div";
                const wrapperProps = n.href ? { to: n.href, onClick: () => setOpen(false) } : {};

                let IconComp = FaBell;
                let iconColor = "bg-purple-50 text-purple-600 border-purple-100";
                if (n.type === "approval") {
                  IconComp = FaCheckCircle;
                  iconColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                } else if (n.type === "rejection") {
                  IconComp = FaTimesCircle;
                  iconColor = "bg-rose-50 text-rose-600 border-rose-100";
                } else if (n.type === "announcement") {
                  IconComp = FaBullhorn;
                  iconColor = "bg-blue-50 text-blue-600 border-blue-100";
                } else if (n.type === "event") {
                  IconComp = FaCalendarAlt;
                  iconColor = "bg-amber-50 text-amber-600 border-amber-100";
                }

                return (
                  <Wrapper
                    key={idx}
                    {...wrapperProps}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/80 hover:border-slate-200 transition-all duration-150 cursor-pointer text-left"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${iconColor} shadow-xs flex-shrink-0 mt-0.5`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </span>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                        {n.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold truncate">
                        {n.by ? `From: ${n.by}` : "System Notification"}
                      </p>
                      {n.comment && (
                        <p className="text-[11px] text-slate-600 font-medium line-clamp-1 italic">
                          "{n.comment}"
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold block pt-0.5">
                        {timeAgo(n.created_at_ts)}
                      </span>
                    </div>
                  </Wrapper>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/60 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-extrabold text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition"
            >
              <span>View All Notifications</span>
              <FaChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />
    </div>
  );
}
