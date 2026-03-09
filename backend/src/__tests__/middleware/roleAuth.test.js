import { describe, it, expect, vi } from "vitest";
import { requireRole } from "../../middleware/roleAuth.js";

function makeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("requireRole middleware", () => {
  it("calls next() when the user has an allowed role", () => {
    const middleware = requireRole(["admin"]);
    const req = { user: { role: "admin" } };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when the user's role is not in the allowed list", () => {
    const middleware = requireRole(["admin"]);
    const req = { user: { role: "student" } };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when req.user is undefined", () => {
    const middleware = requireRole(["admin"]);
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No role found" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows any role listed in the allowed array", () => {
    const middleware = requireRole(["staff", "admin"]);
    const next = vi.fn();

    for (const role of ["staff", "admin"]) {
      vi.clearAllMocks();
      const req = { user: { role } };
      const res = makeRes();
      middleware(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    }
  });

  it("rejects a role not in a multi-role allowed list", () => {
    const middleware = requireRole(["staff", "admin"]);
    const req = { user: { role: "student" } };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when allowedRoles is empty", () => {
    const middleware = requireRole([]);
    const req = { user: { role: "admin" } };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
