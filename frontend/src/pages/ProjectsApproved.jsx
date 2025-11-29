import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import { Link } from "react-router-dom";
import AttachmentPreview from "../components/AttachmentPreview";

export default function ProjectsApproved() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.get("/projects?verified=true&limit=200");
        if (!mounted) return;
        setProjects(data.projects || []);
      } catch (e) {
        console.error(e);
        if (mounted) setProjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Approved Projects</h1>
        <div className="text-sm text-slate-600">{loading ? "Loading..." : `${projects.length} projects`}</div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5">
        {projects.map((p) => {
          const files = (() => {
            if (!p.files) return [];
            try {
              return typeof p.files === "string" ? JSON.parse(p.files) : p.files;
            } catch (e) {
              return Array.isArray(p.files) ? p.files : [];
            }
          })();

          const team = p.team_members || p.teamMembers || p.team || [];
          const teamStr = Array.isArray(team) ? team.join(", ") : team;
          const approvedAt = p.verified_at || p.approvedAt || p.created_at;

          return (
            <div key={p.id} className="rounded-xl border p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-slate-800">{p.title}</h3>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-slate-500">{approvedAt ? new Date(approvedAt).toLocaleString() : "-"}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-slate-700">Uploaded by: <span className="font-medium">{p.studentName || p.user_fullname || p.user_name || p.student_name || p.uploader || p.owner_name || 'Student'}</span></div>

                  <p className="mt-3 text-sm text-slate-700">{p.description || "-"}</p>

                  {teamStr && (
                    <div className="mt-3 text-sm text-slate-600">Team Members: {teamStr}</div>
                  )}

                  {files && files.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-500">Attachments</div>
                      <div className="mt-2 flex flex-col gap-2">
                        {files.map((f, i) => {
                          const filename = f.filename || f.file || (typeof f === 'string' ? f : undefined);
                          const original = f.original_name || f.name || filename;
                          const downloadUrl = `${(apiClient && apiClient.baseURL ? String(apiClient.baseURL).replace(/\/?api\/?$/, '') : window.location.origin)}/uploads/${filename}`;
                          return (
                            <div key={i} className="flex items-center justify-between gap-3">
                              <div>
                                <button onClick={() => setPreviewFile({ filename, original_name: original })} className="text-sm text-blue-600 underline">{original || 'Attachment'}</button>
                              </div>
                              <div className="ml-4">
                                {filename && (
                                  <a href={downloadUrl} target="_blank" rel="noreferrer" download className="text-sm text-slate-600">Download</a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-sm text-slate-700">Approved by: <span className="font-medium">{p.verified_by_name || p.approved_by || p.approvedByName || 'Staff'}</span></div>
                  <Link to={`/projects/${p.id}`} state={{ project: p }} className="inline-block rounded-md bg-blue-600 px-3 py-1 text-white text-sm">View</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {previewFile && (
        <AttachmentPreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
