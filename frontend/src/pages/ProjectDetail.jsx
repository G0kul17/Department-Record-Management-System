import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Show fast fallback if provided, but still fetch full details
        const passed = location?.state?.project;
        if (passed && String(passed.id) === String(id)) {
          setProject(passed);
        }
        const res = await apiClient.get(`/projects/${id}`);
        if (!mounted) return;
        // apiClient returns parsed JSON directly
        setProject(res.project || res.data?.project || res || null);
      } catch (e) {
        console.error(e);
        if (mounted) setProject(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, location?.state]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!project)
    return (
      <div className="p-6">
        <button onClick={() => nav(-1)} className="text-sm underline mb-4">
          ← Back
        </button>
        <h3 className="text-xl">Project not found</h3>
      </div>
    );

  const attachments = (() => {
    const f = project?.files || project?.attachments || project?.project_files;
    if (!f) return [];
    try {
      return typeof f === "string" ? JSON.parse(f) : f;
    } catch {
      return Array.isArray(f) ? f : [f];
    }
  })();
  const base =
    apiClient && apiClient.baseURL
      ? String(apiClient.baseURL).replace(/\/api$/, "")
      : window.location.origin;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl p-6 bg-white dark:bg-slate-900 dark:border dark:border-slate-700 shadow">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {project.title}
        </h1>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Uploaded:{" "}
          {project.created_at
            ? new Date(project.created_at).toLocaleString()
            : "-"}
        </div>
        <p className="mt-4 text-slate-700 dark:text-slate-300">
          {project.description}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <div className="mt-1">
              <span className="font-semibold">Uploaded By:</span>{" "}
              {project.user_email || project.uploader_email || "-"}
            </div>
            {project.github_url && (
              <div className="mt-1">
                <span className="font-semibold">GitHub:</span>{" "}
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {project.github_url}
                </a>
              </div>
            )}
            {(() => {
              const team =
                project.team_members ||
                project.teamMembers ||
                project.team_member_names ||
                project.team;
              const teamStr = Array.isArray(team) ? team.join(", ") : team;
              return teamStr ? (
                <div className="mt-1">
                  <span className="font-semibold">Team Members:</span> {teamStr}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Attachments
            </h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {attachments.map((f, i) => {
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
        )}
      </div>
    </div>
  );
}
