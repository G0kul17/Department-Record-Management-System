import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/axiosClient";
import exportToXlsxOrCsv from "../../utils/exportData";
import {
  FaFileExport,
  FaArrowLeft,
  FaDownload,
  FaFilter,
  FaCheck,
  FaTimes,
  FaTable,
  FaSync,
  FaTrophy,
  FaRocket,
  FaGraduationCap,
  FaFlask,
  FaBriefcase,
  FaBolt,
  FaFileExcel,
  FaFileCsv,
  FaCalendarAlt,
  FaSearch,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { calculateDuration } from "../../utils/duration";

const ACHIEVEMENT_TITLE_OPTIONS = [
  "Hackathon",
  "Paper presentation",
  "Coding competition",
  "Conference presentation",
  "Journal publications",
  "NPTEL certificate",
  "Internship certificate",
  "Other MOOC courses",
];

const FACULTY_PARTICIPATION_EVENT_TYPE_OPTIONS = [
  "Certification",
  "Conference Presentation",
  "Conference Publications",
  "FDP",
  "Hackathon",
  "Industrial Training",
  "Journal Publications",
  "NPTEL - FDP",
  "NPTEL Certification",
  "Professional Development Course",
  "Resource Person",
  "Reviewer",
  "Seminar",
  "STTP",
  "Webinar",
  "Workshop",
];

function CustomDropdown({ value, onChange, options, placeholder = "All" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || value || placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-left text-xs font-semibold text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-xs flex items-center justify-between cursor-pointer"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg z-30 py-1">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full px-3.5 py-2 text-left text-xs font-medium cursor-pointer ${
              value === "" ? "bg-cyan-50 text-cyan-700 font-bold" : "hover:bg-slate-50 text-slate-700"
            }`}
          >
            {placeholder}
          </button>
          {[...options].sort((a, b) => {
            const isCustomA = a.value === "__custom__" || String(a.label || a.value).toLowerCase() === "other" || String(a.label || a.value).toLowerCase() === "others";
            const isCustomB = b.value === "__custom__" || String(b.label || b.value).toLowerCase() === "other" || String(b.label || b.value).toLowerCase() === "others";
            if (isCustomA && !isCustomB) return 1;
            if (!isCustomA && isCustomB) return -1;

            const labelA = String(a.label !== undefined ? a.label : a.value);
            const labelB = String(b.label !== undefined ? b.label : b.value);
            return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: "base" });
          }).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3.5 py-2 text-left text-xs font-medium cursor-pointer ${
                value === opt.value ? "bg-cyan-50 text-cyan-700 font-bold" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportGenerator() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const backTarget = isAdmin ? "/admin/quick-actions" : "/quick-actions";
  const backText = isAdmin ? "Back to Admin Quick Actions" : "Back to Quick Actions";
  const [mode, setMode] = useState("achievements"); // achievements | projects | participation | research | consultancy | hackathons
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx"); // xlsx | csv

  // filters
  const [issuer, setIssuer] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [student, setStudent] = useState("");
  const [verified, setVerified] = useState("");
  const [userType, setUserType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");

  const [previewRows, setPreviewRows] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        let endpoint = "/achievements?limit=2000";
        if (mode === "projects") endpoint = "/projects?limit=2000";
        if (mode === "participation") endpoint = "/faculty-participations?limit=2000";
        if (mode === "research") endpoint = "/faculty-research?limit=2000";
        if (mode === "consultancy") endpoint = "/faculty-consultancy?limit=2000";
        if (mode === "hackathons") endpoint = "/hackathons?limit=2000";

        const data = await apiClient.get(endpoint);
        if (!mounted) return;
        if (mode === "achievements") setItems(data.achievements || []);
        else if (mode === "projects") setItems(data.projects || []);
        else if (mode === "participation")
          setItems(data.participation || data.participations || data.facultyParticipation || data.items || []);
        else if (mode === "research")
          setItems(data.data || data.research || data.facultyResearch || data.items || []);
        else if (mode === "consultancy")
          setItems(data.data || data.consultancies || data.facultyConsultancy || data.items || []);
        else if (mode === "hackathons")
          setItems(data.hackathons || data.items || data.data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [mode]);

  useEffect(() => {
    setTitleFilter("");
    setIssuer("");
    setUserType("");
    setVerified("");
    setFromDate("");
    setToDate("");
    setQuery("");
    setShowPreview(false);
  }, [mode]);

  const datasetHub = [
    { key: "achievements", title: "Achievements", icon: FaTrophy, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" },
    { key: "projects", title: "Projects", icon: FaRocket, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" },
    { key: "participation", title: "Faculty Participation", icon: FaGraduationCap, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" },
    { key: "research", title: "Faculty Research", icon: FaFlask, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" },
    { key: "consultancy", title: "Faculty Consultancy", icon: FaBriefcase, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" },
    { key: "hackathons", title: "Hackathons", icon: FaBolt, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25" },
  ];

  const titleOptions = useMemo(() => {
    if (mode === "achievements") return ACHIEVEMENT_TITLE_OPTIONS;
    if (mode === "participation") return FACULTY_PARTICIPATION_EVENT_TYPE_OPTIONS;
    return [];
  }, [mode]);

  const userTypeOptions = useMemo(
    () => [
      { value: "student", label: "Student" },
      { value: "staff", label: "Staff" },
    ],
    []
  );

  const verifiedOptions = useMemo(
    () => [
      { value: "true", label: "Verified Only" },
      { value: "false", label: "Unverified / Pending" },
    ],
    []
  );

  const applyFilters = (list) => {
    return list.filter((it) => {
      if (titleFilter) {
        if (mode === "achievements" && (it.title || "") !== titleFilter) return false;
        if (
          mode === "participation" &&
          (it.type_of_event || it.event_type || "") !== titleFilter
        )
          return false;
      }
      if (issuer && (it.issuer || it.issuer_name) !== issuer) return false;
      if (userType) {
        const isStaff = Boolean(it.faculty_name);
        if (userType === "staff" && !isStaff) return false;
        if (userType === "student" && isStaff) return false;
      }
      if (verified !== "") {
        const status = (it.verification_status || "").toLowerCase();
        const isApproved = status === "approved" || Boolean(it.verified);
        if (verified === "true") {
          if (!isApproved || status === "pending") return false;
        } else if (verified === "false") {
          if (isApproved && status !== "pending") return false;
        }
      }
      if (fromDate) {
        const itemDateStr =
          it.duration_start_date ||
          it.date_of_award ||
          it.start_date ||
          it.award_date ||
          it.created_at ||
          it.createdAt;
        if (itemDateStr) {
          const itemTime = new Date(itemDateStr).getTime();
          const fromTime = new Date(fromDate).getTime();
          if (itemTime < fromTime) return false;
        }
      }
      if (toDate) {
        const itemDateStr =
          it.duration_start_date ||
          it.date_of_award ||
          it.start_date ||
          it.award_date ||
          it.created_at ||
          it.createdAt;
        if (itemDateStr) {
          const itemTime = new Date(itemDateStr).getTime();
          const toTime = new Date(toDate).getTime() + 86400000;
          if (itemTime > toTime) return false;
        }
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const str = JSON.stringify(it).toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  };

  const filteredItems = useMemo(() => applyFilters(items), [items, titleFilter, issuer, userType, verified, fromDate, toDate, query, mode]);

  const verifiedCount = useMemo(() => {
    return filteredItems.filter((it) => {
      const status = (it.verification_status || "").toLowerCase();
      return status === "approved" || Boolean(it.verified);
    }).length;
  }, [filteredItems]);

  const getColumnsForMode = (m) => {
    switch (m) {
      case "achievements":
        return [
          { key: "id", header: "ID" },
          { key: "title", header: "Title" },
          { key: "issuer", header: "Issuer" },
          { key: "date_of_award", header: "Date of Award" },
          { key: "recipient_name", header: "Recipient Name" },
          { key: "description", header: "Description" },
          { key: "uploaded_by", header: "Uploaded By" },
          { key: "approved_at", header: "Approved At" },
          { key: "approved_by", header: "Approved By" },
          { key: "proof_file", header: "Proof File" },
          { key: "created_at", header: "Created At" },
          { key: "verified", header: "Verified" },
          { key: "verification_status", header: "Verification Status" },
        ];
      case "projects":
        return [
          { key: "id", header: "ID" },
          { key: "title", header: "Title" },
          { key: "description", header: "Description" },
          { key: "mentor_name", header: "Mentor Name" },
          { key: "academic_year", header: "Academic Year" },
          { key: "status", header: "Status" },
          { key: "team_member_names", header: "Team Members" },
          { key: "github_url", header: "GitHub URL" },
          { key: "uploaded_by", header: "Uploaded By" },
          { key: "created_at", header: "Created At" },
          { key: "verified", header: "Verified" },
          { key: "verification_status", header: "Verification Status" },
        ];
      case "participation":
        return [
          { key: "id", header: "ID" },
          { key: "faculty_name", header: "Faculty Name" },
          { key: "department", header: "Department" },
          { key: "event_name", header: "Event Title" },
          { key: "type_of_event", header: "Event Type" },
          { key: "mode_of_training", header: "Mode" },
          { key: "organizer", header: "Conducted By" },
          { key: "start_date", header: "Start Date" },
          { key: "end_date", header: "End Date" },
          { key: "created_at", header: "Created At" },
          { key: "verified", header: "Verified" },
          { key: "verification_status", header: "Verification Status" },
        ];
      case "research":
        return [
          { key: "id", header: "ID" },
          { key: "faculty_name", header: "Faculty Name" },
          { key: "title", header: "Grant / Project Title" },
          { key: "funded_type", header: "Funded Type" },
          { key: "principal_investigator", header: "Principal Investigator" },
          { key: "team_members", header: "Team Members" },
          { key: "agency", header: "Funding Agency" },
          { key: "amount", header: "Amount (₹)" },
          { key: "current_status", header: "Status" },
          { key: "duration", header: "Duration" },
          { key: "start_date", header: "Start Date" },
          { key: "end_date", header: "End Date" },
          { key: "created_at", header: "Created At" },
        ];
      case "consultancy":
        return [
          { key: "id", header: "ID" },
          { key: "faculty_name", header: "Faculty Name" },
          { key: "agency", header: "Agency / Client" },
          { key: "team_members", header: "Team Members" },
          { key: "amount", header: "Amount (₹)" },
          { key: "duration", header: "Duration" },
          { key: "start_date", header: "Start Date" },
          { key: "end_date", header: "End Date" },
          { key: "created_at", header: "Created At" },
        ];
      case "hackathons":
        return [
          { key: "id", header: "ID" },
          { key: "hackathon_name", header: "Hackathon Name" },
          { key: "student_name", header: "Student Name" },
          { key: "team_leader_name", header: "Team Leader" },
          { key: "team_member_names", header: "Team Members" },
          { key: "hosted_by", header: "Hosted By" },
          { key: "location", header: "Location" },
          { key: "no_of_rounds", header: "Rounds" },
          { key: "progress", header: "Progress" },
          { key: "prize", header: "Prize" },
          { key: "duration_start_date", header: "Start Date" },
          { key: "duration_end_date", header: "End Date" },
          { key: "proof_file", header: "Proof File" },
          { key: "created_at", header: "Created At" },
          { key: "verified", header: "Verified" },
          { key: "verification_status", header: "Verification Status" },
        ];
      default:
        return [];
    }
  };

  const allColumns = useMemo(() => getColumnsForMode(mode), [mode]);
  const [selectedColumns, setSelectedColumns] = useState(() => allColumns.map((c) => c.key));

  useEffect(() => {
    setSelectedColumns(allColumns.map((c) => c.key));
  }, [allColumns]);

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const mapItemToRow = (it, m) => {
    return {
      id: it.id || "",
      // achievements: title field; hackathons: hackathon_name; projects: title; participation: title (event)
      title: it.title || it.hackathon_name || it.project_title || "",
      hackathon_name: it.hackathon_name || "",
      issuer: it.issuer || it.issuer_name || it.client_name || "",
      date_of_award: it.date_of_award || it.award_date || "",
      // achievements: name is the student's name field; fallback user_fullname
      recipient_name: it.name || it.recipient_name || it.user_fullname || it.uploader || "",
      // achievements have no description column — use event_name (competition/event name) as description
      // projects have a real description column; participation has details field
      description: it.description || it.event_name || it.details || "",
      event_name: it.event_name || it.title || "",
      uploaded_by: it.uploader_full_name || it.uploaded_by || it.uploader || it.user_fullname || "",
      // DB field is verified_at, not approved_at
      approved_at: it.verified_at || "",
      // DB joined field is verified_by_fullname (achievements) or verified_by_name (hackathons)
      approved_by: it.verified_by_fullname || it.verified_by_name || "",
      // DB joined field is proof_name (original filename) or proof_filename (stored filename)
      proof_file: it.proof_name || it.proof_filename || "",
      created_at: it.created_at || it.createdAt || "",
      domain: it.domain || "",
      tech_stack: it.tech_stack || "",
      project_type: it.project_type || "",
      github_url: it.github_url || "",
      demo_url: it.demo_url || "",
      faculty_name: it.faculty_name || it.user_fullname || "",
      type_of_event: it.type_of_event || it.event_type || "",
      mode_of_training: it.mode_of_training || "",
      department: it.department || "",
      // participation: organizer is conducted_by
      organizer: it.conducted_by || it.organizer || it.hosted_by || "",
      hosted_by: it.hosted_by || "",
      start_date: it.start_date || it.duration_start_date || "-",
      end_date:
        it.end_date ||
        it.duration_end_date ||
        ((it.current_status || it.status || "").toLowerCase() === "ongoing"
          ? "Ongoing"
          : "-"),
      duration_start_date: it.duration_start_date || it.start_date || "-",
      duration_end_date: it.duration_end_date || it.end_date || "-",
      type: it.funded_type || it.type || "",
      funded_type: it.funded_type || "",
      principal_investigator: it.principal_investigator || "",
      agency: it.agency || it.funding_agency || it.client_name || "",
      current_status: it.current_status || it.status || "",
      team_members: it.team_members || it.team_member_names || "",
      duration:
        it.duration ||
        (it.start_date && it.end_date
          ? calculateDuration(it.start_date, it.end_date)
          : ""),
      journal_conference: it.journal_conference || "",
      publication_date: it.publication_date || "",
      funding_agency: it.agency || it.funding_agency || "",
      amount: it.amount || "",
      client_name: it.agency || it.client_name || "",
      project_title: it.title || it.project_title || "",
      status: it.current_status || it.status || "",
      // project-specific real DB fields
      mentor_name: it.mentor_name || "",
      academic_year: it.academic_year || "",
      // hackathon fields — use actual DB column names
      student_name: it.student_name || "",
      team_leader_name: it.team_leader_name || "",
      team_member_names: it.team_member_names || "",
      location: it.location || "",
      no_of_rounds: it.no_of_rounds ?? "",
      progress: it.progress || "",
      prize: it.prize || "",
      // legacy aliases (kept for any remaining references)
      team_name: it.team_leader_name || it.team_name || "",
      rounds_completed: it.no_of_rounds ?? it.rounds_completed ?? "",
      prize_won: it.prize || it.prize_won || "",
      verified: Boolean(it.verified || (it.verification_status || "").toLowerCase() === "approved"),
      verification_status: it.verification_status || (it.verified ? "approved" : "pending"),
    };
  };

  const handleApply = () => {
    const rows = filteredItems.map((it) => mapItemToRow(it, mode));
    setPreviewRows(rows);
    setShowPreview(true);
  };

  const handleExport = () => {
    const listToExport = filteredItems.map((it) => mapItemToRow(it, mode));
    if (listToExport.length === 0) {
      alert("No data available to export.");
      return;
    }
    const modeCols = getColumnsForMode(mode);
    const activeCols = modeCols.filter((c) => selectedColumns.includes(c.key));

    const exportRows = listToExport.map((row) => {
      const obj = {};
      activeCols.forEach((c) => {
        obj[c.header] = row[c.key] !== undefined ? row[c.key] : "";
      });
      return obj;
    });

    const filename = `${mode}_export_${new Date().toISOString().slice(0, 10)}`;
    exportToXlsxOrCsv(exportRows, filename, exportFormat);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-5">
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
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs w-full">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaFileExport className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Export Records Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Filter, customize columns, preview live datasets, and export official reports in Excel or CSV.
            </p>
          </div>
        </div>

        {/* Interactive Dataset Hub Cards */}
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Select Department Dataset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {datasetHub.map((ds) => {
              const IconComponent = ds.icon;
              const isSelected = mode === ds.key;
              return (
                <button
                  key={ds.key}
                  onClick={() => setMode(ds.key)}
                  className={`rounded-2xl border p-3.5 text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected ? ds.activeBg : "bg-white border-slate-200/90 hover:border-cyan-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${ds.color} shadow-xs`}>
                      <IconComponent className="w-4 h-4" />
                    </span>
                    {isSelected && <FaCheck className="w-3.5 h-3.5 text-cyan-600" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {ds.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Controls Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FaFilter className="w-3.5 h-3.5 text-cyan-600" />
              Filter & Export Options
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Format:</span>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setExportFormat("xlsx")}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                    exportFormat === "xlsx"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FaFileExcel className="w-3 h-3" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => setExportFormat("csv")}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                    exportFormat === "csv"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FaFileCsv className="w-3 h-3" />
                  CSV (.csv)
                </button>
              </div>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Category / Subtitle Filter
              </label>
              {mode === "achievements" || mode === "participation" ? (
                <CustomDropdown
                  value={titleFilter}
                  onChange={setTitleFilter}
                  options={titleOptions.map((o) => ({ value: o, label: o }))}
                  placeholder="All Categories"
                />
              ) : (
                <input
                  disabled
                  placeholder="All Categories (N/A)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 text-slate-400 font-medium"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                User Type Filter
              </label>
              <CustomDropdown
                value={userType}
                onChange={setUserType}
                options={userTypeOptions}
                placeholder="All Users (Student & Staff)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Verification Status
              </label>
              <CustomDropdown
                value={verified}
                onChange={setVerified}
                options={verifiedOptions}
                placeholder="All Statuses"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Search Keyword
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, desc, name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-xs"
              />
            </div>
          </div>

          {/* Column Selector Box */}
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-cyan-900 flex items-center gap-1.5">
                <FaTable className="w-3.5 h-3.5 text-cyan-600" />
                Select Columns to Include in Export
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColumns(allColumns.map((c) => c.key))}
                  className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-100 transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedColumns([])}
                  className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {allColumns.map((col) => {
                const isSelected = selectedColumns.includes(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:border-cyan-300"
                    }`}
                  >
                    {isSelected ? <FaCheck className="w-2.5 h-2.5" /> : <FaTimes className="w-2.5 h-2.5 text-slate-400" />}
                    {col.header}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-4 text-xs font-extrabold text-slate-700">
              <span className="flex items-center gap-1 text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <FaTable className="w-3 h-3 text-cyan-600" />
                {filteredItems.length} Records Found
              </span>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <FaCheckCircle className="w-3 h-3 text-emerald-600" />
                {verifiedCount} Verified
              </span>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIssuer("");
                  setTitleFilter("");
                  setStudent("");
                  setVerified("");
                  setFromDate("");
                  setToDate("");
                  setQuery("");
                  setShowPreview(false);
                  setPreviewRows([]);
                  setSelectedColumns(allColumns.map((c) => c.key));
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Reset Filters
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-xs font-extrabold text-cyan-700 hover:bg-cyan-100 transition cursor-pointer"
              >
                <FaSync className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                {showPreview ? "Update Preview" : "Preview Table"}
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={filteredItems.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                <FaDownload className="w-3.5 h-3.5" />
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Live Table Preview */}
        {showPreview && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FaTable className="w-4 h-4 text-cyan-600" />
                Live Data Preview ({previewRows.length} rows)
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Showing selected {selectedColumns.length} columns
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    {getColumnsForMode(mode)
                      .filter((c) => selectedColumns.includes(c.key))
                      .map((col) => (
                        <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {col.header}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {previewRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedColumns.length || 1}
                        className="text-center py-8 text-slate-400 font-bold"
                      >
                        No records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    previewRows.map((r, idx) => (
                      <tr
                        key={r.id || idx}
                        className="hover:bg-cyan-50/40 transition-colors"
                      >
                        {getColumnsForMode(mode)
                          .filter((c) => selectedColumns.includes(c.key))
                          .map((col) => (
                            <td key={col.key} className="px-4 py-2.5 max-w-xs truncate">
                              {col.key === "verified" || col.key === "verification_status" ? (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    String(r[col.key]).toLowerCase() === "approved" || r[col.key] === true
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {String(r[col.key])}
                                </span>
                              ) : (
                                String(r[col.key] !== undefined ? r[col.key] : "")
                              )}
                            </td>
                          ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
