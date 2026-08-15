import React from "react";
import { useNavigate } from "react-router-dom";
import ProjectsManagement from "./ProjectsManagement";
import { FaFolderOpen, FaArrowLeft } from "react-icons/fa";

export default function VerifyProjects() {
  const nav = useNavigate();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3 text-slate-600" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-xs flex-shrink-0">
            <FaFolderOpen className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Verify Projects
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Approve or reject student project submissions and verify source code/links.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-sm w-full">
          <ProjectsManagement />
        </div>
      </div>
    </div>
  );
}
