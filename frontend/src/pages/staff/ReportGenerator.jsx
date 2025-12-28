import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/axiosClient";
import exportToXlsxOrCsv from "../../utils/exportData";
import BackButton from "../../components/BackButton";

function Dropdown({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="text-slate-600 dark:text-slate-200 text-xs mb-1">
        {label}
      </span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ReportGenerator() {
  const [mode, setMode] = useState("achievements"); // achievements | projects | participation | research | consultancy
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [issuer, setIssuer] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [student, setStudent] = useState("");
  const [verified, setVerified] = useState("");
  const [userType, setUserType] = useState(""); // "student" | "staff" | ""
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // For reports we want all user-entered records, not just verified ones
        let endpoint = "/achievements?limit=2000";
        if (mode === "projects") endpoint = "/projects?limit=2000";
        if (mode === "participation")
          endpoint = "/faculty-participation?limit=2000";
        if (mode === "research") endpoint = "/faculty-research?limit=2000";
        if (mode === "consultancy")
          endpoint = "/faculty-consultancy?limit=2000";

        const data = await apiClient.get(endpoint);
        if (!mounted) return;
        if (mode === "achievements") setItems(data.achievements || []);
        else if (mode === "projects") setItems(data.projects || []);
        else if (mode === "participation")
          setItems(
            data.participations || data.facultyParticipation || data.items || []
          );
        else if (mode === "research")
          setItems(data.research || data.facultyResearch || data.items || []);
        else if (mode === "consultancy")
          setItems(
            data.consultancies || data.facultyConsultancy || data.items || []
          );
      } catch (err) {
        console.error(err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [mode]);

  const issuerOptions = useMemo(() => {
    const s = new Set();
    items.forEach((it) => {
      if (it.issuer) s.add(it.issuer);
    });
    return Array.from(s).sort();
  }, [items]);

  const titleOptions = useMemo(() => {
    const s = new Set();
    items.forEach((it) => {
      if (it.title) s.add(it.title);
    });
    return Array.from(s).sort();
  }, [items]);

  const studentOptions = useMemo(() => {
    const s = new Set();
    items.forEach((it) => {
      const name =
        it.studentName ||
        it.user_fullname ||
        it.user_name ||
        it.student_name ||
        it.uploader;
      if (name) s.add(name);
    });
    return Array.from(s).sort();
  }, [items]);

  const applyFilters = (list) => {
    return list.filter((it) => {
      // title filter (for achievements)
      if (titleFilter && (it.title || "") !== titleFilter) return false;
      if (issuer && (it.issuer || it.issuer_name) !== issuer) return false;
      // Filter by user type (student/staff)
      if (userType) {
        const isStaff = Boolean(it.faculty_name);
        if (userType === "staff" && !isStaff) return false;
        if (userType === "student" && isStaff) return false;
      }
      if (verified !== "") {
        const status = (it.verification_status || "").toLowerCase();
        const isApproved = status === "approved" || Boolean(it.verified);
        if (verified === "true") {
          // Show only approved
          if (!isApproved || status === "pending") return false;
        } else if (verified === "false") {
          // Show only not approved (pending or unverified)
          if (isApproved && status === "approved") return false;
        }
      }
      if (query) {
        const q = query.toLowerCase();
        if (
          !(
            (it.title || "").toLowerCase().includes(q) ||
            (it.description || "").toLowerCase().includes(q)
          )
        )
          return false;
      }
      if (fromDate) {
        const d = new Date(
          it.created_at ||
            it.verified_at ||
            it.approvedAt ||
            it.date ||
            it.date_of_award
        );
        if (isNaN(d)) return false;
        if (d < new Date(fromDate)) return false;
      }
      if (toDate) {
        const d = new Date(
          it.created_at ||
            it.verified_at ||
            it.approvedAt ||
            it.date ||
            it.date_of_award
        );
        if (isNaN(d)) return false;
        if (d > new Date(toDate + "T23:59:59")) return false;
      }
      return true;
    });
  };

  const handleExport = async () => {
    // If a preview is active use that set, otherwise compute from current items
    let rows = [];
    if (showPreview && previewRows && previewRows.length) {
      rows = previewRows;
    } else {
      const filtered = applyFilters(items);
      rows = filtered.map((it) => mapItemToRow(it, mode));
    }

    const columns = getColumnsForMode(mode).filter((c) =>
      selectedColumns.includes(c.key)
    );

    await exportToXlsxOrCsv(
      `${mode}-report-${new Date().toISOString().slice(0, 10)}`,
      rows,
      columns
    );
  };

  // Preview state populated by Apply
  const [previewRows, setPreviewRows] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Column selection
  const allColumns = useMemo(() => getColumnsForMode(mode), [mode]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  useEffect(() => {
    setSelectedColumns(allColumns.map((c) => c.key));
  }, [mode, allColumns]);

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  function getColumnsForMode(mode) {
    if (mode === "projects") {
      return [
        { key: "id", header: "ID" },
        { key: "title", header: "Title" },
        { key: "description", header: "Description" },
        { key: "mentor_name", header: "Mentor" },
        { key: "academic_year", header: "Academic Year" },
        { key: "team_member_names", header: "Team Members" },
        { key: "team_members_count", header: "Team Count" },
        { key: "github_url", header: "GitHub URL" },
        { key: "created_by", header: "Created By" },
        { key: "created_at", header: "Created At" },
        { key: "verified", header: "Verified" },
        { key: "verification_status", header: "Verification Status" },
        { key: "verified_by", header: "Verified By" },
        { key: "verified_at", header: "Verified At" },
        { key: "files", header: "Files" },
      ];
    }
    if (mode === "participation") {
      return [
        { key: "id", header: "ID" },
        { key: "faculty_name", header: "Faculty Name" },
        { key: "department", header: "Department" },
        { key: "type_of_event", header: "Type of Event" },
        { key: "mode_of_training", header: "Mode of Training" },
        { key: "title", header: "Title" },
        { key: "start_date", header: "Start Date" },
        { key: "end_date", header: "End Date" },
        { key: "place", header: "Place" },
        { key: "proof_file", header: "Proof File" },
        { key: "created_at", header: "Created At" },
        { key: "verified", header: "Verified" },
        { key: "verification_status", header: "Verification Status" },
      ];
    }
    if (mode === "research") {
      return [
        { key: "id", header: "ID" },
        { key: "funded_type", header: "Funded Type" },
        { key: "principal_investigator", header: "Principal Investigator" },
        { key: "team_member_names", header: "Team Members" },
        { key: "title", header: "Title" },
        { key: "agency", header: "Agency" },
        { key: "current_status", header: "Current Status" },
        { key: "duration", header: "Duration" },
        { key: "start_date", header: "Start Date" },
        { key: "end_date", header: "End Date" },
        { key: "amount", header: "Amount" },
        { key: "created_at", header: "Created At" },
        { key: "verified", header: "Verified" },
        { key: "verification_status", header: "Verification Status" },
      ];
    }
    if (mode === "consultancy") {
      return [
        { key: "id", header: "ID" },
        { key: "faculty_name", header: "Faculty Name" },
        { key: "title", header: "Title" },
        { key: "client", header: "Client" },
        { key: "agency", header: "Agency" },
        { key: "team_member_names", header: "Team Members" },
        { key: "start_date", header: "Start Date" },
        { key: "end_date", header: "End Date" },
        { key: "amount", header: "Amount" },
        { key: "proof_file", header: "Proof File" },
        { key: "created_at", header: "Created At" },
        { key: "verified", header: "Verified" },
        { key: "verification_status", header: "Verification Status" },
      ];
    }
    // achievements
    return [
      { key: "id", header: "ID" },
      { key: "title", header: "Title" },
      { key: "issuer", header: "Issuer" },
      { key: "date_of_award", header: "Date of Award" },
      { key: "name", header: "Recipient Name" },
      { key: "description", header: "Description" },
      { key: "student", header: "Uploaded By" },
      { key: "approved_at", header: "Approved At" },
      { key: "approved_by", header: "Approved By" },
      { key: "proof_file", header: "Proof File" },
      { key: "created_at", header: "Created At" },
      { key: "verified", header: "Verified" },
      { key: "verification_status", header: "Verification Status" },
    ];
  }

  function mapItemToRow(it, mode) {
    if (mode === "projects") {
      const files = it.files || it.files_json || [];
      const filesStr = Array.isArray(files)
        ? files
            .map(
              (f) =>
                f.original_name || f.name || f.filename || JSON.stringify(f)
            )
            .join(" | ")
        : String(files || "");
      return {
        id: it.id,
        title: it.title,
        description: it.description || "",
        mentor_name: it.mentor_name || "",
        academic_year: it.academic_year || "",
        team_member_names:
          it.team_member_names || it.teamMembers || it.team_members || "",
        team_members_count: it.team_members_count || it.teamMembersCount || "",
        github_url: it.github_url || it.github || "",
        created_by: it.created_by || it.user_id || "",
        created_at: it.created_at || "",
        verified: it.verified || false,
        verification_status:
          it.verification_status || (it.verified ? "approved" : "pending"),
        verified_by: it.verified_by || "",
        verified_at: it.verified_at || "",
        files: filesStr,
      };
    }
    if (mode === "participation") {
      const proof = it.proof_name || it.proof_filename || it.proof || "";
      return {
        id: it.id,
        faculty_name: it.faculty_name || it.name || it.user_fullname || "",
        department: it.department || "",
        type_of_event: it.type_of_event || it.event_type || "",
        mode_of_training: it.mode_of_training || it.training_mode || "",
        title: it.title || "",
        start_date: it.start_date || "",
        end_date: it.end_date || "",
        place: it.place || "",
        proof_file: proof,
        created_at: it.created_at || "",
        verified: it.verified || false,
        verification_status:
          it.verification_status || (it.verified ? "approved" : "pending"),
      };
    }
    if (mode === "research") {
      const proof = it.proof_name || it.proof_filename || it.proof || "";
      return {
        id: it.id,
        funded_type: it.funded_type || "",
        principal_investigator: it.principal_investigator || "",
        team_member_names:
          it.team_member_names || it.teamMembers || it.team_members || "",
        title: it.title || "",
        agency: it.agency || "",
        current_status: it.current_status || "",
        duration: it.duration || "",
        start_date: it.start_date || "",
        end_date: it.end_date || "",
        amount: it.amount || "",
        created_at: it.created_at || "",
        verified: it.verified || false,
        verification_status:
          it.verification_status || (it.verified ? "approved" : "pending"),
      };
    }
    if (mode === "consultancy") {
      const proof = it.proof_name || it.proof_filename || it.proof || "";
      return {
        id: it.id,
        faculty_name: it.faculty_name || it.name || it.user_fullname || "",
        title: it.title || "",
        client: it.client || it.company || "",
        agency: it.agency || "",
        team_member_names:
          it.team_member_names || it.teamMembers || it.team_members || "",
        start_date: it.start_date || "",
        end_date: it.end_date || "",
        amount: it.amount || "",
        proof_file: proof,
        created_at: it.created_at || "",
        verified: it.verified || false,
        verification_status:
          it.verification_status || (it.verified ? "approved" : "pending"),
      };
    }
    // achievements
    const proof =
      it.proof_name || it.proof_filename
        ? it.proof_name || it.proof_filename
        : "";
    return {
      id: it.id,
      title: it.title,
      issuer: it.issuer || "",
      date_of_award: it.date_of_award || it.date || "",
      name: it.name || it.user_fullname || it.user_name || "",
      description: it.description || "",
      student:
        it.studentName ||
        it.user_fullname ||
        it.user_name ||
        it.student_name ||
        it.uploader ||
        "",
      approved_at: it.verified_at || it.approvedAt || it.created_at || "",
      approved_by:
        it.verified_by_name || it.approved_by || it.approvedByName || "",
      proof_file: proof,
      created_at: it.created_at || "",
      verified: it.verified || false,
      verification_status:
        it.verification_status || (it.verified ? "approved" : "pending"),
    };
  }

  const handleApply = () => {
    const filtered = applyFilters(items);
    const rows = filtered.map((it) => mapItemToRow(it, mode));
    setPreviewRows(rows);
    setShowPreview(true);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Staff Reports
        </h1>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Generate Excel/CSV reports
        </div>
      </div>

      <div className="mt-6 glitter-card bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-5 shadow-sm">
        {/* Row 1: Core filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
          {/* Dataset */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Dataset
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 6h16M6 12h12M10 18h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="achievements">Achievements</option>
                <option value="projects">Projects</option>
                <option value="participation">Faculty Participation</option>
                <option value="research">Faculty Research</option>
                <option value="consultancy">Faculty Consultancy</option>
              </select>
            </div>
          </div>

          {/* Title (only for achievements) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Title
            </label>
            {mode === "achievements" ? (
              <Dropdown
                label=""
                value={titleFilter}
                onChange={setTitleFilter}
                options={titleOptions}
              />
            ) : (
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 6h18M6 12h12M10 18h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  disabled
                  placeholder="N/A"
                  className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Student/Staff */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Student/Staff
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M12 12a4 4 0 100-8 4 4 0 000 8z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20a8 8 0 0116 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          {/* Verified */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Verified
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <select
                value={verified}
                onChange={(e) => setVerified(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Dates + search */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
          <div className="relative">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              From Date
            </label>
            <span className="pointer-events-none absolute left-3 bottom-3 md:bottom-2.5 text-slate-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7 10h10M7 14h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 5V3M17 5V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              To Date
            </label>
            <span className="pointer-events-none absolute left-3 bottom-3 md:bottom-2.5 text-slate-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7 10h10M7 14h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 5V3M17 5V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Search
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 20l-3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                placeholder="Search title or desc"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setIssuer("");
              setStudent("");
              setVerified("");
              setFromDate("");
              setToDate("");
              setQuery("");
              setShowPreview(false);
              setPreviewRows([]);
              setSelectedColumns(allColumns.map((c) => c.key));
            }}
            className="px-3 py-1 text-sm border rounded bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1 text-sm rounded-md border bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            Apply
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm rounded-md text-white shadow"
            style={{ backgroundColor: "#87CEEB" }}
          >
            Export
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Preview: {applyFilters(items).length} records match the current
          filters
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Columns to Export
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedColumns(allColumns.map((c) => c.key))}
                className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedColumns([])}
                className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="glitter-card rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allColumns.map((col) => (
                <label
                  key={col.key}
                  className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    style={{ accentColor: "#87CEEB" }}
                    checked={selectedColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                  />
                  <span>{col.header}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="mt-4 glitter-card overflow-auto border rounded bg-white dark:bg-slate-900 dark:border-slate-700">
            <table className="min-w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  {getColumnsForMode(mode)
                    .filter((c) => selectedColumns.includes(c.key))
                    .map((col) => (
                      <th
                        key={col.key}
                        className="p-2 text-left text-sm font-semibold border-b dark:border-slate-700 dark:text-slate-200"
                      >
                        {col.header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    className={
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50 dark:bg-slate-800"
                    }
                  >
                    {getColumnsForMode(mode)
                      .filter((c) => selectedColumns.includes(c.key))
                      .map((col) => (
                        <td
                          key={col.key}
                          className="p-2 text-sm border-b align-top dark:border-slate-700 dark:text-slate-200"
                        >
                          {r[col.key]}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
