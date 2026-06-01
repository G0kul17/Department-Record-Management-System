import ExcelJS from "exceljs";
import pool from "../config/db.js";
import logger, { reqContext } from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";

/* =====================================================
   Bulk Data Export Controller
   KAN-25: export files are streamed directly to the
   authenticated response and never written to disk.
   KAN-9:  streaming ExcelJS writer + paginated DB
   fetches keep memory bounded on large datasets.
   password_hash is never selected.
===================================================== */

const BATCH = 1000;

/**
 * Fetches rows from `sql` in pages of BATCH and calls `onRow` for each.
 * `sql` must not already contain LIMIT/OFFSET.
 * `params` are the bind parameters already present in `sql`.
 */
async function streamRows(sql, params, onRow) {
  let offset = 0;
  while (true) {
    const { rows } = await tracedQuery(pool, 
      `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, BATCH, offset],
    );
    for (const row of rows) await onRow(row);
    if (rows.length < BATCH) break;
    offset += BATCH;
  }
}

async function relationExists(relationName) {
  const { rows } = await tracedQuery(pool, `SELECT to_regclass($1) IS NOT NULL AS exists`, [relationName]);
  return Boolean(rows[0]?.exists);
}

async function getColumnSet(tableName) {
  const { rows } = await tracedQuery(
    pool,
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1`,
    [tableName],
  );

  return new Set(rows.map((row) => row.column_name));
}

async function exportSheet(workbook, sheetName, columns, exportRows, context = {}) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;

  try {
    await exportRows(sheet);
  } catch (error) {
    logger.error("Bulk export sheet failed", {
      sheetName,
      err: error,
      ...context,
    });
  } finally {
    await sheet.commit();
  }
}

export const bulkDataExport = async (req, res) => {
  const fileName = `department_backup_${Date.now()}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  // Streaming writer — rows are flushed to the HTTP response as they are
  // committed; the entire workbook is never held in memory at once.
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });

  try {
    const hasActivityTypes = await relationExists("activity_types");
    const projectColumns = await getColumnSet("projects");
    const achievementColumns = await getColumnSet("achievements");

    /* ================= USERS ================= */
    // password_hash is intentionally omitted.
    await exportSheet(workbook, "Users", [
      { header: "ID",                    key: "id" },
      { header: "Email",                 key: "email" },
      { header: "Role",                  key: "role" },
      { header: "Verified",              key: "is_verified" },
      { header: "Created At",            key: "created_at" },
      { header: "Profile Details (JSON)", key: "profile_details" },
    ], async (usersSheet) => {
      await streamRows(
        `SELECT id, email, role, is_verified, created_at, profile_details
           FROM users
          ORDER BY id`,
        [],
        (row) => usersSheet.addRow({ ...row, profile_details: JSON.stringify(row.profile_details) }).commit(),
      );
    }, { ...reqContext(req) });

    /* ================= PROJECTS ================= */
    {
      const projectHasActivityTypeId = projectColumns.has("activity_type_id");
      const projectHasLegacyActivityType = projectColumns.has("activity_type");
      const activityTypeSelect = hasActivityTypes && projectHasActivityTypeId
        ? "at.name AS activity_type"
        : projectHasLegacyActivityType
          ? "p.activity_type AS activity_type"
          : projectHasActivityTypeId
            ? "p.activity_type_id::text AS activity_type"
            : "NULL::text AS activity_type";
      const projectSelectFields = [
        "p.id",
        "p.title",
        "p.description",
        "p.team",
        "p.team_members_count",
        "p.team_member_names",
        "p.github_url",
        "p.mentor_name",
        "p.academic_year",
        activityTypeSelect,
        "p.status",
        "p.verified",
        "p.verification_status",
        "p.verification_comment",
        "p.verified_by",
        "p.verified_at",
        "p.created_by",
        "p.created_at",
      ];
      const projectFromClause = hasActivityTypes && projectHasActivityTypeId
        ? "FROM projects p LEFT JOIN activity_types at ON at.id = p.activity_type_id"
        : "FROM projects p";

      await exportSheet(workbook, "Projects", [
        "id","title","description","team","team_members_count","team_member_names",
        "github_url","mentor_name","academic_year","activity_type","status",
        "verified","verification_status","verification_comment","verified_by",
        "verified_at","created_by","created_at",
      ].map((k) => ({ header: k, key: k })), async (projectsSheet) => {
        await streamRows(
          `SELECT ${projectSelectFields.join(", ")}
             ${projectFromClause}
            ORDER BY p.id`,
          [],
          (row) => projectsSheet.addRow({
            ...row,
            team: Array.isArray(row.team) ? row.team.join(", ") : row.team,
          }).commit(),
        );
      }, { ...reqContext(req) });
    }

    /* ================= ACHIEVEMENTS ================= */
    {
      const achievementHasActivityTypeId = achievementColumns.has("activity_type_id");
      const achievementHasLegacyActivityType = achievementColumns.has("activity_type");
      const activityTypeSelect = hasActivityTypes && achievementHasActivityTypeId
        ? "at.name AS activity_type"
        : achievementHasLegacyActivityType
          ? "a.activity_type AS activity_type"
          : achievementHasActivityTypeId
            ? "a.activity_type_id::text AS activity_type"
            : "NULL::text AS activity_type";
      const achievementSelectFields = [
        "a.id",
        "a.user_id",
        "a.event_id",
        "a.title",
        "a.name",
        "a.date",
        "a.date_of_award",
        "a.event_name",
        activityTypeSelect,
        "a.issuer",
        "a.position",
        "a.prize_amount",
        "a.academic_year",
        "a.proof_file_id",
        "a.certificate_file_id",
        "a.event_photos_file_id",
        "a.verified",
        "a.verification_status",
        "a.verification_comment",
        "a.verified_by",
        "a.verified_at",
        "a.created_at",
      ];
      const achievementFromClause = hasActivityTypes && achievementHasActivityTypeId
        ? "FROM achievements a LEFT JOIN activity_types at ON at.id = a.activity_type_id"
        : "FROM achievements a";

      await exportSheet(workbook, "Achievements", [
        "id","user_id","event_id","title","name","date","date_of_award","event_name",
        "activity_type","issuer","position","prize_amount","academic_year",
        "proof_file_id","certificate_file_id","event_photos_file_id","verified",
        "verification_status","verification_comment","verified_by","verified_at","created_at",
      ].map((k) => ({ header: k, key: k })), async (achievementsSheet) => {
        await streamRows(
          `SELECT ${achievementSelectFields.join(", ")}
             ${achievementFromClause}
            ORDER BY a.id`,
          [],
          (row) => achievementsSheet.addRow(row).commit(),
        );
      }, { ...reqContext(req) });
    }

    /* ================= FACULTY PARTICIPATION ================= */
    await exportSheet(workbook, "Faculty_Participation", [
      "id","faculty_name","department","type_of_event","mode_of_training","title",
      "start_date","end_date","conducted_by","details","publications_type",
      "claiming_faculty_name","publication_indexing","authors_list","paper_title",
      "journal_name","volume_no","issue_no","page_or_doi","issn_or_isbn",
      "pub_month_year","citations_count","paper_url","journal_home_url",
      "publisher","impact_factor","indexed_in_db","full_paper_drive_link",
      "first_page_drive_link","sdg_mapping","joint_publication_with",
      "publication_domain","coauthors_students","proof_file_id","created_by",
      "created_at","updated_at",
    ].map((k) => ({ header: k, key: k })), async (participationSheet) => {
      await streamRows(
        `SELECT id, faculty_name, department, type_of_event, mode_of_training, title,
                start_date, end_date, conducted_by, details, publications_type,
                claiming_faculty_name, publication_indexing, authors_list, paper_title,
                journal_name, volume_no, issue_no, page_or_doi, issn_or_isbn,
                pub_month_year, citations_count, paper_url, journal_home_url,
                publisher, impact_factor, indexed_in_db, full_paper_drive_link,
                first_page_drive_link, sdg_mapping, joint_publication_with,
                publication_domain, coauthors_students, proof_file_id, created_by,
                created_at, updated_at
           FROM faculty_participations
          ORDER BY id`,
        [],
        (row) => participationSheet.addRow(row).commit(),
      );
    }, { ...reqContext(req) });

    /* ================= FACULTY RESEARCH ================= */
    await exportSheet(workbook, "Faculty_Research", [
      "id","faculty_name","funded_type","principal_investigator","team_members",
      "title","agency","current_status","duration","start_date","end_date","amount",
      "proof_file_id","created_by","created_at","updated_at",
    ].map((k) => ({ header: k, key: k })), async (researchSheet) => {
      await streamRows(
        `SELECT id, faculty_name, funded_type, principal_investigator, team_members,
                title, agency, current_status, duration, start_date, end_date, amount,
                proof_file_id, created_by, created_at, updated_at
           FROM faculty_research
          ORDER BY id`,
        [],
        (row) => researchSheet.addRow(row).commit(),
      );
    }, { ...reqContext(req) });

    /* ================= FACULTY CONSULTANCY ================= */
    await exportSheet(workbook, "Faculty_Consultancy", [
      "id","faculty_name","team_members","agency","amount","duration",
      "start_date","end_date","proof_file_id","created_by","created_at","updated_at",
    ].map((k) => ({ header: k, key: k })), async (consultancySheet) => {
      await streamRows(
        `SELECT id, faculty_name, team_members, agency, amount, duration,
                start_date, end_date, proof_file_id, created_by, created_at, updated_at
           FROM faculty_consultancy
          ORDER BY id`,
        [],
        (row) => consultancySheet.addRow(row).commit(),
      );
    }, { ...reqContext(req) });

    /* ================= EVENTS ================= */
    await exportSheet(workbook, "Events", [
      "id","title","description","venue","event_url","start_date","end_date",
      "organizer_id","thumbnail_filename","thumbnail_original_name",
      "thumbnail_mime","thumbnail_size","created_at","updated_at",
    ].map((k) => ({ header: k, key: k })), async (eventsSheet) => {
      await streamRows(
        `SELECT id, title, description, venue, event_url, start_date, end_date,
                organizer_id, thumbnail_filename, thumbnail_original_name,
                thumbnail_mime, thumbnail_size, created_at, updated_at
           FROM events
          ORDER BY id`,
        [],
        (row) => eventsSheet.addRow(row).commit(),
      );
    }, { ...reqContext(req) });

    /* ================= STAFF UPLOADS (optional table) ================= */
    try {
      const staffUploadTables = ["staff_uploads_with_document", "staff_uploads"];
      let staffUploadTable = null;
      let staffUploadSample = [];

      for (const candidate of staffUploadTables) {
        try {
          const { rows: sample } = await tracedQuery(pool, `SELECT * FROM ${candidate} LIMIT 1`);
          staffUploadTable = candidate;
          staffUploadSample = sample;
          break;
        } catch {
          // Try the next known variant.
        }
      }

      if (staffUploadTable && staffUploadSample.length > 0) {
        await exportSheet(workbook, "Staff_Uploads", [
          ...Object.keys(staffUploadSample[0]).map((k) => ({ header: k, key: k })),
        ], async (staffUploadsSheet) => {
          await streamRows(
            `SELECT * FROM ${staffUploadTable} ORDER BY id`,
            [],
            (row) => staffUploadsSheet.addRow({
              ...row,
              documents: row.documents != null ? JSON.stringify(row.documents) : null,
            }).commit(),
          );
        }, { ...reqContext(req) });
      } else {
        await exportSheet(workbook, "Staff_Uploads", [
          { header: "message", key: "message" },
        ], async (staffUploadsSheet) => {
          staffUploadsSheet.addRow({
            message: staffUploadTable ? "No staff uploads data" : "Staff uploads table not available",
          }).commit();
        }, { ...reqContext(req) });
      }
    } catch (error) {
      logger.debug("staff uploads export skipped", { err: error, ...reqContext(req) });
    }

    await workbook.commit();
  } catch (error) {
    logger.error("Bulk export failed", { err: error,
      ...reqContext(req) });
    // Headers already sent via stream — can't send a JSON error response
    if (!res.headersSent) {
      res.status(500).json({ message: "Bulk export failed" });
    } else {
      res.destroy();
    }
  }
};

/* =====================================================
   List Exported Files
   KAN-25: exports are no longer persisted to disk, so
   there are no files to list. Returns an empty array
   for backward compatibility with existing clients.
===================================================== */
export const listBulkExports = async (req, res) => {
  res.json({ files: [] });
};
