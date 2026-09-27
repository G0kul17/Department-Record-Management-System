import { describe, it, expect, beforeEach, vi } from "vitest";
import { deleteEvent } from "../controllers/eventController.js";
import { deleteProject } from "../controllers/projectController.js";
import { deleteAchievement } from "../controllers/achievementController.js";
import { deleteConsultancy } from "../controllers/facultyConsultancyController.js";
import { deleteFacultyParticipation } from "../controllers/facultyParticipationController.js";
import { deleteResearch } from "../controllers/facultyResearchController.js";
import pool from "../config/db.js";

describe("Delete Handlers & Single Pool Release Regression Suite", () => {
  let mockClient;
  let mockRes;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    vi.spyOn(pool, "connect").mockResolvedValue(mockClient);

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("deleteEvent handler", () => {
    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "999" }, user: { id: 1, role: "admin" } };

      // Query for event returns no rows
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteEvent(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Event not found" });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("does not query non-existent event_registrations in transaction and deletes event successfully", async () => {
      const req = { params: { id: "10" }, user: { id: 1, role: "admin" } };

      // Initial SELECT event
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
        // BEGIN
        .mockResolvedValueOnce({})
        // UPDATE achievements SET event_id = NULL
        .mockResolvedValueOnce({ rowCount: 1 })
        // DELETE FROM events
        .mockResolvedValueOnce({ rowCount: 1 })
        // COMMIT
        .mockResolvedValueOnce({});

      await deleteEvent(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Event deleted" });

      // Verify queries sent to DB
      const queries = mockClient.query.mock.calls.map((c) => String(c[0]));
      expect(queries).toContain("BEGIN");
      expect(queries).toContain("COMMIT");

      // CRITICAL: Ensure event_registrations is NOT queried inside the transaction
      const touchesEventRegistrations = queries.some((q) =>
        q.toLowerCase().includes("event_registrations")
      );
      expect(touchesEventRegistrations).toBe(false);

      // Verify client is released exactly once
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("returns 400 for invalid id without connecting to DB pool", async () => {
      const req = { params: { id: "abc" }, user: { id: 1, role: "admin" } };

      await deleteEvent(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(pool.connect).not.toHaveBeenCalled();
    });
  });

  describe("deleteProject handler", () => {
    it("releases client exactly once on 404 Not Found", async () => {
      const req = { params: { id: "404" }, user: { id: 1, role: "admin" } };

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await deleteProject(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("releases client exactly once on successful deletion", async () => {
      const req = { params: { id: "1" }, user: { id: 1, role: "admin" } };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 1, files: null }] }) // SELECT project
        .mockResolvedValueOnce({ rows: [] }) // SELECT project_files
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0 }) // DELETE project_files
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE projects
        .mockResolvedValueOnce({}); // COMMIT

      await deleteProject(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Project deleted successfully",
      });
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteAchievement handler", () => {
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
  });

  describe("deleteConsultancy handler", () => {
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
