/**
 * projectFileAuth.test.js
 *
 * Unit tests for P0-1: project file upload ownership check.
 * Verifies the authorization logic (student vs own/other project, staff/admin) in isolation.
 */

import { describe, it, expect } from "vitest";

// Extracted authorization logic from uploadFilesToProject in projectController.js.
// Any change to that condition must be reflected here.
function checkProjectFileUploadAuth(requesterRole, requesterId, projectOwnerId) {
  if (requesterRole === "student" && requesterId !== projectOwnerId) {
    return { allowed: false, status: 403, message: "Forbidden: you can only upload files to your own projects" };
  }
  return { allowed: true };
}

describe("P0-1: Project file upload ownership check", () => {
  describe("student requester", () => {
    it("DENY: student uploads to another student's project", () => {
      const result = checkProjectFileUploadAuth("student", 42, 99);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(403);
    });

    it("ALLOW: student uploads to their own project", () => {
      const result = checkProjectFileUploadAuth("student", 42, 42);
      expect(result.allowed).toBe(true);
    });
  });

  describe("staff requester", () => {
    it("ALLOW: staff uploads to any project regardless of owner", () => {
      const result = checkProjectFileUploadAuth("staff", 10, 99);
      expect(result.allowed).toBe(true);
    });

    it("ALLOW: staff uploads to their own project", () => {
      const result = checkProjectFileUploadAuth("staff", 10, 10);
      expect(result.allowed).toBe(true);
    });
  });

  describe("admin requester", () => {
    it("ALLOW: admin uploads to any project regardless of owner", () => {
      const result = checkProjectFileUploadAuth("admin", 1, 99);
      expect(result.allowed).toBe(true);
    });
  });
});

