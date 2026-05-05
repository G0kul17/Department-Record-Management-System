import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";

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

  const performer =
    item.student_name ||
    item.studentName ||
    item.user_fullname ||
    item.user_name ||
    item.name ||
    "-";

  const uploader = item.user_email || item.uploader_email || item.uploaded_by || "-";
  const awardDate = item.date_of_award || item.date;
  const infoRows = [
    { label: "Title", value: item.title || "-" },
    { label: "Issuer", value: item.issuer || "-" },
    {
      label: "Date",
      value: awardDate ? new Date(awardDate).toLocaleDateString() : "-",
    },
    ...(item.position ? [{ label: "Position", value: item.position }] : []),
    ...(item.prize_amount
      ? [
          {
            label: "Prize Amount",
            value: `₹${parseFloat(item.prize_amount).toFixed(2)}`,
          },
        ]
      : []),
  ];

  const attachmentSections = [
    {
      label: "Main Proof",
      filename: item.proof_filename,
      mime: item.proof_mime,
      name: item.proof_name || "Download Main Proof",
    },
    {
      label: "Certificate",
      filename: item.certificate_filename,
      mime: item.certificate_mime,
      name: item.certificate_name || "Download Certificate",
    },
    {
      label: "Event Photos",
      filename: item.event_photos_filename,
      mime: item.event_photos_mime,
      name: item.event_photos_name || "Download Event Photos",
    },
  ].filter((section) => section.filename);

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl bg-slate-50 px-4 py-5 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="glitter-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:gap-5 sm:pb-6">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Achievement Preview
            </div>
            <h1 className="break-words text-2xl font-bold leading-tight text-slate-900 sm:text-3xl dark:text-slate-100">
              {item.title}
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Awarded
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Performed By
              </div>
              <div className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                {performer}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60 sm:col-span-2 xl:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Uploaded By
              </div>
              <div className="mt-1 break-all text-sm font-medium text-slate-800 dark:text-slate-100">
                {uploader}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base dark:text-slate-300 break-words">
          {item.description || "-"}
        </p>

        {item.event_name && (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Event Name:
            </span>{" "}
            {item.event_name}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {infoRows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {row.label}
              </div>
              <div className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {attachmentSections.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Attachments
            </h3>
            <div className="grid gap-4">
              {attachmentSections.map((section) => (
                <div
                  key={section.label}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {section.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 break-all">
                        {section.name}
                      </div>
                    </div>
                    <a
                      href={getFileUrl(section.filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Open
                    </a>
                  </div>
                  <div className="p-4">
                    {section.mime && section.mime.startsWith("image/") ? (
                      <img
                        src={getFileUrl(section.filename)}
                        alt={section.name}
                        className="max-h-[28rem] w-full rounded-xl border border-slate-200 object-contain bg-white dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <a
                        href={getFileUrl(section.filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm ring-1 ring-inset ring-blue-100 break-all dark:bg-slate-900 dark:text-blue-300 dark:ring-blue-950/60"
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
