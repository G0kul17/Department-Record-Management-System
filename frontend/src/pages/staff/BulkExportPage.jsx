import React, { useState } from "react";
import BackButton from "../../components/BackButton";

export default function BulkExportPage({ isAdminView = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBulkExport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the token for authentication
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        (typeof import.meta !== "undefined" &&
          import.meta.env &&
          import.meta.env.VITE_API_BASE) ||
        "http://localhost:5000/api";

      // Call the backend bulk export endpoint with fetch to handle blob
      const response = await fetch(`${API_BASE_URL}/bulk-export`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to parse error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to export data");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link for the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Set filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `department_backup_${timestamp}.xlsx`);

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bulk export failed:", err);
      setError(err.message || "Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <BackButton />

        <div className="mt-6 rounded-xl bg-white p-8 shadow-lg dark:bg-slate-900">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Bulk Data Export
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Download a complete backup of all department records in a single
              Excel file
            </p>
          </div>

          {/* Info Card */}
          <div className="alert alert-info mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold">
                  What's included in the export?
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• All user accounts and profiles</li>
                  <li>• All projects (approved and pending)</li>
                  <li>• All achievements (approved and pending)</li>
                  <li>• Faculty participation records</li>
                  <li>• Faculty research details</li>
                  <li>• Faculty consultancy engagements</li>
                  <li>• Department events</li>
                  <li>• Staff uploaded documents (if available)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Export Details */}
          <div className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">
              Export Details
            </h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Format:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Excel (.xlsx)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Multiple Sheets:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Yes (7-8 sheets)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Data Scope:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  All records
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-center">
            <button
              onClick={handleBulkExport}
              disabled={loading}
              className="inline-flex items-center gap-3 rounded-lg bg-[#87CEEB] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[#7dc0df] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Complete Export
                </>
              )}
            </button>
          </div>

          {/* Usage Notes */}
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-300">
              Usage Notes
            </h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>
                • The exported file can be opened in Microsoft Excel, Google
                Sheets, or LibreOffice
              </li>
              <li>
                • Each table is exported as a separate sheet within the Excel
                file
              </li>
              <li>
                • This export is useful for creating backups or performing
                offline analysis
              </li>
              <li>
                • File name includes the current date for easy version tracking
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
