import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import CustomSelect from "../../components/ui/CustomSelect";
import { FaCloudUploadAlt, FaArrowLeft, FaEye, FaCheck } from "react-icons/fa";

export default function AdminUploadExtracurricular() {
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
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/admin/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Admin Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 shadow-xs flex-shrink-0">
            <FaCloudUploadAlt className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Other Data Upload
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload CSV or Excel data for achievements, projects, research, consultancy, or participations.
            </p>
          </div>
        </div>

        <SuccessModal
          open={showSuccess}
          title="Data Saved Successfully"
          subtitle="Your dataset records have been imported and saved into the system."
          onClose={() => setShowSuccess(false)}
        />

        {message && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs font-bold text-sky-900 shadow-xs">
            {message}
          </div>
        )}

        <form
          onSubmit={handlePreview}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Data Category <span className="text-sky-600">*</span>
              </label>
              <CustomSelect
                value={dataType}
                onChange={(value) => setDataType(value)}
                options={[
                  { value: "achievements", label: "Achievement" },
                  { value: "projects", label: "Projects" },
                  { value: "faculty_research", label: "Faculty Research" },
                  { value: "faculty_consultancy", label: "Faculty Consultancy" },
                  {
                    value: "faculty_participations",
                    label: "Faculty Participation",
                  },
                ]}
                placeholder="Select dataset category"
                required
                name="data_category"
              />
              {dataType && REQUIRED_HEADERS[dataType] && (
                <div className="mt-2 text-[11px] text-slate-500 font-semibold">
                  Required headers:{" "}
                  {REQUIRED_HEADERS[dataType]
                    .map((g) => g[0].replace(/_/g, " "))
                    .join(", ")}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Uploader Name <span className="text-sky-600">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600 shadow-xs"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="e.g. Admin / Coordinator Name"
                required
              />
            </div>
          </div>

          <div>
            <UploadDropzone
              label="Upload CSV or Excel File"
              subtitle="Only .csv or .xlsx files allowed (Max 25MB)"
              accept=".csv,.xlsx"
              maxSizeMB={25}
              selectedFile={file}
              onFileSelected={(f) => setFile(f)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-5 py-2 text-xs font-extrabold text-sky-700 hover:bg-sky-100 transition cursor-pointer"
            >
              <FaEye className="w-3 h-3" />
              Generate Preview
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!preview || saving || headerErrors.length > 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-6 py-2 text-xs font-extrabold text-white shadow-md shadow-sky-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              <FaCheck className="w-3 h-3" />
              {saving ? "Saving..." : "Save Data"}
            </button>
          </div>
        </form>

        {preview && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 w-full">
            {headerErrors.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-extrabold text-rose-800">
                Missing required headers: {headerErrors.join(", ")}
              </div>
            )}
            <h2 className="text-xs font-extrabold text-slate-900">
              Preview — Total Rows: {preview.totalRows}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c} className="px-3 py-2.5 whitespace-nowrap border-b border-slate-200">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {preview.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sky-50/30 transition-colors">
                      {preview.columns.map((c) => (
                        <td key={c} className="px-3 py-2 whitespace-nowrap text-slate-800">
                          {String(row[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
