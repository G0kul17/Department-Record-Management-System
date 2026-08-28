import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../api/axiosClient";
import { calculateDuration } from "../utils/duration";
import {
  FaTrophy,
  FaFlask,
  FaChalkboardTeacher,
  FaBriefcase,
  FaCheckCircle,
  FaDownload,
  FaCopy,
  FaFileAlt,
  FaExclamationCircle,
  FaSpinner,
  FaCalendarAlt
} from "react-icons/fa";

export default function PublicRecordViewer() {
  const { type, id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchRecord = async () => {
      try {
        setLoading(true);
        // Note: this must point to the new public endpoint we created
        const res = await apiClient.get(`/public/records/${type}/${id}`);
        if (!mounted) return;
        setRecord(res?.data || res);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError("This record could not be found or is not public.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRecord();
    return () => (mounted = false);
  }, [type, id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-600 font-bold">Loading public record...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
          <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">Record Not Found</h2>
          <p className="text-sm font-medium text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  // --- UI Config based on type ---
  let icon, colorClass, bgClass, typeLabel, mainTitle, subTitle;
  
  if (type === "research") {
    icon = <FaFlask className="w-6 h-6" />;
    colorClass = "text-orange-600";
    bgClass = "bg-orange-100";
    typeLabel = "Faculty Research";
    mainTitle = record.title || "Untitled Research";
    subTitle = record.faculty_name || record.principal_investigator;
  } else if (type === "participation") {
    icon = <FaChalkboardTeacher className="w-6 h-6" />;
    colorClass = "text-purple-600";
    bgClass = "bg-purple-100";
    typeLabel = "Faculty Participation";
    mainTitle = record.title || "Untitled Program";
    subTitle = record.faculty_name;
  } else if (type === "consultancy") {
    icon = <FaBriefcase className="w-6 h-6" />;
    colorClass = "text-cyan-600";
    bgClass = "bg-cyan-100";
    typeLabel = "Consultancy Project";
    mainTitle = record.agency || "Corporate Consultancy";
    subTitle = record.faculty_name;
  } else if (type === "achievement") {
    icon = <FaTrophy className="w-6 h-6" />;
    colorClass = "text-amber-600";
    bgClass = "bg-amber-100";
    typeLabel = "Verified Achievement";
    mainTitle = record.title || "Student Achievement";
    subTitle = record.user_fullname || record.user_email || record.name;
  }

  // File Preview Logic
  const filename = record.proof_filename || record.certificate_filename || record.event_photo_filename;
  // Use relative path so Vite proxy handles it and browser sees it as same-origin
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
  const publicApiUrl = filename ? `${API_BASE_URL}/public/files/${filename}` : null;
  const downloadUrl = publicApiUrl ? `${publicApiUrl}?download=true` : null;
  const isImage = filename && /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  const isPdf = filename && /\.pdf$/i.test(filename);
  const isPreviewable = isImage || isPdf;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap gap-4 items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${bgClass} ${colorClass}`}>
            {icon}
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {typeLabel}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                <FaCheckCircle className="w-3 h-3 mr-1" />
                Verified
              </span>
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Public Record Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-colors border shadow-sm cursor-pointer ${
              copied
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {copied ? <FaCheckCircle className="w-4 h-4 text-emerald-500" /> : <FaCopy className="w-4 h-4" />}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>
          <a
            href="/login"
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            <span>Login</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Record Details Card */}
        <div className={`bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 relative overflow-hidden`}>
          {/* Decorative background blur */}
          <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 ${bgClass}`} />
          
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {mainTitle}
              </h2>
              {subTitle && (
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  {subTitle}
                </p>
              )}
            </div>

            {/* Dynamic Metadata Grid based on type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {type === "research" && (
                <>
                  {record.funded_type && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Funded Type</span>
                      <p className="text-sm font-bold text-slate-800">{record.funded_type}</p>
                    </div>
                  )}
                  {record.agency && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Funding Agency</span>
                      <p className="text-sm font-bold text-slate-800">{record.agency}</p>
                    </div>
                  )}
                  {record.amount && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Grant Amount</span>
                      <p className="text-sm font-bold text-slate-800">₹{Number(record.amount).toLocaleString()}</p>
                    </div>
                  )}
                  {(record.duration || (record.start_date && record.end_date)) && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Duration</span>
                      <p className="text-sm font-bold text-slate-800">{record.duration || calculateDuration(record.start_date, record.end_date)}</p>
                    </div>
                  )}
                </>
              )}
              
              {type === "participation" && (
                <>
                  {record.type_of_event && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Event Type</span>
                      <p className="text-sm font-bold text-slate-800">{record.type_of_event}</p>
                    </div>
                  )}
                  {record.mode_of_training && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Mode</span>
                      <p className="text-sm font-bold text-slate-800">{record.mode_of_training}</p>
                    </div>
                  )}
                  {record.start_date && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                        <FaCalendarAlt className="w-2.5 h-2.5 text-blue-500" /> Date
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(record.start_date).toLocaleDateString()} {record.end_date && `- ${new Date(record.end_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}
                  {(record.duration || (record.start_date && record.end_date)) && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Duration</span>
                      <p className="text-sm font-bold text-slate-800">{record.duration || calculateDuration(record.start_date, record.end_date)}</p>
                    </div>
                  )}
                  {record.conducted_by && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Conducted By</span>
                      <p className="text-sm font-bold text-slate-800">{record.conducted_by}</p>
                    </div>
                  )}
                </>
              )}

              {type === "consultancy" && (
                <>
                  {record.team_members && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Team Members</span>
                      <p className="text-sm font-bold text-slate-800">{record.team_members}</p>
                    </div>
                  )}
                  {record.amount && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Amount Received</span>
                      <p className="text-sm font-bold text-slate-800">₹{Number(record.amount).toLocaleString()}</p>
                    </div>
                  )}
                  {(record.duration || (record.start_date && record.end_date)) && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Duration</span>
                      <p className="text-sm font-bold text-slate-800">{record.duration || calculateDuration(record.start_date, record.end_date)}</p>
                    </div>
                  )}
                </>
              )}

              {type === "achievement" && (
                <>
                  {record.category && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Category</span>
                      <p className="text-sm font-bold text-slate-800">{record.category}</p>
                    </div>
                  )}
                  {record.date && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                        <FaCalendarAlt className="w-2.5 h-2.5 text-blue-500" /> Date
                      </span>
                      <p className="text-sm font-bold text-slate-800">{new Date(record.date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {record.team_members && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Team Members</span>
                      <p className="text-sm font-bold text-slate-800">{Array.isArray(record.team_members) ? record.team_members.join(", ") : record.team_members}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {(record.details || record.description) && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-2">Description</span>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  {record.details || record.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Proof Document Section */}
        {filename ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200/90 overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FaFileAlt className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-extrabold text-slate-800">Proof Document</h3>
              </div>
              <a
                href={downloadUrl}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-extrabold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FaDownload className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>

            {isPreviewable ? (
              isImage ? (
                <div className="flex-1 flex items-center justify-center p-4 bg-slate-100 overflow-auto">
                  <img
                    src={publicApiUrl}
                    alt={filename}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    onError={() => setPreviewError(true)}
                  />
                  {previewError && (
                    <div className="text-center text-slate-500 flex flex-col items-center">
                      <FaExclamationCircle className="w-10 h-10 mb-2 text-red-400" />
                      <p className="text-sm font-bold">Failed to load image preview.</p>
                    </div>
                  )}
                </div>
              ) : (
                <iframe
                  src={publicApiUrl}
                  className="w-full h-full border-0 bg-slate-100"
                  title={filename}
                  onError={() => setPreviewError(true)}
                />
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                <FaFileAlt className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-lg font-extrabold text-slate-800 mb-1">
                  Preview Not Available
                </h2>
                <p className="text-xs font-medium text-slate-500 mb-6 max-w-sm">
                  This file type cannot be previewed in the browser. Please download the file to view its contents.
                </p>
                <a
                  href={downloadUrl}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-extrabold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                >
                  <FaDownload className="w-4 h-4" />
                  <span>Download File</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-sm">
            <FaFileAlt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-slate-800">No Proof Document</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">
              There is no proof document attached to this public record.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
