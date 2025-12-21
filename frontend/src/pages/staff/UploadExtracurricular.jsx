import React, { useState } from "react";
import apiClient from "../../api/axiosClient";

export default function UploadExtracurricular() {
  const [uploaderName, setUploaderName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePreview = async (e) => {
    e.preventDefault();
    setMessage("");
    setPreview(null);
    setMeta(null);
    if (!file || !uploaderName.trim()) {
      setMessage("Please provide uploader name and select a CSV/Excel file.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("uploader_name", uploaderName.trim());
      fd.append("document", file);
      const resp = await apiClient.uploadFile("/data-uploads/preview", fd);
      setPreview(resp.preview);
      setMeta(resp.meta);
      setMessage("Preview generated. Review and click Save.");
    } catch (err) {
      setMessage(err.message || "Failed to generate preview");
    }
  };

  const handleSave = async () => {
    if (!preview || !meta) {
      setMessage("Generate a preview first.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        uploader_name: meta.uploader_name || uploaderName.trim(),
        original_filename: meta.original_filename || (file && file.name) || "",
        stored_filename: meta.stored_filename || "",
        documents: {
          columns: preview.columns,
          rows: preview.rows,
        },
      };
      const resp = await apiClient.post("/data-uploads/save", payload);
      setMessage("Saved successfully.");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setSaving(false);
    } catch (err) {
      setSaving(false);
      setMessage(err.message || "Save failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Upload Extra Curricular Activity
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Upload CSV or Excel of extracurricular activities. Preview first, then
        save.
      </p>

      {message && (
        <div className="mb-4 rounded border px-3 py-2 text-sm dark:border-slate-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handlePreview}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Uploader Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Data File (CSV/Excel) <span className="text-red-600">*</span>
          </label>
          <input
            type="file"
            accept=".csv, .xlsx"
            onChange={(e) =>
              setFile((e.target.files && e.target.files[0]) || null)
            }
            className="block w-full text-sm"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accepted: .csv, .xlsx. We preview the first 10 rows.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
            Generate Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!preview || saving}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {preview && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-auto">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Preview — Total rows: {preview.totalRows}
          </h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {preview.columns.map((c) => (
                  <th
                    key={c}
                    className="border-b px-2 py-1 text-left dark:border-slate-700"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, idx) => (
                <tr key={idx}>
                  {preview.columns.map((c) => (
                    <td
                      key={c}
                      className="border-b px-2 py-1 dark:border-slate-800"
                    >
                      {String(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-green-500/30 p-6 text-center">
            <div className="relative mx-auto h-16 w-16">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
              <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M20 6l-11 11-5-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold text-green-700 dark:text-green-400">
              Saved successfully
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your data has been saved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
