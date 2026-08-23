import pool from "../config/db.js";
import logger, { reqContext } from "../utils/logger.js";
import { tracedQuery } from "../utils/tracing.js";
import { LRUCache } from "lru-cache";

// Cache for public records to mitigate DB CPU spikes (Cache Stampede)
const publicRecordCache = new LRUCache({
  max: 500, // Maximum records to hold
  ttl: 1000 * 60 * 5, // 5 minute TTL
});

export const getPublicRecord = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // FAANG Refactor: Remove Number() casting. PostgreSQL parameterized queries 
    // safely handle large BIGINT values passed as strings.
    const recordId = String(id).trim();

    if (!recordId || !/^\d+$/.test(recordId)) {
      return res.status(400).json({ message: "Invalid record ID format" });
    }

    const cacheKey = `${type}:${recordId}`;
    const cachedData = publicRecordCache.get(cacheKey);
    if (cachedData) {
      logger.info("Serving public record from cache", { type, recordId });
      return res.json({ data: cachedData });
    }

    let query = "";
    let values = [recordId];

    switch (type) {
      case "research":
        query = `
          SELECT fr.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
          FROM faculty_research fr
          LEFT JOIN project_files pf ON fr.proof_file_id = pf.id
          WHERE fr.id = $1
        `;
        break;
      case "participation":
        query = `
          SELECT fp.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
          FROM faculty_participations fp
          LEFT JOIN project_files pf ON fp.proof_file_id = pf.id
          WHERE fp.id = $1
        `;
        break;
      case "consultancy":
        query = `
          SELECT fc.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name
          FROM faculty_consultancy fc
          LEFT JOIN project_files pf ON fc.proof_file_id = pf.id
          WHERE fc.id = $1
        `;
        break;
      case "achievement":
        query = `
          SELECT a.*, pf.filename AS proof_filename, pf.original_name AS proof_original_name,
                 c.filename AS certificate_filename, ep.filename AS event_photo_filename
          FROM achievements a
          LEFT JOIN project_files pf ON a.proof_file_id = pf.id
          LEFT JOIN project_files c ON a.certificate_file_id = c.id
          LEFT JOIN project_files ep ON a.event_photos_file_id = ep.id
          WHERE a.id = $1
        `;
        break;
      default:
        return res.status(400).json({ message: "Invalid record type" });
    }

    const { rows } = await tracedQuery(pool, query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Populate cache before returning
    publicRecordCache.set(cacheKey, rows[0]);

    return res.json({ data: rows[0] });
  } catch (err) {
    logger.error("Public record controller error", { err, ...reqContext(req) });
    return res.status(500).json({ message: "Server error" });
  }
};
