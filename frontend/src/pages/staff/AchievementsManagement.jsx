import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";

export default function AchievementsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState("pending");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/achievements?verified=false&status=pending&limit=50");
      setItems(data.achievements || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    try {
      setBusyId(id);
      const resp = await apiClient.post(`/achievements/${id}/verify`);
      if (resp) await load();
    } catch (e) {
      // optionally handle error
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    try {
      setBusyId(id);
      const resp = await apiClient.post(`/achievements/${id}/reject`);
      if (resp) await load();
    } catch (e) {
      // optionally handle error
    } finally {
      setBusyId(null);
    }
  };

  const showRejected = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/achievements?verified=false&status=rejected&limit=200");
      setItems(data.achievements || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Achievements</h2>
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={async () => {
                setView("pending");
                await load();
              }}
              className={`text-xs rounded-md px-2 py-0.5 font-semibold ${view === "pending" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}
            >
              Pending
            </button>
            <button
              onClick={async () => {
                setView("rejected");
                await showRejected();
              }}
              className={`text-xs rounded-md px-2 py-0.5 font-semibold ${view === "rejected" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-800"}`}
            >
              Rejected
            </button>
          </div>
        </div>

        <button
          onClick={() => (view === "pending" ? load() : showRejected())}
          disabled={loading}
          className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && !loading && (
          <div className="text-slate-600 dark:text-slate-300">
            No achievements found.
          </div>
        )}
        {items.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {a.title}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {a.issuer || ""}
                </div>
              </div>
              {a.verification_status === "approved" ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">Verified</span>
              ) : a.verification_status === "rejected" ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">Rejected</span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleView(a.id)}
                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {expandedId === a.id ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => reject(a.id)}
                    disabled={busyId === a.id}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
                  >
                    {busyId === a.id ? "Processing..." : "Reject"}
                  </button>
                  <button
                    onClick={() => approve(a.id)}
                    disabled={busyId === a.id}
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busyId === a.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              )}
            </div>
            {expandedId === a.id && (
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <div>
                  <span className="font-semibold">Issuer:</span>{" "}
                  {a.issuer || "—"}
                </div>
                <div>
                  <span className="font-semibold">Award Date:</span>{" "}
                  {a.date_of_award || a.date || "—"}
                </div>
                <div>
                  <span className="font-semibold">Name:</span> {a.name || "—"}
                </div>
                {a.proof_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Proof:</span>{" "}
                    {a.proof_mime && a.proof_mime.startsWith("image/") ? (
                      <img
                        src={`/uploads/${a.proof_filename}`}
                        alt={a.proof_name || "Proof"}
                        className="mt-2 max-h-64 rounded border"
                      />
                    ) : (
                      <a
                        href={`/uploads/${a.proof_filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {a.proof_name || "Download proof"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
