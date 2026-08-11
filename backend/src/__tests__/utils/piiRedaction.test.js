import { describe, it, expect } from "vitest";
import { redactFields, redactRows } from "../../utils/piiRedaction.js";

// Regression coverage for VULN-0002 (unauthenticated PII disclosure).

describe("redactFields", () => {
  it("nulls out listed fields present on the row", () => {
    const row = { id: 1, title: "Project X", user_email: "a@b.com", user_fullname: "A B" };
    const result = redactFields(row, ["user_email", "user_fullname"]);
    expect(result).toEqual({ id: 1, title: "Project X", user_email: null, user_fullname: null });
  });

  it("does not mutate the original row", () => {
    const row = { id: 1, user_email: "a@b.com" };
    redactFields(row, ["user_email"]);
    expect(row.user_email).toBe("a@b.com");
  });

  it("leaves fields not present on the row untouched", () => {
    const row = { id: 1, title: "Project X" };
    const result = redactFields(row, ["user_email", "mobile_number"]);
    expect(result).toEqual({ id: 1, title: "Project X" });
  });

  it("passes through null/undefined rows unchanged", () => {
    expect(redactFields(null, ["user_email"])).toBeNull();
    expect(redactFields(undefined, ["user_email"])).toBeUndefined();
  });
});

describe("redactRows", () => {
  const rows = [
    { id: 1, user_email: "a@b.com", mobile_number: "111" },
    { id: 2, user_email: "c@d.com", mobile_number: "222" },
  ];
  const PII = ["user_email", "mobile_number"];

  it("redacts every row when the caller is unauthenticated", () => {
    const result = redactRows(rows, PII, false);
    expect(result).toEqual([
      { id: 1, user_email: null, mobile_number: null },
      { id: 2, user_email: null, mobile_number: null },
    ]);
  });

  it("returns rows unchanged when the caller is authenticated", () => {
    const result = redactRows(rows, PII, true);
    expect(result).toBe(rows);
    expect(result).toEqual(rows);
  });
});
