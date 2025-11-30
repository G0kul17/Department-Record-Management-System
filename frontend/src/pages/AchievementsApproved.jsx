import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { Link } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";

export default function AchievementsApproved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(
          "/achievements?verified=true&limit=200"
        );
        if (!mounted) return;
        setItems(data.achievements || []);
      } catch (e) {
        console.error(e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Approved Achievements
        </h1>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {loading ? "Loading..." : `${items.length} achievements`}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5">
        {items.map((a) => {
          const attachments = [];
          // support proof file + attachments array
          if (a.proof_filename) {
            attachments.push({
              name: a.proof_name || a.proof_filename,
              filename: a.proof_filename,
            });
          }
          if (a.attachments) {
            try {
              const arr =
                typeof a.attachments === "string"
                  ? JSON.parse(a.attachments)
                  : a.attachments;
              if (Array.isArray(arr)) {
                arr.forEach((f) => {
                  if (!f) return;
                  if (typeof f === "string")
                    attachments.push({ name: f, filename: f });
                  else
                    attachments.push({
                      name: f.original_name || f.name || f.filename,
                      filename: f.filename || f.file,
                    });
                });
              }
            } catch (_) {}
          }

          const team = a.team_members || a.teamMembers || a.team || [];
          const teamStr = Array.isArray(team) ? team.join(", ") : team;

          const approvedAt = a.verified_at || a.approvedAt || a.created_at;

          return (
            <div
              key={a.id}
              className="rounded-xl border p-4 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                      {a.title}
                    </h3>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {approvedAt
                          ? new Date(approvedAt).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    Uploaded by:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {a.studentName ||
                        a.user_fullname ||
                        a.user_name ||
                        a.name ||
                        "Student"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                    {a.description || "-"}
                  </p>

                  {teamStr && (
                    <div className="mt-3 text-sm text-slate-600">
                      Team Members: {teamStr}
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Attachments
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {attachments.map((f, i) => {
                          const filename = f.filename || f.name;
                          const downloadUrl = `${
                            apiClient && apiClient.baseURL
                              ? String(apiClient.baseURL).replace(
                                  /\/?api\/?$/,
                                  ""
                                )
                              : window.location.origin
                          }/uploads/${filename}`;
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-3"
                            >
                              <div>
                                <button
                                  onClick={() =>
                                    setPreviewFile({
                                      filename,
                                      original_name: f.name || f.original_name,
                                    })
                                  }
                                  className="text-sm text-blue-600 underline"
                                >
                                  {f.name || f.original_name || filename}
                                </button>
                              </div>
                              <div className="ml-4">
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="text-sm text-slate-600 dark:text-slate-300"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Approved by:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {a.verified_by_name ||
                        a.approved_by ||
                        a.approvedBy ||
                        a.approvedByName ||
                        "Staff"}
                    </span>
                  </div>
                  <Link
                    to={`/achievements/${a.id}`}
                    state={{ achievement: a }}
                    className="inline-block rounded-md bg-blue-600 px-3 py-1 text-white text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {previewFile && (
        <AttachmentPreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
