// src/validators/facultySchemas.js
import Joi from "joi";

const short = Joi.string().max(200).trim();
const long = Joi.string().max(2000).trim();
const dateStr = Joi.string().max(50).trim();
const url = Joi.string().uri().max(500).trim();

// ── Faculty Participation ────────────────────────────────────────────────────

export const createFacultyParticipationSchema = Joi.object({
  faculty_name: short.required(),
  department: short.required(),
  type_of_event: short.required(),
  mode_of_training: short.required(),
  title: short.required(),
  start_date: dateStr.required(),
  publications_type: short,
  end_date: dateStr,
  conducted_by: short,
  details: long,
  claiming_faculty_name: short,
  publication_indexing: short,
  authors_list: Joi.string().max(1000).trim(),
  paper_title: short,
  journal_name: short,
  volume_no: short,
  issue_no: short,
  page_or_doi: short,
  issn_or_isbn: short,
  pub_month_year: short,
  citations_count: Joi.number().integer().min(0),
  paper_url: url,
  journal_home_url: url,
  publisher: short,
  impact_factor: Joi.number().min(0),
  indexed_in_db: short,
  full_paper_drive_link: url,
  first_page_drive_link: url,
  sdg_mapping: short,
  joint_publication_with: short,
  publication_domain: short,
  coauthors_students: Joi.string().max(500).trim(),
  academic_year: short,
});

export const updateFacultyParticipationSchema =
  createFacultyParticipationSchema.fork(
    ["faculty_name", "department", "type_of_event", "mode_of_training", "title", "start_date"],
    (f) => f.optional(),
  );

// ── Faculty Research ─────────────────────────────────────────────────────────

export const createResearchSchema = Joi.object({
  faculty_name: short,
  funded_type: short.required(),
  principal_investigator: short.required(),
  team_members: Joi.string().max(1000).trim(),
  team_member_names: Joi.string().max(1000).trim(),
  title: short.required(),
  agency: short,
  current_status: short.required(),
  duration: short,
  start_date: dateStr,
  end_date: dateStr,
  amount: Joi.number().min(0),
});

export const updateResearchSchema = createResearchSchema.fork(
  ["funded_type", "principal_investigator", "title", "current_status"],
  (f) => f.optional(),
);

// ── Faculty Consultancy ──────────────────────────────────────────────────────

export const createConsultancySchema = Joi.object({
  faculty_name: short,
  team_members: Joi.string().max(1000).trim(),
  agency: short.required(),
  amount: Joi.number().min(0),
  duration: short,
  start_date: dateStr,
  end_date: dateStr,
});

export const updateConsultancySchema = createConsultancySchema.fork(
  ["agency"],
  (f) => f.optional(),
);
