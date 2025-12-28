import React, { useState } from "react";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";

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
      setSaving(false);
    } catch (err) {
      setSaving(false);
      setMessage(err.message || "Save failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Staff Data Entry
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Upload CSV or Excel. Preview first, then save.
      </p>

      {message && (
        <div className="mb-4 rounded border px-3 py-2 text-sm dark:border-slate-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handlePreview}
        className="space-y-4 glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
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
          <button className="rounded-md bg-[#87CEEB] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90">
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
        <div className="mt-6 glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-auto">
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

      <SuccessModal
        open={showSuccess}
        title="Saved successfully"
        subtitle="Your data has been saved."
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
