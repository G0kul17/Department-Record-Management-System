import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaArrowLeft,
  FaTrophy,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaCalendarAlt,
  FaBuilding,
  FaMedal,
  FaMoneyBillWave,
  FaPaperclip,
  FaFileAlt,
  FaStar,
} from "react-icons/fa";

export default function AchievementDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const passed = location?.state?.achievement;
        if (passed && String(passed.id) === String(id)) {
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

  const performer =
    item?.student_name ||
    item?.studentName ||
    item?.user_fullname ||
    item?.user_name ||
    item?.name ||
    "-";

  const uploader = item?.user_email || item?.uploader_email || item?.uploaded_by || "-";
  const awardDate = item?.date_of_award || item?.date;
  const status = item?.verification_status || item?.status || "pending";
  const isApproved = status === "approved";

  const attachmentSections = [
    {
      label: "Main Proof",
      filename: item?.proof_filename,
      mime: item?.proof_mime,
      name: item?.proof_name || "Main Proof",
    },
    {
      label: "Certificate",
      filename: item?.certificate_filename,
      mime: item?.certificate_mime,
      name: item?.certificate_name || "Certificate",
    },
    {
      label: "Event Photos",
      filename: item?.event_photos_filename,
      mime: item?.event_photos_mime,
      name: item?.event_photos_name || "Event Photos",
    },
  ].filter((s) => s.filename);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading achievement...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
          <FaTrophy className="w-6 h-6" />
        </span>
        <h3 className="text-lg font-extrabold text-slate-700 dark:text-slate-300">Achievement not found</h3>
        <button
          onClick={() => nav("/achievements/approved")}
          className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <FaArrowLeft className="w-3.5 h-3.5" /> Back to Approved Achievements
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 w-full">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* Back Button */}
        <button
          onClick={() => nav("/achievements/approved")}
          className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Back to Approved Achievements
        </button>

        {/* Header Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-4">
          {/* Top row: icon + title + status */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
              <FaTrophy className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-0.5 text-xs font-extrabold text-blue-700 dark:text-blue-300">
                  Achievement
                </span>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-0.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                    <FaCheckCircle className="w-3 h-3" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                    <FaClock className="w-3 h-3" />
                    Pending
                  </span>
                )}
                {item.activity_type && (
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {item.activity_type}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight break-words">
                {item.title}
              </h1>
              {item.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Performer */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-4 py-3">
              <FaUser className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Performed By</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">{performer}</div>
              </div>
            </div>

            {/* Uploader */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-4 py-3">
              <FaUser className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Uploaded By</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{uploader}</div>
              </div>
            </div>

            {/* Issuer */}
            {item.issuer && (
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-4 py-3">
                <FaBuilding className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Issuer</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">{item.issuer}</div>
                </div>
              </div>
            )}

            {/* Date of Award */}
            {awardDate && (
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-4 py-3">
                <FaCalendarAlt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Date of Award</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(awardDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Position */}
            {item.position && (
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 px-4 py-3">
                <FaMedal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 dark:text-amber-400">Position</div>
                  <div className="mt-0.5 text-sm font-semibold text-amber-900 dark:text-amber-300 break-words">{item.position}</div>
                </div>
              </div>
            )}

            {/* Prize Amount */}
            {item.prize_amount && (
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 px-4 py-3">
                <FaMoneyBillWave className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Prize Amount</div>
                  <div className="mt-0.5 text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    ₹{parseFloat(item.prize_amount).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Event Name */}
            {item.event_name && (
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-4 py-3 sm:col-span-2">
                <FaStar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Event Name</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">{item.event_name}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        {attachmentSections.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
                <FaPaperclip className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-white">
                Attachments ({attachmentSections.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {attachmentSections.map((section) => (
                <div
                  key={section.label}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaFileAlt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{section.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 break-all truncate">{section.name}</div>
                      </div>
                    </div>
                    <a
                      href={getFileUrl(section.filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                    >
                      Open
                    </a>
                  </div>
                  <div className="p-4">
                    {section.mime && section.mime.startsWith("image/") ? (
                      <img
                        src={getFileUrl(section.filename)}
                        alt={section.name}
                        className="max-h-72 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 object-contain"
                      />
                    ) : (
                      <a
                        href={getFileUrl(section.filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400 break-all hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                      >
                        {section.name}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
