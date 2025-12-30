import React, { useState } from "react";
import apiClient from "../../api/axiosClient";
import SuccessModal from "../../components/ui/SuccessModal";
import BackButton from "../../components/BackButton";
import UploadDropzone from "../../components/ui/UploadDropzone";

export default function AdminFacultyParticipation() {
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
    // Journal Publications specific fields
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
  const [showSuccess, setShowSuccess] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <BackButton />
      <SuccessModal
        open={showSuccess}
        title="Saved successfully"
        subtitle="Faculty participation has been added."
        onClose={() => setShowSuccess(false)}
      />
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Admin: Faculty Participation
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Create participation entries on behalf of faculty.
      </p>
      {message && (
        <div className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-slate-800 dark:text-slate-200">
          {message}
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
              <input
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
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.department}
                onChange={update("department")}
                required
              >
                <option value="">Select Department</option>
                <option value="B.Tech Information Technology">
                  B.Tech Information Technology
                </option>
                <option value="B.Tech Artificial Intelligence and Data Science">
                  B.Tech Artificial Intelligence and Data Science
                </option>
              </select>
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
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.type_of_event}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    type_of_event: v,
                    publications_type:
                      v === "Others" ? f.publications_type : "",
                  }));
                }}
                required
              >
                <option value="">Select Type</option>
                <option value="FDP">FDP</option>
                <option value="Webinar">Webinar</option>
                <option value="Seminar">Seminar</option>
                <option value="Online Certification">
                  Online Certification
                </option>
                <option value="NPTEL Online Certification">
                  NPTEL Online Certification
                </option>
                <option value="NPTEL - FDP">NPTEL - FDP</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="STTP">STTP</option>
                <option value="Professional Development Course">
                  Professional Development Course
                </option>
                <option value="Others">Others</option>
              </select>
            </div>
            {form.type_of_event === "Others" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Publications <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={form.publications_type}
                  onChange={update("publications_type")}
                  required
                >
                  <option value="">Select Publication Type</option>
                  <option value="Journal Publications">
                    Journal Publications
                  </option>
                  <option value="Conference Publications">
                    Conference Publications
                  </option>
                </select>
              </div>
            )}
            {form.type_of_event === "Others" &&
              form.publications_type === "Journal Publications" && (
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
                        Scopus Journal / Scopus Book chapter / Web of Science
                        (SCI / ESCI)
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.publication_indexing}
                        onChange={update("publication_indexing")}
                      >
                        <option value="">Select</option>
                        <option value="Scopus Journal">Scopus Journal</option>
                        <option value="Scopus Book chapter">
                          Scopus Book chapter
                        </option>
                        <option value="Web of Science (SCI)">
                          Web of Science (SCI)
                        </option>
                        <option value="Web of Science (ESCI)">
                          Web of Science (ESCI)
                        </option>
                      </select>
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
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.indexed_in_db}
                        onChange={update("indexed_in_db")}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
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
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.joint_publication_with}
                        onChange={update("joint_publication_with")}
                      >
                        <option value="">Select</option>
                        <option value="Industry">Industry</option>
                        <option value="Top 100 NIRF">Top 100 NIRF</option>
                        <option value="Central Govt">Central Govt</option>
                        <option value="International University">
                          International University
                        </option>
                      </select>
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
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.coauthors_students}
                        onChange={update("coauthors_students")}
                      >
                        <option value="">No</option>
                        <option value="IT">IT</option>
                        <option value="ADS">ADS</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            {form.type_of_event === "Others" &&
              form.publications_type === "Conference Publications" && (
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
                        Scopus Journal / Scopus Book chapter / Web of Science
                        (SCI / ESCI)
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.publication_indexing}
                        onChange={update("publication_indexing")}
                      >
                        <option value="">Select</option>
                        <option value="Scopus Journal">Scopus Journal</option>
                        <option value="Scopus Book chapter">
                          Scopus Book chapter
                        </option>
                        <option value="Web of Science (SCI)">
                          Web of Science (SCI)
                        </option>
                        <option value="Web of Science (ESCI)">
                          Web of Science (ESCI)
                        </option>
                      </select>
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
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.indexed_in_db}
                        onChange={update("indexed_in_db")}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
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
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.joint_publication_with}
                        onChange={update("joint_publication_with")}
                      >
                        <option value="">Select</option>
                        <option value="Industry">Industry</option>
                        <option value="Top 100 NIRF">Top 100 NIRF</option>
                        <option value="Central Govt">Central Govt</option>
                        <option value="International University">
                          International University
                        </option>
                      </select>
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
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        value={form.coauthors_students}
                        onChange={update("coauthors_students")}
                      >
                        <option value="">No</option>
                        <option value="IT">IT</option>
                        <option value="ADS">ADS</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mode of Training <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={form.mode_of_training}
                onChange={update("mode_of_training")}
                required
              >
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
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
            subtitle="PDF or image"
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
