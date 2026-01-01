import React, { useState } from "react";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import UploadDropzone from "../../components/ui/UploadDropzone";

export default function FacultyResearch() {
  const [form, setForm] = useState({
    faculty_name: "",
    funded_type: "",
    principal_investigator: "",
    team_members: "",
    teamMembersCount: 0,
    teamMembers: [],
    title: "",
    agency: "",
    current_status: "",
    duration: "",
    start_date: "",
    end_date: "",
    amount: "",
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "teamMembers") {
          fd.append("team_member_names", (v || []).join(", "));
        } else if (k !== "teamMembersCount") {
          fd.append(k, v || "");
        }
      });
      if (proof) fd.append("proof", proof);
      await apiClient.uploadFile("/faculty-research", fd);
      setMessage("Faculty research added");
      setShowSuccess(true);
      setForm({
        funded_type: "",
        principal_investigator: "",
        team_members: "",
        teamMembersCount: 0,
        teamMembers: [],
        title: "",
        agency: "",
        current_status: "",
        duration: "",
        start_date: "",
        end_date: "",
        amount: "",
      });
      setProof(null);
    } catch (err) {
      setMessage(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <SuccessModal
        open={showSuccess}
        title="Saved successfully"
        subtitle="Faculty research has been added."
        onClose={() => setShowSuccess(false)}
      />
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Faculty Research
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Add research funding and project details.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Research Details
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
                Funded Type <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.funded_type}
                onChange={update("funded_type")}
                required
              >
                <option value="" disabled>
                  Select Funded Type
                </option>
                <option value="sponsored">Sponsored</option>
                <option value="inhouse">Inhouse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Principal Investigator <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.principal_investigator}
                onChange={update("principal_investigator")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Total Team Members <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.teamMembersCount || 0}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  const existing = Array.isArray(form.teamMembers)
                    ? form.teamMembers
                    : [];
                  const next = Array.from(
                    { length: count },
                    (_, i) => existing[i] || ""
                  );
                  setForm((prev) => ({
                    ...prev,
                    teamMembersCount: count,
                    teamMembers: next,
                  }));
                }}
                required
              >
                <option value={0} disabled>
                  Select Count
                </option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
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
                  )
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.title}
                onChange={update("title")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Agency <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.agency}
                onChange={update("agency")}
                required
              >
                <option value="" disabled>
                  Select Agency
                </option>
                <option value="DST">DST</option>
                <option value="SONA SEED">SONA SEED</option>
                <option value="ICMR">ICMR</option>
                <option value="DRDO">DRDO</option>
                <option value="CSIR">CSIR</option>
                <option value="IBM">IBM</option>
                <option value="VEE CANADA">VEE CANADA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Current Status <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.current_status}
                onChange={update("current_status")}
                required
              >
                <option value="" disabled>
                  Select Status
                </option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="proposal submitted">Proposal Submitted</option>
              </select>
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
                  Start Date{" "}
                  {form.current_status !== "ongoing" && (
                    <span className="text-red-600">*</span>
                  )}
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.start_date}
                  onChange={update("start_date")}
                  required={form.current_status !== "ongoing"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  End Date{" "}
                  {form.current_status !== "ongoing" && (
                    <span className="text-red-600">*</span>
                  )}
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.end_date}
                  onChange={update("end_date")}
                  required={form.current_status !== "ongoing"}
                />
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
          </div>
        </section>

        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Attachments
          </h2>
          <UploadDropzone
            label="Upload and attach proof"
            subtitle="Sanction order or proposal submission (PDF/Image)"
            accept=".pdf,image/*"
            selectedFile={proof}
            onFileSelected={(f) => setProof(f)}
          />
        </section>

        <div className="flex justify-end">
          <button
            disabled={submitting}
            className="inline-flex items-center rounded-md bg-[#87CEEB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
