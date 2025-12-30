import React, { useState } from "react";
import BackButton from "../../components/BackButton";
import UploadDropzone from "../../components/ui/UploadDropzone";
import apiClient from "../../api/axiosClient";
import { generateStudentsPreview } from "../../utils/studentsBatchPreview";

export default function AdminStudentsBatchUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Admin: Add Students Batch
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Upload a single CSV or Excel file containing student records.
      </p>

      {message && (
        <div className="mb-4 rounded border px-3 py-2 text-sm dark:border-slate-700">
          {message}
        </div>
      )}

      <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-4">
        <UploadDropzone
          label="Upload CSV or Excel"
          subtitle="Only .csv or .xlsx files are allowed"
          accept=".csv,.xlsx"
          maxSizeMB={25}
          selectedFile={file}
          onFileSelected={(f) => setFile(f)}
        />
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Required columns (exact header names):
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            <li>First name</li>
            <li>Last name</li>
            <li>College mail</li>
            <li>Register number</li>
            <li>Contact number</li>
            <li>Year</li>
            <li>Dept</li>
            <li>Course</li>
            <li>Section</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="rounded-md bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 ring-1 ring-inset ring-sky-300 hover:bg-sky-200 disabled:opacity-50"
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
              } catch (e) {
                setMessage(e.message || "Upload failed");
              } finally {
                setSubmitting(false);
              }
            }}
            className="rounded-md bg-[#87CEEB] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Upload Students"}
          </button>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const headers = [
                [
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
            className="text-xs font-semibold text-sky-700 hover:underline"
          >
            Download sample CSV
          </a>
        </div>
        {result && (
          <div className="text-xs text-slate-700 dark:text-slate-200">
            <div>Created: {result.created ?? 0}</div>
            {Array.isArray(result.skipped) && result.skipped.length > 0 && (
              <div className="mt-1">Skipped: {result.skipped.length}</div>
            )}
          </div>
        )}

        {preview && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Preview</h3>
            {preview.headerErrors && preview.headerErrors.length > 0 && (
              <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {preview.headerErrors.join("; ")}
              </div>
            )}
            <div className="overflow-auto rounded border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold text-slate-700"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.items.slice(0, 50).map((row, idx) => {
                    const issue = preview.rowIssues.find(
                      (r) => r.index === idx
                    );
                    const errs = issue?.errors || {};
                    return (
                      <tr key={idx} className="odd:bg-white even:bg-slate-50">
                        {preview.headers.map((h) => (
                          <td
                            key={h}
                            className={`px-3 py-1 whitespace-nowrap ${
                              errs[h]
                                ? "bg-red-50 text-red-700"
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
            <div className="mt-2 text-xs text-slate-600">
              Showing first {Math.min(50, preview.items.length)} of{" "}
              {preview.items.length} rows. {preview.rowIssues.length} row(s)
              with issues.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
