/**
 * adminDeletion.test.js  — PR: feat/admin-deletion-ui-api
 *
 * Unit tests for the admin-only deletion feature.
 * Intentionally separated from the session / auth PR so both changes can
 * be reviewed independently.
 *
 * Coverage:
 *  1. RBAC role guard  — requireRole(["admin"]) allows admin, denies others
 *  2. Per-resource delete handler behaviour (happy path + error path)
 *     tested against a mock DB client so no real database is required here.
 *
 * See also: deleteRoutesIntegration.test.js for the composed-route acceptance
 * criterion that verifies the full middleware stack against the checked-in
 * migrations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import fs from "fs";
import { deleteEvent } from "../controllers/eventController.js";
import { deleteProject } from "../controllers/projectController.js";
import { deleteAchievement } from "../controllers/achievementController.js";
import { deleteConsultancy } from "../controllers/facultyConsultancyController.js";
import { deleteFacultyParticipation } from "../controllers/facultyParticipationController.js";
import { deleteResearch } from "../controllers/facultyResearchController.js";
import { requireRole } from "../middleware/roleAuth.js";
import pool from "../config/db.js";

describe("Admin Deletion Feature — Unit Tests", () => {
  let mockClient;
  let mockRes;
  let unlinkSpy;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    };

    vi.spyOn(pool, "connect").mockResolvedValue(mockClient);
    unlinkSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. RBAC role guard
  // -------------------------------------------------------------------------
  describe("requireRole(['admin']) guard", () => {
    const adminOnly = requireRole(["admin"]);

    it("passes admin through to next()", () => {
      const req = { user: { id: 1, role: "admin" } };
      const next = vi.fn();
      adminOnly(req, mockRes, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("rejects student with 403", () => {
      const req = { user: { id: 2, role: "student" } };
      const next = vi.fn();
      adminOnly(req, mockRes, next);
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Access denied" });
    });

    it("rejects staff with 403", () => {
      const req = { user: { id: 3, role: "staff" } };
      const next = vi.fn();
      adminOnly(req, mockRes, next);
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it("rejects unauthenticated request (no user) with 401", () => {
      const req = { user: null };
      const next = vi.fn();
      adminOnly(req, mockRes, next);
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  // -------------------------------------------------------------------------
  // 2. deleteEvent handler
  // -------------------------------------------------------------------------
  describe("deleteEvent handler", () => {
    it("returns 400 for non-numeric id without touching the pool", async () => {
      const req = { params: { id: "abc" }, user: { id: 1, role: "admin" } };
      await deleteEvent(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("returns 404 and releases client when event is not found", async () => {
      const req = { params: { id: "999" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteEvent(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Event not found" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes event, unlinks files, and releases client exactly once on success", async () => {
      const req = { params: { id: "10" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 10,
              thumbnail_filename: "thumb-10.jpg",
              attachments: JSON.stringify([{ filename: "doc-10.pdf" }]),
            },
          ],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE achievements SET event_id = NULL
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE FROM events
        .mockResolvedValueOnce({}); // COMMIT

      await deleteEvent(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Event deleted" });
      expect(unlinkSpy).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("rolls back on DB error and releases client exactly once", async () => {
      const req = { params: { id: "10" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 10, thumbnail_filename: null, attachments: null }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("DB Deadlock"));

      await deleteEvent(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const queries = mockClient.query.mock.calls.map((c) => String(c[0]));
      expect(queries).toContain("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. deleteProject handler
  // -------------------------------------------------------------------------
  describe("deleteProject handler", () => {
    it("returns 400 for non-numeric id without touching the pool", async () => {
      const req = { params: { id: "invalid_id" }, user: { id: 1, role: "admin" } };
      await deleteProject(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("returns 404 and releases client when project is not found", async () => {
      const req = { params: { id: "404" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteProject(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes project, unlinks files, and releases client exactly once on success", async () => {
      const req = { params: { id: "1" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1, files: JSON.stringify([{ filename: "spec.pdf" }]) }] })
        .mockResolvedValueOnce({ rows: [{ filename: "proj_code.zip" }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE project_files
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE projects
        .mockResolvedValueOnce({}); // COMMIT

      await deleteProject(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Project deleted successfully" });
      expect(unlinkSpy).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("rolls back on DB failure and releases client exactly once", async () => {
      const req = { params: { id: "1" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1, files: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("Constraint violation"));

      await deleteProject(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const queries = mockClient.query.mock.calls.map((c) => String(c[0]));
      expect(queries).toContain("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 4. deleteAchievement handler
  // -------------------------------------------------------------------------
  describe("deleteAchievement handler", () => {
    it("returns 400 for non-numeric id", async () => {
      const req = { params: { id: "xyz" }, user: { id: 1, role: "admin" } };
      await deleteAchievement(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("returns 404 and releases client when record is not found", async () => {
      const req = { params: { id: "50" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteAchievement(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes achievement and releases client exactly once on success", async () => {
      const req = { params: { id: "5" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 5, proof_file_id: null, certificate_file_id: null }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE achievements
        .mockResolvedValueOnce({}); // COMMIT

      await deleteAchievement(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Achievement deleted successfully" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("rolls back and releases client exactly once on error", async () => {
      const req = { params: { id: "5" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 5, proof_file_id: null, certificate_file_id: null }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("DB error"));

      await deleteAchievement(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. deleteConsultancy handler
  // -------------------------------------------------------------------------
  describe("deleteConsultancy handler", () => {
    it("returns 400 for non-numeric id", async () => {
      const req = { params: { id: "invalid" }, user: { id: 1, role: "admin" } };
      await deleteConsultancy(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("returns 404 and releases client when record is not found", async () => {
      const req = { params: { id: "77" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteConsultancy(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes consultancy and releases client exactly once on success", async () => {
      const req = { params: { id: "7" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 7, proof_file_id: null }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE faculty_consultancy
        .mockResolvedValueOnce({}); // COMMIT

      await deleteConsultancy(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Deleted successfully" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 6. deleteFacultyParticipation handler
  // -------------------------------------------------------------------------
  describe("deleteFacultyParticipation handler", () => {
    it("returns 400 for non-numeric id", async () => {
      const req = { params: { id: "nan" }, user: { id: 1, role: "admin" } };
      await deleteFacultyParticipation(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("returns 404 and releases client when record is not found", async () => {
      const req = { params: { id: "88" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteFacultyParticipation(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes participation and releases client exactly once on success", async () => {
      const req = { params: { id: "8" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 8, proof_file_id: null }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE faculty_participations
        .mockResolvedValueOnce({}); // COMMIT

      await deleteFacultyParticipation(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Deleted successfully" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 7. deleteResearch handler
  // -------------------------------------------------------------------------
  describe("deleteResearch handler", () => {
    it("returns 400 for non-numeric id", async () => {
      const req = { params: { id: "null" }, user: { id: 1, role: "admin" } };
      await deleteResearch(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("returns 404 and releases client when record is not found", async () => {
      const req = { params: { id: "99" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteResearch(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes research and releases client exactly once on success", async () => {
      const req = { params: { id: "9" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 9, proof_file_id: null }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE faculty_research
        .mockResolvedValueOnce({}); // COMMIT

      await deleteResearch(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Deleted successfully" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });
});
