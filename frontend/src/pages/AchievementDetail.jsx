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
      <div className="rounded-xl p-6 bg-white dark:bg-slate-900 dark:border dark:border-slate-700 shadow">
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
          </div>
        </div>
        {(() => {
          // Support multiple attachment fields used across the app
          const candidate =
            item?.proof_files ||
            item?.proof_file ||
            item?.files ||
            item?.attachments;
          const single =
            item?.proof_filename || item?.proof_file_name || item?.proofName;
          if (!candidate && !single) return null;
          let arr = [];
          if (candidate) {
            try {
              arr =
                typeof candidate === "string"
                  ? JSON.parse(candidate)
                  : candidate;
            } catch (_) {
              arr = Array.isArray(candidate) ? candidate : [candidate];
            }
          }
          if (single && (!arr || arr.length === 0)) {
            arr = [
              {
                filename: single,
                original_name:
                  item?.proof_name || item?.proof_original_name || single,
              },
            ];
          }
          const files = Array.isArray(arr) ? arr : [arr];
          if (!files || files.length === 0) return null;
          const base =
            apiClient && apiClient.baseURL
              ? String(apiClient.baseURL).replace(/\/api$/, "")
              : window.location.origin;
          return (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Attachments
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {files.map((f, i) => {
                  const filename =
                    f?.filename ||
                    f?.file ||
                    (typeof f === "string" ? f : undefined);
                  const original = f?.original_name || f?.name || filename;
                  const mime =
                    f?.mime_type ||
                    (original?.toLowerCase().endsWith(".pdf")
                      ? "application/pdf"
                      : "");
                  const url = `${base}/uploads/${filename}`;
                  const isImage =
                    mime?.startsWith("image/") ||
                    (filename && /\.(png|jpe?g|gif|webp)$/i.test(filename));
                  return (
                    <div
                      key={i}
                      className="rounded border p-2 dark:border-slate-700"
                    >
                      {isImage ? (
                        <img
                          src={url}
                          alt={original || "attachment"}
                          className="max-h-80 w-full rounded object-contain"
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {original || "Attachment"}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
