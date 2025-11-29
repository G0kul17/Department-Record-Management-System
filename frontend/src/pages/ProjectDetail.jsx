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
        // If navigation passed project in location.state, use it as a fast fallback
        const passed = location?.state?.project;
        if (passed && String(passed.id) === String(id)) {
          setProject(passed);
          if (mounted) setLoading(false);
          return;
        }

        const data = await apiClient.get(`/projects/${id}`);
        if (!mounted) return;
        setProject(data.project || null);
      } catch (e) {
        console.error(e);
        if (mounted) setProject(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!project) return (
    <div className="p-6">
      <button onClick={() => nav(-1)} className="text-sm underline mb-4">← Back</button>
      <h3 className="text-xl">Project not found</h3>
    </div>
  );

  const attachments = (() => {
    if (!project.attachments) return [];
    try { return typeof project.attachments === 'string' ? JSON.parse(project.attachments) : project.attachments; } catch { return [] }
  })();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl p-6 bg-white shadow">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <div className="text-sm text-slate-500 mt-2">Uploaded: {project.created_at ? new Date(project.created_at).toLocaleString() : '-'}</div>
        <p className="mt-4 text-slate-700">{project.description}</p>

        {attachments.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Attachments</h4>
            <ul className="list-disc list-inside mt-2">
              {attachments.map((a, i) => (
                <li key={i}><a className="text-blue-600 underline" href={a.url || a.filename} target="_blank" rel="noreferrer">{a.original_name || a.name || a.filename}</a></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
