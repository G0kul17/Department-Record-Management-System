import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const passed = location?.state?.project;
        if (passed && String(passed.id) === String(id)) {
          setProject(passed);
        }

        const res = await apiClient.get(`/projects/${id}`);
        if (!mounted) return;
        setProject(res.project || res.data?.project || res || null);
      } catch (error) {
        console.error(error);
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
        <button onClick={() => nav(-1)} className="mb-4 text-sm underline">
          ← Back
        </button>
        <h3 className="text-xl">Project not found</h3>
      </div>
    );

  const uploadedBy = project.user_email || project.uploader_email || "-";
  const team =
    project.team_members ||
    project.teamMembers ||
    project.team_member_names ||
    project.team;
  const teamStr = Array.isArray(team) ? team.join(", ") : team;

  const attachments = (() => {
    const files = project?.files || project?.attachments || project?.project_files;
    if (!files) return [];
    try {
      return typeof files === "string" ? JSON.parse(files) : files;
    } catch {
      return Array.isArray(files) ? files : [files];
    }
  })();

  const attachmentCards = attachments
    .map((file, index) => {
      const filename =
        file?.filename || file?.file || (typeof file === "string" ? file : undefined);
      if (!filename) return null;

      const original = file?.original_name || file?.name || filename;
      const mime =
        file?.mime_type ||
        (original?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "");
      const url = getFileUrl(filename);
      const isImage =
        mime?.startsWith("image/") || (filename && /\.(png|jpe?g|gif|webp)$/i.test(filename));

      return {
        key: `${filename}-${index}`,
        original,
        url,
        isImage,
      };
    })
    .filter(Boolean);

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl bg-slate-50 px-4 py-5 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="glitter-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:gap-5 sm:pb-6">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Project Preview
            </div>
            <h1 className="break-words text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              {project.title}
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Uploaded
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {project.created_at ? new Date(project.created_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Uploaded By
              </div>
              <div className="mt-1 break-all text-sm font-medium text-slate-800 dark:text-slate-100">
                {uploadedBy}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60 sm:col-span-2 xl:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Team Members
              </div>
              <div className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                {teamStr || "-"}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-3xl break-words text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
          {project.description || "-"}
        </p>

        {project.github_url && (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              GitHub:
            </span>{" "}
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="break-all font-medium text-blue-700 hover:underline dark:text-blue-300"
            >
              {project.github_url}
            </a>
          </div>
        )}

        {attachmentCards.length > 0 && (
          <div className="mt-8 space-y-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Attachments
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {attachmentCards.map((file) => (
                <div
                  key={file.key}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <div className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {file.original || "Attachment"}
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex break-all text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                    >
                      Open file
                    </a>
                  </div>
                  <div className="p-4">
                    {file.isImage ? (
                      <img
                        src={file.url}
                        alt={file.original || "attachment"}
                        className="max-h-80 w-full rounded-xl border border-slate-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <div className="break-all rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
                        {file.original || "Attachment"}
                      </div>
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
