import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";

export default function AchievementDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const passed = location?.state?.achievement;
        if (passed && String(passed.id) === String(id)) {
          // If email isn't present on the passed item, fetch full details to enrich
          if (!passed.user_email && !passed.uploader_email) {
            const res = await apiClient.get(`/achievements/${id}`);
            if (!mounted) return;
            setItem(res.achievement || res || passed);
            if (mounted) setLoading(false);
            return;
          }
          setItem(passed);
          if (mounted) setLoading(false);
          return;
        }

        const res = await apiClient.get(`/achievements/${id}`);
        if (!mounted) return;
        setItem(res.achievement || res || null);
      } catch (e) {
        console.error(e);
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!item)
    return (
      <div className="p-6">
        <h3 className="text-xl">Achievement not found</h3>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="glitter-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {item.title}
        </h1>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Awarded:{" "}
          {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
        </div>
        <p className="mt-4 text-slate-700 dark:text-slate-300">
          {item.description}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <div>
              <span className="font-semibold">Title:</span> {item.title || "-"}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Issuer:</span>{" "}
              {item.issuer || "-"}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Date:</span>{" "}
              {item.date_of_award || item.date
                ? new Date(item.date_of_award || item.date).toLocaleDateString()
                : "-"}
            </div>
            {item.position && (
              <div className="mt-1">
                <span className="font-semibold">Position:</span> {item.position}
              </div>
            )}
            {item.prize_amount && (
              <div className="mt-1">
                <span className="font-semibold">Prize Amount:</span> ₹
                {parseFloat(item.prize_amount).toFixed(2)}
              </div>
            )}
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <div>
              <span className="font-semibold">Performed By:</span>{" "}
              {item.student_name ||
                item.studentName ||
                item.user_fullname ||
                item.user_name ||
                item.name ||
                "-"}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Uploaded By:</span>{" "}
              {item.user_email ||
                item.uploader_email ||
                item.uploaded_by ||
                "-"}
            </div>
            {item.event_name && (
              <div className="mt-1">
                <span className="font-semibold">Event Name:</span>{" "}
                {item.event_name}
              </div>
            )}
          </div>
        </div>

        {/* Main Proof */}
        {item.proof_filename && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Main Proof
            </h3>
            <div className="mt-3">
              {item.proof_mime && item.proof_mime.startsWith("image/") ? (
                <img
                  src={`/uploads/${item.proof_filename}`}
                  alt={item.proof_name || "Main Proof"}
                  className="max-h-96 w-full rounded object-contain border"
                />
              ) : (
                <a
                  href={`/uploads/${item.proof_filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {item.proof_name || "Download Main Proof"}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Certificate */}
        {item.certificate_filename && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Certificate
            </h3>
            <div className="mt-3">
              {item.certificate_mime &&
              item.certificate_mime.startsWith("image/") ? (
                <img
                  src={`/uploads/${item.certificate_filename}`}
                  alt={item.certificate_name || "Certificate"}
                  className="max-h-96 w-full rounded object-contain border"
                />
              ) : (
                <a
                  href={`/uploads/${item.certificate_filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {item.certificate_name || "Download Certificate"}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Event Photos */}
        {item.event_photos_filename && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Event Photos
            </h3>
            <div className="mt-3">
              {item.event_photos_mime &&
              item.event_photos_mime.startsWith("image/") ? (
                <img
                  src={`/uploads/${item.event_photos_filename}`}
                  alt={item.event_photos_name || "Event Photos"}
                  className="max-h-96 w-full rounded object-contain border"
                />
              ) : (
                <a
                  href={`/uploads/${item.event_photos_filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {item.event_photos_name || "Download Event Photos"}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
