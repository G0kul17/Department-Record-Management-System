import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadDropzone from "../../components/ui/UploadDropzone";
import SuccessModal from "../../components/ui/SuccessModal";
import apiClient from "../../api/axiosClient";
import { generateStudentsPreview } from "../../utils/studentsBatchPreview";
import { FaUserPlus, FaArrowLeft, FaFileDownload, FaCloudUploadAlt } from "react-icons/fa";

export default function StudentsBatchUpload() {
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaUserPlus className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Add Students Batch
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Upload CSV spreadsheets to import student records in bulk.
            </p>
          </div>
        </div>

        <SuccessModal
          open={showSuccess}
          title="Saved successfully"
          subtitle={
            result
              ? `Students uploaded. Created: ${result.created ?? 0}${
                  Array.isArray(result.skipped)
                    ? ` | Skipped: ${result.skipped.length}`
                    : ""
                }`
              : "Students uploaded successfully."
          }
          onClose={() => setShowSuccess(false)}
        />

        {message && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold text-blue-800 shadow-sm">
            {message}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <UploadDropzone
            label="Upload CSV File"
            subtitle="Only .csv files are allowed"
            accept=".csv"
            maxSizeMB={25}
            selectedFile={file}
            onFileSelected={(f) => setFile(f)}
          />

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600 font-semibold space-y-2">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider block">
              Required Columns (Exact Header Names):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-bold text-slate-700">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Full name</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">First name</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Last name</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">College mail</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Register number</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Contact number</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Year</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Dept</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Course</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Section</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!file || previewing}
              onClick={async () => {
                if (!file) return;
                setPreview(null);
                setResult(null);
                setMessage("");
                setPreviewing(true);
                try {
                  const p = await generateStudentsPreview(file);
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
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-5 py-2.5 text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {previewing ? "Generating..." : "Generate Preview"}
            </button>

            <button
              disabled={
                !file ||
                !preview ||
                submitting ||
                (preview?.headerErrors?.length ?? 0) > 0
              }
              onClick={async () => {
                if (!file) return;
                setSubmitting(true);
                setMessage("");
                setResult(null);
                try {
                  const fd = new FormData();
                  fd.append("students_file", file);
                  const resp = await apiClient.uploadFile("/students/upload", fd);
                  setResult(resp);
                  setMessage(resp.message || "Upload complete");
                  setShowSuccess(true);
                } catch (e) {
                  setMessage(e.message || "Upload failed");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              <FaCloudUploadAlt className="w-4 h-4" />
              {submitting ? "Uploading..." : "Upload Students"}
            </button>

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
                    "Register number",
                    "Contact number",
                    "Year",
                    "Dept",
                    "Course",
                    "Section",
                  ],
                ];
                const csv = headers.map((r) => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "students-batch-template.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline ml-auto"
            >
              <FaFileDownload className="w-3.5 h-3.5" />
              Download Sample CSV Template
            </a>
          </div>

          {preview && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">Preview Data</h3>
              {preview.headerErrors && preview.headerErrors.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {preview.headerErrors.join("; ")}
                </div>
              )}
              <div className="overflow-auto rounded-2xl border border-slate-200 max-h-72">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      {preview.headers.map((h) => (
                        <th
                          key={h}
                          className="px-3.5 py-2.5 text-left font-extrabold text-slate-700 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.items.slice(0, 50).map((row, idx) => {
                      const issue = preview.rowIssues.find(
                        (r) => r.index === idx
                      );
                      const errs = issue?.errors || {};
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          {preview.headers.map((h) => (
                            <td
                              key={h}
                              className={`px-3.5 py-2 whitespace-nowrap font-medium ${
                                errs[h]
                                  ? "bg-rose-50 text-rose-700 font-bold"
                                  : "text-slate-700"
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
