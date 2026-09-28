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

describe("Destructive Routes & Single Pool Release Comprehensive Test Suite", () => {
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

  describe("RBAC Role Guard for Delete Endpoints", () => {
    const adminOnlyMiddleware = requireRole(["admin"]);

    it("allows admin user to proceed to delete handler", () => {
      const req = { user: { id: 1, role: "admin" } };
      const next = vi.fn();
      adminOnlyMiddleware(req, mockRes, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("denies student user with 403 Forbidden", () => {
      const req = { user: { id: 2, role: "student" } };
      const next = vi.fn();
      adminOnlyMiddleware(req, mockRes, next);
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Access denied" });
    });

    it("denies staff user with 403 Forbidden", () => {
      const req = { user: { id: 3, role: "staff" } };
      const next = vi.fn();
      adminOnlyMiddleware(req, mockRes, next);
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it("denies unauthenticated request missing role with 401", () => {
      const req = { user: null };
      const next = vi.fn();
      adminOnlyMiddleware(req, mockRes, next);
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("deleteEvent handler", () => {
    it("returns 400 for invalid id without connecting to DB pool", async () => {
      const req = { params: { id: "abc" }, user: { id: 1, role: "admin" } };
      await deleteEvent(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "999" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteEvent(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Event not found" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("deletes event successfully, unlinks files, and releases client exactly once", async () => {
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

    it("rolls back transaction and releases client exactly once on DB error", async () => {
      const req = { params: { id: "10" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 10, thumbnail_filename: null, attachments: null }],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("DB Deadlock")); // Query fails

      await deleteEvent(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const queries = mockClient.query.mock.calls.map((c) => String(c[0]));
      expect(queries).toContain("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteProject handler", () => {
    it("returns 400 for invalid id without connecting to DB pool", async () => {
      const req = { params: { id: "invalid_id" }, user: { id: 1, role: "admin" } };
      await deleteProject(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("releases client exactly once on 404 Not Found", async () => {
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

    it("rolls back transaction and releases client exactly once on DB failure", async () => {
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

  describe("deleteAchievement handler", () => {
    it("returns 400 for invalid id", async () => {
      const req = { params: { id: "xyz" }, user: { id: 1, role: "admin" } };
      await deleteAchievement(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "50" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteAchievement(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("releases client exactly once on successful deletion", async () => {
      const req = { params: { id: "5" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 5, proof_file_id: null, certificate_file_id: null }],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE achievements
        .mockResolvedValueOnce({}); // COMMIT

      await deleteAchievement(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Achievement deleted successfully",
      });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("rolls back and releases client exactly once on error", async () => {
      const req = { params: { id: "5" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 5, proof_file_id: null, certificate_file_id: null }],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("DB error"));

      await deleteAchievement(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteConsultancy handler", () => {
    it("returns 400 for invalid id", async () => {
      const req = { params: { id: "invalid" }, user: { id: 1, role: "admin" } };
      await deleteConsultancy(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "77" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteConsultancy(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("releases client exactly once on successful deletion", async () => {
      const req = { params: { id: "7" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 7, proof_file_id: null }],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE faculty_consultancy
        .mockResolvedValueOnce({}); // COMMIT

      await deleteConsultancy(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Deleted successfully",
      });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteFacultyParticipation handler", () => {
    it("returns 400 for invalid id", async () => {
      const req = { params: { id: "nan" }, user: { id: 1, role: "admin" } };
      await deleteFacultyParticipation(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "88" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteFacultyParticipation(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("releases client exactly once on successful deletion", async () => {
      const req = { params: { id: "8" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 8, proof_file_id: null }],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE faculty_participations
        .mockResolvedValueOnce({}); // COMMIT

      await deleteFacultyParticipation(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Deleted successfully",
      });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteResearch handler", () => {
    it("returns 400 for invalid id", async () => {
      const req = { params: { id: "null" }, user: { id: 1, role: "admin" } };
      await deleteResearch(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "99" }, user: { id: 1, role: "admin" } };
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteResearch(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("releases client exactly once on successful deletion", async () => {
      const req = { params: { id: "9" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 9, proof_file_id: null }],
        })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE faculty_research
        .mockResolvedValueOnce({}); // COMMIT

      await deleteResearch(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Deleted successfully",
      });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });
});
