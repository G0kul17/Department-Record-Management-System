import React, { useState } from "react";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import BackButton from "../../components/BackButton";
import UploadDropzone from "../../components/ui/UploadDropzone";
import RecordLoader from "../../components/ui/RecordLoader";
import { calculateDuration } from "../../utils/duration";
import StaffNameInput from "../../components/ui/StaffNameInput";

export default function AdminFacultyConsultancy() {
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

  const update = (k) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [k]: val };
      if (k === "start_date" || k === "end_date") {
        next.duration = calculateDuration(next.start_date, next.end_date);
      }
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const normalizedAgency =
      form.agency === "__custom__" ? (form.agency_custom || "").trim() : form.agency;
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
    <div className="mx-auto max-w-4xl p-6">
      {submitting && <RecordLoader text="Submitting Faculty Consultancy..." fullScreen={true} />}
      <BackButton />
      <SuccessModal
        open={showSuccess}
        title="Saved successfully"
        subtitle="Faculty consultancy has been added."
        onClose={() => setShowSuccess(false)}
      />
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Admin: Faculty Consultancy
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Create consultancy entries on behalf of faculty.
      </p>

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
              <StaffNameInput
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
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.agency}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    agency: v,
                    agency_custom: v === "__custom__" ? prev.agency_custom : "",
                  }));
                }}
                required
              >
                <option value="" disabled>
                  Select Agency
                </option>
                <option value="CSIR">CSIR</option>
                <option value="DRDO">DRDO</option>
                <option value="DST">DST</option>
                <option value="IBM">IBM</option>
                <option value="ICMR">ICMR</option>
                <option value="SONA SEED">SONA SEED</option>
                <option value="VEE CANADA">VEE CANADA</option>
                <option value="__custom__">Custom Type</option>
              </select>
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
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 cursor-not-allowed"
                value={form.duration}
                readOnly
                placeholder="Calculated automatically"
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
