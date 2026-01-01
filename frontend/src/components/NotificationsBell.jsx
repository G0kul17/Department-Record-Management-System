import React, { useEffect, useRef, useState } from "react";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";
import { formatDisplayName } from "../utils/displayName";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const lastSeenKey = "notificationsLastSeen";
  const [unread, setUnread] = useState(0);

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

  // Background poll to show red dot when new items arrive
  useEffect(() => {
    let timer = null;
    async function checkNew() {
      try {
        const lastSeen = Number(localStorage.getItem(lastSeenKey) || 0);
        const role = (user?.role || "").toLowerCase();
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        let maxTs = 0;
        if (role === "staff" || role === "admin") {
          // For staff/admin, new submissions awaiting approval
          const [pendingProj, pendingAch] = await Promise.all([
            apiClient.get(`/projects?verified=false&limit=20`),
            apiClient.get(
              `/achievements?verified=false&status=pending&limit=50`
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
          // For students, approvals of their own items (use verified_at)
          const [myProj, myAch] = await Promise.all([
            apiClient.get(`/projects?limit=20&mine=true`),
            apiClient.get(
              `/achievements?limit=50${user?.id ? `&user_id=${user.id}` : ""}`
            ),
          ]);
          const toVerifiedTs = (item) => {
            const t = new Date(item?.verified_at);
            return isNaN(t.getTime()) ? 0 : t.getTime();
          };
          const approvedMine = [
            ...(myProj.projects || []).filter(
              (p) => (p.verification_status || "").toLowerCase() === "approved"
            ),
            ...(myAch.achievements || []).filter(
              (a) => (a.verification_status || "").toLowerCase() === "approved"
            ),
          ];
          maxTs = Math.max(0, ...approvedMine.map(toVerifiedTs));
        }

        setUnread(maxTs > lastSeen && maxTs >= weekAgo ? 1 : 0);
      } catch (e) {
        // ignore polling errors
      }
    }
    // initial check
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
      const me = (user?.email || "").toLowerCase();
      const normalizeDate = (d) => {
        const t = new Date(d);
        return isNaN(t.getTime()) ? Date.now() : t.getTime();
      };
      const items = [];

      if (role === "staff" || role === "admin") {
        // Pending approvals summary for staff/admin
        const [pendingProj, pendingAch] = await Promise.all([
          apiClient.get(`/projects?verified=false&limit=50`),
          apiClient.get(
            `/achievements?verified=false&status=pending&limit=200`
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
        // Student: show approvals of their own items in last week
        const [myProj, myAch] = await Promise.all([
          apiClient.get(`/projects?limit=20&mine=true`),
          apiClient.get(
            `/achievements?limit=50${user?.id ? `&user_id=${user.id}` : ""}`
          ),
        ]);
        for (const p of myProj.projects || []) {
          if ((p.verification_status || "").toLowerCase() === "approved") {
            const ts = normalizeDate(
              p.verified_at || p.updated_at || p.created_at
            );
            if (ts >= weekAgo) {
              items.push({
                type: "approval",
                title: `Your project "${p.title}" was approved`,
                by:
                  formatDisplayName({
                    fullName: p.verified_by_fullname,
                    email: p.verified_by_email,
                  }) || "Approved",
                created_at_ts: ts,
                href: `/projects/${p.id}`,
              });
            }
          }
        }
        for (const a of myAch.achievements || []) {
          if ((a.verification_status || "").toLowerCase() === "approved") {
            const ts = normalizeDate(
              a.verified_at || a.updated_at || a.created_at
            );
            if (ts >= weekAgo) {
              items.push({
                type: "approval",
                title: `Your achievement "${a.title}" was approved`,
                by:
                  formatDisplayName({
                    fullName: a.verified_by_fullname,
                    email: a.verified_by_email,
                  }) || "Approved",
                created_at_ts: ts,
                href: `/achievements/${a.id}`,
              });
            }
          }
        }
      }

      // Always include recent public events
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
      <button title="Notifications" onClick={toggleOpen} className="relative">
        {/* bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
        >
          <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2z" fill="currentColor" />
          <path
            d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16l-2-2z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        {dot && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border-2 border-[#87CEEB] bg-white shadow">
          <div className="border-b border-[#87CEEB]/40 p-3 text-sm font-semibold">
            Notifications
          </div>
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="text-sm text-slate-600 p-3">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-slate-600 p-3">No notifications</div>
            ) : (
              items.map((n, idx) => (
                <a
                  key={idx}
                  href={n.href}
                  className="block rounded-md px-3 py-2 hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-slate-800 pr-3">
                      {n.type === "event" ? (
                        <span>
                          Event: <span className="font-medium">{n.title}</span>
                        </span>
                      ) : n.type === "project" ? (
                        <span>
                          Project:{" "}
                          <span className="font-medium">{n.title}</span>
                        </span>
                      ) : n.type === "achievement" ? (
                        <span>
                          Achievement:{" "}
                          <span className="font-medium">{n.title}</span>
                        </span>
                      ) : n.type === "pending" ? (
                        <span>
                          <span className="font-medium">{n.title}</span>
                        </span>
                      ) : n.type === "approval" ? (
                        <span>
                          <span className="font-medium">{n.title}</span>
                        </span>
                      ) : (
                        <span className="font-medium">{n.title}</span>
                      )}
                      <div className="text-xs text-slate-500">{n.by || ""}</div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {timeAgo(n.created_at_ts)}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
