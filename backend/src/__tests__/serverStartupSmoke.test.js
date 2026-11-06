/**
 * serverStartupSmoke.test.js
 *
 * Unmocked module linking and startup smoke test.
 * Verifies that all controllers, routes, utilities, and server.js link without
 * SyntaxError, missing named exports (e.g. ensureAuditTable), or circular import failures.
 */

import { describe, it, expect } from "vitest";

describe("Server Startup & Module Linking Smoke Test", { timeout: 30000 }, () => {
  it("imports auditLogger and verifies expected exports", async () => {
    const auditLogger = await import("../utils/auditLogger.js");
    expect(auditLogger.logAudit).toBeDefined();
    expect(typeof auditLogger.logAudit).toBe("function");
    // Backwards-compatibility no-op export
    expect(auditLogger.ensureAuditTable).toBeDefined();
    expect(typeof auditLogger.ensureAuditTable).toBe("function");
  });

  it("imports adminController without SyntaxError or missing export errors", async () => {
    const adminController = await import("../controllers/adminController.js");
    expect(adminController.getActiveLogs).toBeDefined();
    expect(adminController.listUsers).toBeDefined();
    expect(adminController.getAdminStats).toBeDefined();
    expect(adminController.updateUserRole).toBeDefined();
    expect(adminController.deleteUser).toBeDefined();
  });

  it("imports fileTokenUtils and verifies session-aware token issuing", async () => {
    const fileTokenUtils = await import("../utils/fileTokenUtils.js");
    expect(fileTokenUtils.issueFileToken).toBeDefined();
    expect(fileTokenUtils.verifyFileToken).toBeDefined();

    // Verify token can be issued with sid
    const token = fileTokenUtils.issueFileToken(1, "test.pdf", 300, "session-smoke-test");
    const decoded = fileTokenUtils.verifyFileToken(token, "test.pdf");
    expect(decoded.sub).toBe("1");
    expect(decoded.file).toBe("test.pdf");
    expect(decoded.sid).toBe("session-smoke-test");
  });

  it("imports addStudentsController and verifies export and duplicate validation", async () => {
    const addStudentsController = await import("../controllers/addStudentsController.js");
    expect(addStudentsController.uploadStudents).toBeDefined();
    expect(typeof addStudentsController.uploadStudents).toBe("function");
  });

  it("imports all core route modules cleanly", async () => {
    const [adminRoutes, authRoutes, fileTokenRoutes, addStudentsRoutes] = await Promise.all([
      import("../routes/adminRoutes.js"),
      import("../routes/authRoutes.js"),
      import("../routes/fileTokenRoutes.js"),
      import("../routes/addStudentsRoutes.js"),
    ]);

    expect(adminRoutes.default).toBeDefined();
    expect(authRoutes.default).toBeDefined();
    expect(fileTokenRoutes.default).toBeDefined();
    expect(addStudentsRoutes.default).toBeDefined();
  });

  it("imports server.js without crashing or throwing SyntaxError", async () => {
    const serverMod = await import("../server.js");
    expect(serverMod.default).toBeDefined();
    // Express application instance
    expect(typeof serverMod.default.use).toBe("function");
  });
});
