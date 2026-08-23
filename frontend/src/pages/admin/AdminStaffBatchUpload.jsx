import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadDropzone from "../../components/ui/UploadDropzone";
import apiClient from "../../api/axiosClient";
import { generateStaffPreview } from "../../utils/staffBatchPreview";
import SuccessModal from "../../components/ui/SuccessModal";
import { FaUserTie, FaArrowLeft, FaFileDownload, FaCloudUploadAlt, FaEye } from "react-icons/fa";

export default function AdminStaffBatchUpload() {
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

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
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shadow-xs flex-shrink-0">
            <FaUserTie className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Staff Batch Upload
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload a single CSV file to register faculty and staff members in bulk.
            </p>
          </div>
        </div>

        <SuccessModal
          open={showSuccess}
          title="Staff Batch Uploaded"
          subtitle={
            result
              ? `Created: ${result.created ?? 0}${
                  Array.isArray(result.skipped)
                    ? ` | Skipped: ${result.skipped.length}`
                    : ""
                }`
              : "Staff uploaded successfully."
          }
          onClose={() => setShowSuccess(false)}
        />

        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-bold text-blue-900 shadow-xs">
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5 w-full">
          <UploadDropzone
            label="Upload Staff CSV File"
            subtitle="Only .csv files are allowed (Max size 25MB)"
            accept=".csv"
            maxSizeMB={25}
            selectedFile={file}
            onFileSelected={(f) => setFile(f)}
          />

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
            <span className="font-extrabold text-slate-800">
              Required Header Columns (Exact Names):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 font-medium">
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">Full name</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">First name</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">Last name</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">College mail</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">Employee ID</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">Contact number</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">Dept</span>
              <span className="bg-white border rounded-lg px-2.5 py-1 text-[11px] font-bold">Designation</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const headers = [
                  [
                    "Full name",
                    "First name",
                    "Last name",
                    "College mail",
                    "Employee ID",
                    "Contact number",
                    "Dept",
                    "Designation",
                  ],
                ];
                const csv = headers.map((r) => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "staff-batch-template.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-violet-600 hover:underline"
            >
              <FaFileDownload className="w-3 h-3" />
              Download Sample CSV Template
            </a>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={!file || previewing}
                onClick={async () => {
                  if (!file) return;
                  setPreview(null);
                  setResult(null);
                  setValidationErrors([]);
                  setMessage("");
                  setPreviewing(true);
                  try {
                    const p = await generateStaffPreview(file);
                    setPreview(p);
                    if (p.headerErrors.length) {
                      setMessage(p.headerErrors.join("; "));
                    } else {
                      const errCount = p.rowIssues.length;
                      setMessage(
                        errCount
                          ? `${errCount} row(s) have issues. Please review highlighted cells before submitting.`
                          : "Preview generated. No issues found."
                      );
                    }
                  } catch (e) {
                    setMessage(e.message || "Failed to generate preview");
                  } finally {
                    setPreviewing(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-xs font-extrabold text-violet-700 hover:bg-violet-100 transition cursor-pointer disabled:opacity-50"
              >
                <FaEye className="w-3 h-3" />
                {previewing ? "Generating..." : "Generate Preview"}
              </button>

              <button
                disabled={
                  !file ||
                  !preview ||
                  submitting ||
                  (preview?.headerErrors?.length ?? 0) > 0 ||
                  (preview?.rowIssues?.length ?? 0) > 0
                }
                onClick={async () => {
                  if (!file) return;
                  setSubmitting(true);
                  setMessage("");
                  setResult(null);
                  setValidationErrors([]);
                  try {
                    const fd = new FormData();
                    fd.append("staff_file", file);
                    const resp = await apiClient.uploadFile("/staff-batch/upload", fd);
                    setResult(resp);
                    if ((resp.created ?? 0) > 0) {
                      setShowSuccess(true);
                      setMessage("");
                    } else {
                      setMessage(
                        `All ${Array.isArray(resp.skipped) ? resp.skipped.length : 0} staff member(s) were skipped — their emails are already registered in the system.`
                      );
                    }
                  } catch (e) {
                    setMessage(e.message || "Upload failed");
                    const backendErrors = Array.isArray(e?.validationErrors)
                      ? e.validationErrors
                      : Array.isArray(e?.responseData?.errors)
                        ? e.responseData.errors
                        : [];
                    setValidationErrors(backendErrors);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-2 text-xs font-extrabold text-white shadow-md shadow-violet-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <FaCloudUploadAlt className="w-3.5 h-3.5" />
                {submitting ? "Uploading..." : "Upload Staff Batch"}
              </button>
            </div>
          </div>

          {(preview?.rowIssues?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-extrabold text-amber-800">
              Fix preview issues before uploading. Upload is blocked while invalid rows exist.
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-1">
              <div className="font-extrabold text-rose-900">Validation Details</div>
              <ul className="list-disc pl-5 space-y-0.5 font-medium">
                {validationErrors.slice(0, 20).map((err, idx) => (
                  <li key={`${err.row || "r"}-${idx}`}>
                    Row {err.row || "?"}: {err.message || "Invalid data"}
                    {Array.isArray(err.missingFields) && err.missingFields.length > 0
                      ? ` (${err.missingFields.join(", ")})`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Data Preview</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h} className="px-3 py-2.5 whitespace-nowrap border-b border-slate-200">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {preview.items.slice(0, 50).map((row, idx) => {
                      const issue = preview.rowIssues.find((r) => r.index === idx);
                      const errs = issue?.errors || {};
                      return (
                        <tr key={idx} className="hover:bg-violet-50/30 transition-colors">
                          {preview.headers.map((h) => (
                            <td
                              key={h}
                              className={`px-3 py-2 whitespace-nowrap ${
                                errs[h] ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-800"
                              }`}
                              title={errs[h] || ""}
                            >
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
