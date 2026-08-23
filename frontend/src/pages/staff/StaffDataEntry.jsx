import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import CustomSelect from "../../components/ui/CustomSelect";
import { FaCloudUploadAlt, FaArrowLeft } from "react-icons/fa";
import RecordLoader from "../../components/ui/RecordLoader";

export default function UploadExtracurricular() {
  const nav = useNavigate();
  const [uploaderName, setUploaderName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [dataType, setDataType] = useState("");
  const [headerErrors, setHeaderErrors] = useState([]);

  const normalizeKey = (key) =>
    String(key || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[_\-]+/g, "_");

  const REQUIRED_HEADERS = {
    achievements: [["user_email", "email"], ["title"]],
    projects: [["title", "project_title"]],
    faculty_consultancy: [["agency"]],
    faculty_research: [
      ["funded_type"],
      ["principal_investigator", "pi"],
      ["title", "project_title"],
      ["current_status", "status"],
    ],
    faculty_participations: [
      ["faculty_name"],
      ["department", "dept"],
      ["type_of_event", "event_type"],
      ["mode_of_training", "mode"],
      ["title", "event_title"],
      ["start_date"],
    ],
  };

  const validateHeadersForType = (columns, type) => {
    const set = new Set(columns.map((c) => normalizeKey(c)));
    const requirements = REQUIRED_HEADERS[type];
    if (!requirements) return [];
    const missing = [];
    for (const group of requirements) {
      const hasAny = group.some((k) => set.has(k));
      if (!hasAny) missing.push(group[0]);
    }
    return missing;
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    setMessage("");
    setPreview(null);
    setMeta(null);
    setHeaderErrors([]);
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
      const missing = dataType
        ? validateHeadersForType(resp.preview.columns || [], dataType)
        : [];
      setHeaderErrors(missing);
      setMessage(
        missing.length
          ? `Missing required headers for ${dataType.replace(
              "_",
              " "
            )}: ${missing.join(", ")}`
          : "Preview generated. Review and click Save."
      );
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
        data_type: dataType || undefined,
      };
      const resp = await apiClient.post("/data-uploads/save", payload);
      setMessage(resp?.message || "Saved successfully.");
      setShowSuccess(true);
      setSaving(false);
    } catch (err) {
      setSaving(false);
      setMessage(err.message || "Save failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      {saving && <RecordLoader text="Processing Batch Data Upload..." fullScreen={true} />}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm flex-shrink-0">
            <FaCloudUploadAlt className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Other Data Upload
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Upload CSV or Excel files of activities, preview records, and save to department database.
            </p>
          </div>
        </div>

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
            Data Category <span className="text-red-600">*</span>
          </label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            required
          >
            <option value="" disabled>
              Select category
            </option>
            <option value="achievements">Achievement</option>
            <option value="faculty_consultancy">Faculty Consultancy</option>
            <option value="faculty_participations">
              Faculty Participation
            </option>
            <option value="faculty_research">Faculty Research</option>
            <option value="projects">Projects</option>
          </select>
          {dataType && (
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
              Required headers:{" "}
              {REQUIRED_HEADERS[dataType]
                .map((g) => g[0].replace(/_/g, " "))
                .join(", ")}
            </div>
          )}
        </div>
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
          <UploadDropzone
            label="Upload and attach files"
            subtitle="Attachments will be a part of this project."
            accept=".csv,.xlsx"
            maxSizeMB={25}
            selectedFile={file}
            onFileSelected={(f) => setFile(f)}
          />
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-[#87CEEB] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90">
            Generate Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!preview || saving || headerErrors.length > 0}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {preview && (
        <div className="mt-6 glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-auto">
          {headerErrors.length > 0 && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              Missing required headers: {headerErrors.join(", ")}
            </div>
          )}
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
    </div>
  );
}
