import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaArrowLeft,
  FaLaptopCode,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaUsers,
  FaGithub,
  FaCalendarAlt,
  FaPaperclip,
  FaExternalLinkAlt,
  FaFileAlt,
} from "react-icons/fa";

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
    return () => { mounted = false; };
  }, [id, location?.state]);

  const uploadedBy =
    project?.uploader_full_name ||
    project?.user_fullname ||
    project?.user_email ||
    project?.uploader_email ||
    "-";

  const approvedBy =
    project?.verified_by_fullname ||
    project?.verified_by_name ||
    project?.approved_by_fullname ||
    "-";

  const team = project?.team_members || project?.teamMembers || project?.team;
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
        mime?.startsWith("image/") ||
        (filename && /\.(png|jpe?g|gif|webp)$/i.test(filename));
      return { key: `${filename}-${index}`, original, url, isImage };
    })
    .filter(Boolean);

  const status = project?.verification_status || project?.status || "pending";
  const isApproved = status === "approved";

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] flex flex-col items-center justify-center gap-4 p-6">
        <FaLaptopCode className="w-12 h-12 text-slate-300" />
        <h3 className="text-lg font-extrabold text-slate-700">Project not found</h3>
        <button
          onClick={() => nav("/projects/approved")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
        >
          <FaArrowLeft className="w-3 h-3" /> Back to Approved Projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* Back Button */}
        <button
          onClick={() => nav("/projects/approved")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
        >
          <FaArrowLeft className="w-3 h-3 text-slate-600" />
          Back to Approved Projects
        </button>

        {/* Header Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm space-y-4">
          {/* Top row: icon + title + status */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-xs flex-shrink-0">
              <FaLaptopCode className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-extrabold text-blue-700">
                  Project
                </span>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-extrabold text-emerald-700">
                    <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-extrabold text-amber-700">
                    <FaClock className="w-3 h-3 text-amber-500" />
                    Pending
                  </span>
                )}
                {project.activity_type && (
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600">
                    {project.activity_type}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight break-words">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-sm text-slate-600 leading-relaxed break-words">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            {/* Uploaded by */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
              <FaUser className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Uploaded By</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-800 break-all">{uploadedBy}</div>
              </div>
            </div>

            {/* Approved by */}
            {approvedBy !== "-" && (
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <FaCheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Approved By</div>
                  <div className="mt-0.5 text-sm font-semibold text-emerald-900 break-words">{approvedBy}</div>
                </div>
              </div>
            )}

            {/* Upload date */}
            {project.created_at && (
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <FaCalendarAlt className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Uploaded On</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800">
                    {new Date(project.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Team members */}
            {teamStr && (
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <FaUsers className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Team Members</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{teamStr}</div>
                </div>
              </div>
            )}
          </div>

          {/* GitHub Link */}
          {project.github_url && (
            <div className="flex items-start gap-3 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3">
              <FaGithub className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Repository</div>
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 text-sm font-semibold text-blue-400 hover:text-blue-300 underline break-all inline-flex items-start gap-1"
                >
                  {project.github_url}
                  <FaExternalLinkAlt className="w-2.5 h-2.5 mt-1 flex-shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        {attachmentCards.length > 0 && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <FaPaperclip className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-800">
                Attachments ({attachmentCards.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {attachmentCards.map((file) => (
                <div
                  key={file.key}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaFileAlt className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 break-words truncate">
                        {file.original || "Attachment"}
                      </span>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition"
                    >
                      Open
                    </a>
                  </div>
                  <div className="p-4">
                    {file.isImage ? (
                      <img
                        src={file.url}
                        alt={file.original || "attachment"}
                        className="max-h-72 w-full rounded-xl border border-slate-200 bg-white object-contain"
                      />
                    ) : (
                      <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-600 font-medium break-all">
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
