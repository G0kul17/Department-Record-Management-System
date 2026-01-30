import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";

export default function AchievementsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState({ open: false, item: null });
  const [view, setView] = useState("pending");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(
        "/achievements?verified=false&status=pending&limit=50"
      );
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
      const data = await apiClient.get(
        "/achievements?verified=false&status=rejected&limit=200"
      );
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
  const openModal = (item) => setModal({ open: true, item });
  const closeModal = () => setModal({ open: false, item: null });

  return (
    <div className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Achievements
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={async () => {
                setView("pending");
                await load();
              }}
              className={`btn btn-xs ${
                view === "pending"
                  ? "btn-primary"
                  : "btn-ghost"
              }`}
            >
              Pending
            </button>
            <button
              onClick={async () => {
                setView("rejected");
                await showRejected();
              }}
              className={`text-xs rounded-md px-2 py-0.5 font-semibold ${
                view === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        <button
          onClick={() => (view === "pending" ? load() : showRejected())}
          disabled={loading}
          className="btn btn-primary btn-sm"
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
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  Verified
                </span>
              ) : a.verification_status === "rejected" ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  Rejected
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(a)}
                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100"
                  >
                    View
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
                    className="btn btn-primary btn-xs"
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
                {a.position && (
                  <div>
                    <span className="font-semibold">Position:</span>{" "}
                    {a.position}
                  </div>
                )}
                {a.prize_amount && (
                  <div>
                    <span className="font-semibold">Prize Amount:</span> ₹
                    {parseFloat(a.prize_amount).toFixed(2)}
                  </div>
                )}
                {a.proof_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Main Proof:</span>{" "}
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
                        className="link link-primary"
                      >
                        {a.proof_name || "Download proof"}
                      </a>
                    )}
                  </div>
                )}
                {a.certificate_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Certificate:</span>{" "}
                    {a.certificate_mime &&
                    a.certificate_mime.startsWith("image/") ? (
                      <img
                        src={`/uploads/${a.certificate_filename}`}
                        alt={a.certificate_name || "Certificate"}
                        className="mt-2 max-h-64 rounded border"
                      />
                    ) : (
                      <a
                        href={`/uploads/${a.certificate_filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link link-primary"
                      >
                        {a.certificate_name || "Download certificate"}
                      </a>
                    )}
                  </div>
                )}
                {a.event_photos_filename && (
                  <div className="mt-2">
                    <span className="font-semibold">Event Photos:</span>{" "}
                    {a.event_photos_mime &&
                    a.event_photos_mime.startsWith("image/") ? (
                      <img
                        src={`/uploads/${a.event_photos_filename}`}
                        alt={a.event_photos_name || "Event Photos"}
                        className="mt-2 max-h-64 rounded border"
                      />
                    ) : (
                      <a
                        href={`/uploads/${a.event_photos_filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link link-primary"
                      >
                        {a.event_photos_name || "Download photos"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="max-w-2xl w-full rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Achievement Details
              </h3>
              <button
                className="rounded-md bg-slate-200 px-3 py-1 text-sm dark:bg-slate-800"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto">
              <div>
                <span className="font-semibold">Title:</span>{" "}
                {modal.item?.title}
              </div>
              <div>
                <span className="font-semibold">Issuer:</span>{" "}
                {modal.item?.issuer}
              </div>
              <div>
                <span className="font-semibold">Award Date:</span>{" "}
                {modal.item?.date_of_award || modal.item?.date}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {modal.item?.name}
              </div>
              {modal.item?.position && (
                <div>
                  <span className="font-semibold">Position:</span>{" "}
                  {modal.item?.position}
                </div>
              )}
              {modal.item?.prize_amount && (
                <div>
                  <span className="font-semibold">Prize Amount:</span> ₹
                  {parseFloat(modal.item?.prize_amount).toFixed(2)}
                </div>
              )}
              <div>
                <span className="font-semibold">Uploaded By:</span>{" "}
                {modal.item?.user_email}
              </div>
              <div className="mt-3">
                <span className="font-semibold">Main Proof:</span>
                {modal.item?.proof_mime &&
                modal.item?.proof_mime.startsWith("image/") ? (
                  <div className="mt-2">
                    <img
                      alt={modal.item?.proof_name || "proof"}
                      src={`${apiClient.baseURL.replace(
                        /\/api$/,
                        ""
                      )}/uploads/${modal.item?.proof_filename}`}
                      className="max-h-80 rounded"
                    />
                  </div>
                ) : modal.item?.proof_filename ? (
                  <a
                    href={`${apiClient.baseURL.replace(/\/api$/, "")}/uploads/${
                      modal.item?.proof_filename
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="link link-primary ml-2"
                  >
                    Download proof
                  </a>
                ) : (
                  <span className="ml-2">No file</span>
                )}
              </div>
              {modal.item?.certificate_filename && (
                <div className="mt-3">
                  <span className="font-semibold">Certificate:</span>
                  {modal.item?.certificate_mime &&
                  modal.item?.certificate_mime.startsWith("image/") ? (
                    <div className="mt-2">
                      <img
                        alt={modal.item?.certificate_name || "certificate"}
                        src={`${apiClient.baseURL.replace(
                          /\/api$/,
                          ""
                        )}/uploads/${modal.item?.certificate_filename}`}
                        className="max-h-80 rounded"
                      />
                    </div>
                  ) : (
                    <a
                      href={`${apiClient.baseURL.replace(/\/api$/, "")}/uploads/${
                        modal.item?.certificate_filename
                      }`}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-primary ml-2"
                    >
                      Download certificate
                    </a>
                  )}
                </div>
              )}
              {modal.item?.event_photos_filename && (
                <div className="mt-3">
                  <span className="font-semibold">Event Photos:</span>
                  {modal.item?.event_photos_mime &&
                  modal.item?.event_photos_mime.startsWith("image/") ? (
                    <div className="mt-2">
                      <img
                        alt={modal.item?.event_photos_name || "event photos"}
                        src={`${apiClient.baseURL.replace(
                          /\/api$/,
                          ""
                        )}/uploads/${modal.item?.event_photos_filename}`}
                        className="max-h-80 rounded"
                      />
                    </div>
                  ) : (
                    <a
                      href={`${apiClient.baseURL.replace(/\/api$/, "")}/uploads/${
                        modal.item?.event_photos_filename
                      }`}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-primary ml-2"
                    >
                      Download photos
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
