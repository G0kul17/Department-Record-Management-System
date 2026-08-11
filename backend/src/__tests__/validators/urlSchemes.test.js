import { describe, it, expect } from "vitest";
import { createProjectSchema } from "../../validators/projectSchemas.js";
import { createEventSchema, updateEventSchema } from "../../validators/eventSchemas.js";
import { updateStudentProfileSchema } from "../../validators/studentProfileSchemas.js";

// Regression coverage for VULN-0001 (stored XSS via javascript: URL fields).
// Every URL field must reject non-http(s) schemes; plain Joi .uri() with no
// scheme option allows javascript:/data:/vbscript: through unchanged.

const XSS_PAYLOAD = 'javascript:document.title="XSS"';

describe("URL scheme validation", () => {
  it("rejects a javascript: github_url on project creation", () => {
    const { error } = createProjectSchema.validate({
      title: "Test project",
      mentor_name: "Mentor",
      github_url: XSS_PAYLOAD,
    });
    expect(error).toBeDefined();
  });

  it("accepts a normal https github_url on project creation", () => {
    const { error } = createProjectSchema.validate({
      title: "Test project",
      mentor_name: "Mentor",
      github_url: "https://github.com/example/repo",
    });
    expect(error).toBeUndefined();
  });

  it("rejects a javascript: event_url on event creation", () => {
    const { error } = createEventSchema.validate({
      title: "Test event",
      description: "desc",
      venue: "Hall A",
      start_date: "2026-09-01T09:00:00.000Z",
      event_url: XSS_PAYLOAD,
    });
    expect(error).toBeDefined();
  });

  it("rejects a javascript: event_url on event update (the actually-exploitable path)", () => {
    const { error } = updateEventSchema.validate({
      event_url: XSS_PAYLOAD,
    });
    expect(error).toBeDefined();
  });

  it("rejects javascript: URLs on every student profile link field", () => {
    for (const field of ["leetcode_url", "hackerrank_url", "codechef_url", "github_url"]) {
      const { error } = updateStudentProfileSchema.validate({ [field]: XSS_PAYLOAD });
      expect(error, `${field} should reject javascript: scheme`).toBeDefined();
    }
  });
});
