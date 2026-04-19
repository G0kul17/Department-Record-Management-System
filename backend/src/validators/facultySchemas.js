// src/validators/facultySchemas.js
import Joi from "joi";

const short = Joi.string().max(200).trim();
const long = Joi.string().max(2000).trim();
const dateStr = Joi.string().max(50).trim();
const url = Joi.string().uri().max(500).trim();
const optShort = Joi.string().max(200).trim().empty("");
const optLong = Joi.string().max(2000).trim().empty("");
const optDateStr = Joi.string().max(50).trim().empty("");
const optUrl = Joi.string().uri().max(500).trim().empty("");
const optNumber = Joi.number().min(0).empty("");

// ── Faculty Participation ────────────────────────────────────────────────────

export const createFacultyParticipationSchema = Joi.object({
  faculty_name: short.required(),
  department: short.required(),
  type_of_event: short.required(),
  mode_of_training: short.required(),
  title: short.required(),
  start_date: dateStr.required(),
  publications_type: optShort,
  end_date: optDateStr,
  conducted_by: optShort,
  details: optLong,
  claiming_faculty_name: optShort,
  publication_indexing: optShort,
  authors_list: Joi.string().max(1000).trim().empty(""),
  paper_title: optShort,
  journal_name: optShort,
  volume_no: optShort,
  issue_no: optShort,
  page_or_doi: optShort,
  issn_or_isbn: optShort,
  pub_month_year: optShort,
  citations_count: Joi.number().integer().min(0).empty(""),
  paper_url: optUrl,
  journal_home_url: optUrl,
  publisher: optShort,
  impact_factor: Joi.number().min(0).empty(""),
  indexed_in_db: optShort,
  full_paper_drive_link: optUrl,
  first_page_drive_link: optUrl,
  sdg_mapping: optShort,
  joint_publication_with: optShort,
  publication_domain: optShort,
  coauthors_students: Joi.string().max(500).trim().empty(""),
  academic_year: optShort,
});

export const updateFacultyParticipationSchema =
  createFacultyParticipationSchema.fork(
    ["faculty_name", "department", "type_of_event", "mode_of_training", "title", "start_date"],
    (f) => f.optional(),
  );

// ── Faculty Research ─────────────────────────────────────────────────────────

export const createResearchSchema = Joi.object({
  faculty_name: optShort,
  funded_type: short.required(),
  principal_investigator: short.required(),
  team_members: Joi.string().max(1000).trim().empty(""),
  team_member_names: Joi.string().max(1000).trim().empty(""),
  title: short.required(),
  agency: optShort,
  current_status: short.required(),
  duration: optShort,
  start_date: optDateStr,
  end_date: optDateStr,
  amount: optNumber,
});

export const updateResearchSchema = createResearchSchema.fork(
  ["funded_type", "principal_investigator", "title", "current_status"],
  (f) => f.optional(),
);

// ── Faculty Consultancy ──────────────────────────────────────────────────────

export const createConsultancySchema = Joi.object({
  faculty_name: optShort,
  team_members: Joi.string().max(1000).trim().empty(""),
  agency: short.required(),
  amount: optNumber,
  duration: optShort,
  start_date: optDateStr,
  end_date: optDateStr,
});

export const updateConsultancySchema = createConsultancySchema.fork(
  ["agency"],
  (f) => f.optional(),
);
