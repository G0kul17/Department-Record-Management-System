import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import CustomSelect from "../../components/ui/CustomSelect";
import { loadAchievementTypes } from "../../utils/achievementTypes";
import { FaTasks, FaArrowLeft, FaSync, FaPlus, FaTrashAlt, FaSearch } from "react-icons/fa";

export default function AdminStaffCoordinators() {
  const nav = useNavigate();
  const [mappings, setMappings] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [customActivityType, setCustomActivityType] = useState("");
  const [staffId, setStaffId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mapRes, staffRes, typesRes, achievementsList] = await Promise.all([
        apiClient.get("/activity-coordinators"),
        apiClient.get("/admin/users"),
        apiClient.get("/activity-coordinators/types"),
        loadAchievementTypes(),
      ]);
      const maps = mapRes.mappings || mapRes || [];
      const staff = (staffRes.users || []).filter(
        (u) => u.role === "staff" || u.role === "admin"
      );
      const backendTypes = typesRes.activityTypes || typesRes || [];

      // Combine defaults + custom added achievements + existing activity types
      const seen = new Set();
      const combined = [];
      for (const item of [...achievementsList, ...backendTypes]) {
        if (!item) continue;
        const trimmed = String(item).trim();
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower) && lower !== "achievement") {
          seen.add(lower);
          combined.push(trimmed);
        }
      }

      // Sort in ascending order
      combined.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));

      setMappings(maps);
      setStaffList(staff);
      setActivityTypes(combined);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    const finalActivityType = activityType === "__custom" ? customActivityType.trim() : activityType.trim();
    if (!finalActivityType || !staffId) {
      setError("Please provide activity type and staff member");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/activity-coordinators", {
        activityType: finalActivityType,
        staffId: Number(staffId),
      });
      setSuccess("Coordinator added successfully");
      setShowModal(false);
      setActivityType("");
      setCustomActivityType("");
      setStaffId("");
      await load();
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError(e.message || "Failed to add coordinator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this coordinator?")) return;
    try {
      await apiClient.delete(`/activity-coordinators/${id}`);
      setSuccess("Coordinator removed");
      await load();
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError(e.message || "Failed to remove coordinator");
    }
  };

  const filtered = mappings.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (m.activity_type || "").toLowerCase().includes(q) ||
      (m.staff_name || "").toLowerCase().includes(q) ||
      (m.staff_email || "").toLowerCase().includes(q)
    );
  });

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm w-full">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-xs flex-shrink-0">
              <FaTasks className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Activity Coordinators
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Map staff members to specific achievement & event activity types.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
            >
              <FaSync className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <FaPlus className="w-3 h-3" />
              Add Coordinator
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 shadow-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 shadow-xs">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 w-full">
          {/* Search Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search activity, staff name or email..."
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-xs"
              />
            </div>
            <span className="text-xs font-extrabold text-slate-500">
              {filtered.length} Coordinators Mapped
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {loading && !mappings.length ? (
              <div className="col-span-full text-center py-8 text-xs font-bold text-slate-400">
                Loading coordinator mappings...
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-8 text-xs font-bold text-slate-400">
                No activity coordinators mapped yet.
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 hover:bg-white hover:shadow-xs hover:border-blue-300 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider truncate">
                      {m.activity_type || "(Unspecified)"}
                    </h3>
                    <p className="text-xs font-bold text-blue-700 mt-0.5 truncate">
                      {m.staff_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {m.staff_email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-xs transition cursor-pointer flex-shrink-0"
                  >
                    <FaTrashAlt className="w-2.5 h-2.5" />
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Assign Staff Coordinator
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Activity Type
                  </label>
                  <CustomSelect
                    className="w-full"
                    value={activityType}
                    onChange={(value) => setActivityType(value)}
                    options={[
                      ...activityTypes,
                      { value: "__custom", label: "+ Custom Achievement" },
                    ]}
                    placeholder="Select activity type"
                    buttonClassName="rounded-xl border-slate-300 text-xs font-semibold py-2"
                  />
                  {activityType === "__custom" && (
                    <input
                      autoFocus
                      value={customActivityType}
                      onChange={(e) => setCustomActivityType(e.target.value)}
                      placeholder="Type custom achievement name..."
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Select Staff Member
                  </label>
                  <CustomSelect
                    className="w-full"
                    value={staffId}
                    onChange={(value) => setStaffId(value)}
                    options={staffList.map((s) => ({
                      value: String(s.id),
                      label: `${s.full_name} (${s.email})`,
                    }))}
                    placeholder="Select staff member"
                    buttonClassName="rounded-xl border-slate-300 text-xs font-semibold py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setActivityType("");
                    setCustomActivityType("");
                    setStaffId("");
                    setError(null);
                  }}
                  className="flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={
                    submitting ||
                    !activityType.trim() ||
                    (activityType === "__custom" && !customActivityType.trim()) ||
                    !staffId
                  }
                  className="flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Adding..." : "Assign Coordinator"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
