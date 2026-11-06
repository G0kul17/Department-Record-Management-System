import { describe, it, expect, beforeEach } from "vitest";
import { getFileUrl } from "../utils/fileUrl";

const BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api";

describe("getFileUrl", () => {
  beforeEach(() => localStorage.clear());

  it("returns the bare file URL when no token is cached", () => {
    expect(getFileUrl("avatar-1.png")).toBe(`${BASE}/files/avatar-1.png`);
  });

  it("appends an explicit token", () => {
    expect(getFileUrl("doc.pdf", "abc")).toBe(`${BASE}/files/doc.pdf?token=abc`);
  });

  it("passes absolute URLs through unchanged", () => {
    expect(getFileUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });
});
