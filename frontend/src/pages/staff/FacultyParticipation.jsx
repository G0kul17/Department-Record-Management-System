import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import CustomSelect from "../../components/ui/CustomSelect";
import UploadDropzone from "../../components/ui/UploadDropzone";
import { FaExchangeAlt, FaArrowLeft } from "react-icons/fa";
import StaffNameInput from "../../components/ui/StaffNameInput";

export default function FacultyParticipation() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    faculty_name: "",
    department: "",
    type_of_event: "",
    publications_type: "",
    mode_of_training: "",
    title: "",
    start_date: "",
    end_date: "",
    conducted_by: "",
    details: "",
    claiming_faculty_name: "",
    publication_indexing: "",
    authors_list: "",
    paper_title: "",
    journal_name: "",
    volume_no: "",
    issue_no: "",
    page_or_doi: "",
    issn_or_isbn: "",
    pub_month_year: "",
    citations_count: "",
    paper_url: "",
    journal_home_url: "",
    publisher: "",
    impact_factor: "",
    indexed_in_db: "",
    full_paper_drive_link: "",
    first_page_drive_link: "",
    sdg_mapping: "",
    joint_publication_with: "",
    publication_domain: "",
    coauthors_students: "",
  });
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setErrorDetails([]);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ""));
      if (proof) fd.append("proof", proof);
      await apiClient.uploadFile("/faculty-participations", fd);
      setMessage("Faculty participation added");
      setShowSuccess(true);
      setForm({
        faculty_name: "",
        department: "",
        type_of_event: "",
        mode_of_training: "",
        title: "",
        start_date: "",
        end_date: "",
        conducted_by: "",
        details: "",
        publications_type: "",
        claiming_faculty_name: "",
        publication_indexing: "",
        authors_list: "",
        paper_title: "",
        journal_name: "",
        volume_no: "",
        issue_no: "",
        page_or_doi: "",
        issn_or_isbn: "",
        pub_month_year: "",
        citations_count: "",
        paper_url: "",
        journal_home_url: "",
        publisher: "",
        impact_factor: "",
        indexed_in_db: "",
        full_paper_drive_link: "",
        first_page_drive_link: "",
        sdg_mapping: "",
        joint_publication_with: "",
        publication_domain: "",
        coauthors_students: "",
      });
      setProof(null);
    } catch (err) {
      setMessage(err.message || "Failed to submit");
      const details = Array.isArray(err?.validationErrors)
        ? err.validationErrors
        : Array.isArray(err?.responseData?.errors)
          ? err.responseData.errors
          : [];
      setErrorDetails(details);
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
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Back to Quick Actions
          </button>
        </div>

        {/* Header Title Box */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25 flex-shrink-0">
            <FaExchangeAlt className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Faculty Participation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Add faculty training, workshop, and FDP participation details below.
            </p>
          </div>
        </div>
      {message && <div className="alert alert-info mb-4">{message}</div>}
      {errorDetails.length > 0 && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <div className="font-semibold">Validation details</div>
          <ul className="mt-1 list-disc pl-5">
            {errorDetails.map((e, idx) => (
              <li key={`${e.field || "field"}-${idx}`}>
                {e.field ? `${e.field}: ` : ""}
                {e.message || "Invalid value"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Faculty Details
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
                Department <span className="text-red-600">*</span>
              </label>
              <CustomSelect
                value={form.department}
                onChange={(value) =>
                  update("department")({ target: { value } })
                }
                options={[
                  "B.Tech Information Technology",
                  "B.Tech Artificial Intelligence and Data Science",
                ]}
                placeholder="Select Department"
                required
                name="department"
              />
            </div>
          </div>
        </section>

        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Event / Training
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Type of Event <span className="text-red-600">*</span>
              </label>
              <CustomSelect
                value={form.type_of_event}
                onChange={(value) => {
                  setForm((f) => ({
                    ...f,
                    type_of_event: value,
                    publications_type:
                      value === "Journal Publications" ||
                      value === "Conference Publications"
                        ? value
                        : "",
                  }));
                }}
                options={[
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
                ]}
                placeholder="Select Type"
                required
                name="type_of_event"
              />
            </div>
            {form.type_of_event === "Journal Publications" && (
              <div className="md:col-span-2 mt-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Journal Publications Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Faculty Name - Claiming Publication
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.claiming_faculty_name}
                      onChange={update("claiming_faculty_name")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Scopus Journal / Scopus Book chapter / Web of Science (SCI
                      / ESCI)
                    </label>
                    <CustomSelect
                      value={form.publication_indexing}
                      onChange={(value) =>
                        update("publication_indexing")({
                          target: { value },
                        })
                      }
                      options={[
                        "Scopus Journal",
                        "Scopus Book chapter",
                        "Web of Science (SCI)",
                        "Web of Science (ESCI)",
                      ]}
                      placeholder="Select"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      All Authors Name (order as in paper; bold dept faculty)
                      [Specify (First),(Second)]
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.authors_list}
                      onChange={update("authors_list")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Title of the Paper
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.paper_title}
                      onChange={update("paper_title")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Name of the Journal
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.journal_name}
                      onChange={update("journal_name")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Volume No
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.volume_no}
                      onChange={update("volume_no")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Issue No
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.issue_no}
                      onChange={update("issue_no")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Page No. / DOI
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.page_or_doi}
                      onChange={update("page_or_doi")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      ISSN / eISSN No. / ISBN No
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.issn_or_isbn}
                      onChange={update("issn_or_isbn")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Month and Year of Publication
                    </label>
                    <input
                      type="month"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.pub_month_year}
                      onChange={update("pub_month_year")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Citations - References Number
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.citations_count}
                      onChange={update("citations_count")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Published Paper URL
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.paper_url}
                      onChange={update("paper_url")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Published Journal / Book chapter Homepage URL
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.journal_home_url}
                      onChange={update("journal_home_url")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Publisher
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.publisher}
                      onChange={update("publisher")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Impact Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.impact_factor}
                      onChange={update("impact_factor")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Indexed in Scopus / WoS Database
                    </label>
                    <CustomSelect
                      value={form.indexed_in_db}
                      onChange={(value) =>
                        update("indexed_in_db")({ target: { value } })
                      }
                      options={["Yes", "No"]}
                      placeholder="Select"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Full Paper Proof Uploaded Drive Link (ensure download
                      access)
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.full_paper_drive_link}
                      onChange={update("full_paper_drive_link")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      First Page only Paper Proof Uploaded Drive Link (ensure
                      download access)
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.first_page_drive_link}
                      onChange={update("first_page_drive_link")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      SDG Mapping
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.sdg_mapping}
                      onChange={update("sdg_mapping")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      JOINT PUBLICATION
                    </label>
                    <CustomSelect
                      value={form.joint_publication_with}
                      onChange={(value) =>
                        update("joint_publication_with")({
                          target: { value },
                        })
                      }
                      options={[
                        "Industry",
                        "Top 100 NIRF",
                        "Central Govt",
                        "International University",
                      ]}
                      placeholder="Select"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Domain of the Publication
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.publication_domain}
                      onChange={update("publication_domain")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Whether Co-authors are Students? If YES specify
                    </label>
                    <CustomSelect
                      value={form.coauthors_students}
                      onChange={(value) =>
                        update("coauthors_students")({ target: { value } })
                      }
                      options={["IT", "ADS"]}
                      placeholder="No"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.type_of_event === "Conference Publications" && (
              <div className="md:col-span-2 mt-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Conference Publications Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Faculty Name - Claiming Publication
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.claiming_faculty_name}
                      onChange={update("claiming_faculty_name")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Scopus Journal / Scopus Book chapter / Web of Science (SCI
                      / ESCI)
                    </label>
                    <CustomSelect
                      value={form.publication_indexing}
                      onChange={(value) =>
                        update("publication_indexing")({
                          target: { value },
                        })
                      }
                      options={[
                        "Scopus Journal",
                        "Scopus Book chapter",
                        "Web of Science (SCI)",
                        "Web of Science (ESCI)",
                      ]}
                      placeholder="Select"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      All Authors Name (order as in paper; bold dept faculty)
                      [Specify (First),(Second)]
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.authors_list}
                      onChange={update("authors_list")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Title of the Paper
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.paper_title}
                      onChange={update("paper_title")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Name of the Journal
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.journal_name}
                      onChange={update("journal_name")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Volume No
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.volume_no}
                      onChange={update("volume_no")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Issue No
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.issue_no}
                      onChange={update("issue_no")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Page No. / DOI
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.page_or_doi}
                      onChange={update("page_or_doi")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      ISSN / eISSN No. / ISBN No
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.issn_or_isbn}
                      onChange={update("issn_or_isbn")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Month and Year of Publication
                    </label>
                    <input
                      type="month"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.pub_month_year}
                      onChange={update("pub_month_year")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Citations - References Number
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.citations_count}
                      onChange={update("citations_count")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Published Paper URL
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.paper_url}
                      onChange={update("paper_url")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Published Journal / Book chapter Homepage URL
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.journal_home_url}
                      onChange={update("journal_home_url")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Publisher
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.publisher}
                      onChange={update("publisher")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Impact Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.impact_factor}
                      onChange={update("impact_factor")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Indexed in Scopus / WoS Database
                    </label>
                    <CustomSelect
                      value={form.indexed_in_db}
                      onChange={(value) =>
                        update("indexed_in_db")({ target: { value } })
                      }
                      options={["Yes", "No"]}
                      placeholder="Select"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Full Paper Proof Uploaded Drive Link (ensure download
                      access)
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.full_paper_drive_link}
                      onChange={update("full_paper_drive_link")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      First Page only Paper Proof Uploaded Drive Link (ensure
                      download access)
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.first_page_drive_link}
                      onChange={update("first_page_drive_link")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      SDG Mapping
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.sdg_mapping}
                      onChange={update("sdg_mapping")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      JOINT PUBLICATION
                    </label>
                    <CustomSelect
                      value={form.joint_publication_with}
                      onChange={(value) =>
                        update("joint_publication_with")({
                          target: { value },
                        })
                      }
                      options={[
                        "Industry",
                        "Top 100 NIRF",
                        "Central Govt",
                        "International University",
                      ]}
                      placeholder="Select"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Domain of the Publication
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      value={form.publication_domain}
                      onChange={update("publication_domain")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Whether Co-authors are Students? If YES specify
                    </label>
                    <CustomSelect
                      value={form.coauthors_students}
                      onChange={(value) =>
                        update("coauthors_students")({ target: { value } })
                      }
                      options={["IT", "ADS"]}
                      placeholder="No"
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mode of Training <span className="text-red-600">*</span>
              </label>
              <CustomSelect
                value={form.mode_of_training}
                onChange={(value) =>
                  update("mode_of_training")({ target: { value } })
                }
                options={["Online", "Offline"]}
                placeholder="Select Mode"
                required
                name="mode_of_training"
              />
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Conducted By <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.conducted_by}
                onChange={update("conducted_by")}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Details <span className="text-red-600">*</span>
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              rows={4}
              value={form.details}
              onChange={update("details")}
              required
            />
          </div>
        </section>

        <section className="glitter-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Attachments
          </h2>
          <UploadDropzone
            label="Upload and attach proof"
            subtitle="All file types allowed"
            accept="*"
            maxSizeMB={15}
            selectedFile={proof}
            onFileSelected={(f) => setProof(f)}
          />
        </section>

        <div className="flex justify-end pt-4">
          <button
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/25 transition disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Participation"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
