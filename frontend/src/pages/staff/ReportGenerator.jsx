import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/axiosClient";
import exportToXlsxOrCsv from "../../utils/exportData";

function Dropdown({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="text-slate-600 text-xs mb-1">{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="border rounded p-2 text-sm">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function ReportGenerator() {
  const [mode, setMode] = useState("achievements"); // achievements | projects
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [issuer, setIssuer] = useState("");
  const [student, setStudent] = useState("");
  const [verified, setVerified] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const endpoint = mode === "achievements" ? "/achievements?limit=2000" : "/projects?verified=true&limit=2000";
        const data = await apiClient.get(endpoint);
        if (!mounted) return;
        setItems(mode === "achievements" ? (data.achievements || []) : (data.projects || []));
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

  const studentOptions = useMemo(() => {
    const s = new Set();
    items.forEach((it) => {
      const name = it.studentName || it.user_fullname || it.user_name || it.student_name || it.uploader;
      if (name) s.add(name);
    });
    return Array.from(s).sort();
  }, [items]);

  const applyFilters = (list) => {
    return list.filter((it) => {
      if (issuer && (it.issuer || it.issuer_name) !== issuer) return false;
      if (student) {
        const name = it.studentName || it.user_fullname || it.user_name || it.student_name || it.uploader || "";
        if (!name.includes(student)) return false;
      }
      if (verified !== "") {
        const v = Boolean(it.verified);
        if ((verified === "true") !== v) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        if (!((it.title||"").toLowerCase().includes(q) || (it.description||"").toLowerCase().includes(q))) return false;
      }
      if (fromDate) {
        const d = new Date(it.created_at || it.verified_at || it.approvedAt || it.date || it.date_of_award);
        if (isNaN(d)) return false;
        if (d < new Date(fromDate)) return false;
      }
      if (toDate) {
        const d = new Date(it.created_at || it.verified_at || it.approvedAt || it.date || it.date_of_award);
        if (isNaN(d)) return false;
        if (d > new Date(toDate + "T23:59:59")) return false;
      }
      return true;
    });
  };

  const handleExport = async () => {
    const filtered = applyFilters(items);
    // Map to flat rows according to mode
    const rows = filtered.map((it) => {
      const team = it.team_members || it.teamMembers || it.team || [];
      const attachments = (it.attachments && (typeof it.attachments === 'string' ? JSON.parse(it.attachments) : it.attachments)) || [];
      return {
        id: it.id,
        title: it.title || it.name,
        description: it.description || it.summary || "",
        student: it.studentName || it.user_fullname || it.user_name || it.student_name || it.uploader || "",
        team_members: Array.isArray(team) ? team.join(", ") : (team || ""),
        approved_at: it.verified_at || it.approvedAt || it.created_at || "",
        approved_by: it.verified_by_name || it.approved_by || it.approvedByName || "",
        attachments: Array.isArray(attachments) ? attachments.map(a => a.original_name || a.name || a.filename || a).join(" | ") : "",
      };
    });

    const columns = [
      { key: "id", header: "ID" },
      { key: "title", header: "Title" },
      { key: "description", header: "Description" },
      { key: "student", header: "Uploaded By" },
      { key: "team_members", header: "Team Members" },
      { key: "approved_at", header: "Approved At" },
      { key: "approved_by", header: "Approved By" },
      { key: "attachments", header: "Attachments" },
    ];

    await exportToXlsxOrCsv(`${mode}-report-${new Date().toISOString().slice(0,10)}`, rows, columns);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Reports</h1>
        <div className="text-sm text-slate-600">Generate Excel/CSV reports</div>
      </div>

      <div className="mt-6 bg-white border rounded p-4 shadow-sm">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs text-slate-600">Dataset</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="border rounded p-2 text-sm">
              <option value="achievements">Achievements</option>
              <option value="projects">Projects</option>
            </select>
          </label>

          <Dropdown label="Issuer" value={issuer} onChange={setIssuer} options={issuerOptions} />
          <Dropdown label="Student" value={student} onChange={setStudent} options={studentOptions} />

          <label className="flex flex-col text-sm">
            <span className="text-slate-600 text-xs mb-1">Verified</span>
            <select value={verified} onChange={(e) => setVerified(e.target.value)} className="border rounded p-2 text-sm">
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </label>

        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded p-2 text-sm" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded p-2 text-sm" />
          <input placeholder="Search title or desc" value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-1 md:col-span-2 border rounded p-2 text-sm" />
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button onClick={() => { setIssuer(""); setStudent(""); setVerified(""); setFromDate(""); setToDate(""); setQuery(""); }} className="px-3 py-1 text-sm border rounded">Reset</button>
          <button onClick={handleExport} className="px-3 py-1 text-sm rounded bg-blue-600 text-white">Export</button>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-slate-600">Preview: {applyFilters(items).length} records match the current filters</div>
        <div className="mt-3 text-xs text-slate-500">Note: export will include columns: ID, Title, Description, Uploaded By, Team Members, Approved At, Approved By, Attachments</div>
      </div>
    </div>
  );
}
