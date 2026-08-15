import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import CustomSelect from "../../components/ui/CustomSelect";
import UploadDropzone from "../../components/ui/UploadDropzone";
import { FaBriefcase, FaArrowLeft } from "react-icons/fa";

export default function FacultyConsultancy() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    faculty_name: "",
    team_members: "",
    agency: "",
    agency_custom: "",
    amount: "",
    duration: "",
    start_date: "",
    end_date: "",
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const normalizedAgency =
      form.agency === "__custom__"
        ? (form.agency_custom || "").trim()
        : form.agency;
    if (!normalizedAgency) {
      setMessage("Please enter agency");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const fd = new FormData();
      const teamMembersStr = Array.isArray(form.teamMembers) && form.teamMembers.length > 0
        ? form.teamMembers.filter(Boolean).join(", ")
        : form.team_members || "";

      const payload = { ...form, agency: normalizedAgency, team_members: teamMembersStr };
      Object.entries(payload).forEach(([k, v]) => {
        if (k === "agency_custom" || k === "teamMembers" || k === "teamMembersCount") return;
        fd.append(k, v || "");
      });
      if (proof) fd.append("proof", proof);
      await apiClient.uploadFile("/faculty-consultancy", fd);
      setMessage("Faculty consultancy added");
      setShowSuccess(true);
      setForm({
        faculty_name: "",
        team_members: "",
        agency: "",
        agency_custom: "",
        amount: "",
        duration: "",
        start_date: "",
        end_date: "",
      });
      setProof(null);
    } catch (err) {
      setMessage(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Navigation */}
        <div>
          <button
            onClick={() => nav("/quick-actions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 shadow-sm flex-shrink-0">
            <FaBriefcase className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Faculty Consultancy
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Add consultancy engagements and proof details below.
            </p>
          </div>
        </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Consultancy Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Faculty Name <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.faculty_name}
                onChange={update("faculty_name")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Agency <span className="text-red-600">*</span>
              </label>
              <CustomSelect
                value={form.agency}
                onChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    agency: value,
                    agency_custom:
                      value === "__custom__" ? prev.agency_custom : "",
                  }));
                }}
                options={[
                  "DST",
                  "SONA SEED",
                  "ICMR",
                  "DRDO",
                  "CSIR",
                  "IBM",
                  "VEE CANADA",
                  { value: "__custom__", label: "Custom Type" },
                ]}
                placeholder="Select Agency"
                required
                name="agency"
              />
              {form.agency === "__custom__" && (
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.agency_custom}
                  onChange={update("agency_custom")}
                  placeholder="Enter custom agency"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Total Team Members <span className="text-red-600">*</span>
              </label>
              <CustomSelect
                value={form.teamMembersCount || 0}
                onChange={(value) => {
                  const count = Number(value || 0);
                  const existing = Array.isArray(form.teamMembers)
                    ? form.teamMembers
                    : [];
                  const next = Array.from(
                    { length: count },
                    (_, i) => existing[i] || "",
                  );
                  setForm((prev) => ({
                    ...prev,
                    teamMembersCount: count,
                    teamMembers: next,
                  }));
                }}
                options={[...Array(10)].map((_, i) => ({
                  value: i + 1,
                  label: String(i + 1),
                }))}
                placeholder="Select Count"
                required
                name="teamMembersCount"
              />
              <div className="mt-2 space-y-2">
                {Array.from({ length: form.teamMembersCount || 0 }).map(
                  (_, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Team Member {idx + 1}{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={
                          (form.teamMembers && form.teamMembers[idx]) || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => {
                            const arr = Array.isArray(prev.teamMembers)
                              ? [...prev.teamMembers]
                              : [];
                            arr[idx] = val;
                            return { ...prev, teamMembers: arr };
                          });
                        }}
                        required
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Amount <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.amount}
                onChange={update("amount")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Duration <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.duration}
                onChange={update("duration")}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.start_date}
                  onChange={update("start_date")}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.end_date}
                  onChange={update("end_date")}
                  required
                />
              </div>
            </div>
          </div>
        </section>

        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Attachments
          </h2>
          <UploadDropzone
            label="Upload and attach proof"
            subtitle="Sanction order, minutes, SRS, payment or completion proof (PDF/Image)"
            accept=".pdf,image/*"
            selectedFile={proof}
            onFileSelected={(f) => setProof(f)}
          />
        </section>

        <div className="flex justify-end pt-4">
          <button
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-cyan-500/20 transition disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Consultancy"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
