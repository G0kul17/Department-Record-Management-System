import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FaFileExport, FaArrowLeft, FaDownload, FaInfoCircle, FaFileExcel } from "react-icons/fa";

export default function BulkExportPage({ isAdminView = false }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminView || user?.role === "admin";
  const backTarget = isAdmin ? "/admin/quick-actions" : "/quick-actions";
  const backText = isAdmin ? "Back to Admin Quick Actions" : "Back to Quick Actions";

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
          import.meta.env.VITE_API_BASE_URL) ||
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav(backTarget)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            {backText}
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 shadow-sm flex-shrink-0">
            <FaFileExport className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bulk Data Export
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Download a complete backup of all department records in a multi-sheet Excel file.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Info Banner */}
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-800 font-extrabold text-sm">
              <FaInfoCircle className="w-4 h-4 text-cyan-600" />
              What's included in the bulk export package?
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-cyan-900 pt-1">
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                All user accounts & profiles
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                All student projects (approved & pending)
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                All achievements & certificates
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Faculty participation & FDP records
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Faculty research & grants
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Faculty consultancy engagements
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Department events & hackathons
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-2.5 border border-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Staff uploaded data records
              </div>
            </div>
          </div>

          {/* Export Specifications */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Export Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 font-bold">File Format</div>
                <div className="text-slate-900 font-extrabold text-sm mt-0.5 flex items-center gap-1.5">
                  <FaFileExcel className="text-emerald-600 w-4 h-4" />
                  Excel (.xlsx)
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 font-bold">Multiple Sheets</div>
                <div className="text-slate-900 font-extrabold text-sm mt-0.5">
                  7-8 Categorized Worksheets
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 font-bold">Data Scope</div>
                <div className="text-slate-900 font-extrabold text-sm mt-0.5">
                  Complete Department Database
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-sm">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleBulkExport}
              disabled={loading}
              className="inline-flex items-center gap-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              <FaDownload className="w-4 h-4" />
              {loading ? "Generating Full Export..." : "Download Complete Bulk Export (.xlsx)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
