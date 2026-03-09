import { describe, it, expect, vi, beforeEach } from "vitest";
import EventEmitter from "events";

vi.mock("../../utils/logger.js", () => {
  const logger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { default: logger, reqContext: vi.fn(() => ({})) };
});

import logger from "../../utils/logger.js";
import { requestLogger } from "../../middleware/requestLogger.js";

// Build a minimal Express-like req object.
// originalUrl / path are set to simulate what Express does when a router is mounted
// at a sub-path (e.g. app.use('/api', router)).
function makeReq({ originalUrl = "/api/projects", path = "/", method = "GET" } = {}) {
  return {
    originalUrl,
    path,
    method,
    httpVersion: "1.1",
    hostname: "localhost",
    ip: "127.0.0.1",
    headers: {},
  };
}

// Build a minimal Express-like res object that extends EventEmitter so we can
// emit 'finish' / 'close' events the same way Node's http.ServerResponse does.
function makeRes(statusCode = 200) {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  res.setHeader = vi.fn();
  res.getHeader = vi.fn().mockReturnValue(null);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── url.path logged on incoming request ────────────────────────────────────

describe("request log — url.path", () => {
  it("logs the full originalUrl path, not the router-scoped req.path", () => {
    const req = makeReq({ originalUrl: "/api/projects", path: "/" });
    const res = makeRes();
    const next = vi.fn();

    requestLogger(req, res, next);

    const [, fields] = logger.info.mock.calls[0];
    expect(fields.url.path).toBe("/api/projects");
  });

  it("strips query string from url.path", () => {
    const req = makeReq({ originalUrl: "/api/projects?page=2&limit=10", path: "/" });
    const res = makeRes();

    requestLogger(req, res, vi.fn());

    const [, fields] = logger.info.mock.calls[0];
    expect(fields.url.path).toBe("/api/projects");
  });
});

// ── url.path logged on response ────────────────────────────────────────────

describe("response log — url.path", () => {
  it("logs the full originalUrl path on finish, not the router-scoped req.path", () => {
    const req = makeReq({ originalUrl: "/api/achievements", path: "/" });
    const res = makeRes();

    requestLogger(req, res, vi.fn());
    res.emit("finish");

    const responseCalls = logger.info.mock.calls.filter(([msg]) => msg === "HTTP response sent");
    expect(responseCalls).toHaveLength(1);
    expect(responseCalls[0][1].url.path).toBe("/api/achievements");
  });

  it("logs the full path for nested routes like /api/announcements/mine", () => {
    const req = makeReq({ originalUrl: "/api/announcements/mine", path: "/mine" });
    const res = makeRes();

    requestLogger(req, res, vi.fn());
    res.emit("finish");

    const responseCalls = logger.info.mock.calls.filter(([msg]) => msg === "HTTP response sent");
    expect(responseCalls[0][1].url.path).toBe("/api/announcements/mine");
  });

  it("request and response logs record the same url.path", () => {
    const req = makeReq({ originalUrl: "/api/departments/5", path: "/5" });
    const res = makeRes();

    requestLogger(req, res, vi.fn());
    res.emit("finish");

    const reqPath  = logger.info.mock.calls.find(([msg]) => msg === "HTTP request received")[1].url.path;
    const resPath  = logger.info.mock.calls.find(([msg]) => msg === "HTTP response sent")[1].url.path;
    expect(reqPath).toBe(resPath);
  });
});

// ── abort log — url.path ───────────────────────────────────────────────────

describe("abort log — url.path", () => {
  it("logs the full originalUrl path when the client disconnects before a response", () => {
    const req = makeReq({ originalUrl: "/api/documents/upload", path: "/upload" });
    const res = makeRes();

    requestLogger(req, res, vi.fn());
    // Emit close WITHOUT finish → treated as an aborted request.
    res.emit("close");

    const [, fields] = logger.warn.mock.calls.find(([msg]) => msg === "HTTP request aborted");
    expect(fields["url.path"]).toBe("/api/documents/upload");
  });
});

// ── correlation ID ─────────────────────────────────────────────────────────

describe("correlation ID", () => {
  it("reuses a valid client-supplied X-Correlation-ID", () => {
    const req = makeReq();
    req.headers["x-correlation-id"] = "my-trace-id-123";
    const res = makeRes();

    requestLogger(req, res, vi.fn());

    const [, fields] = logger.info.mock.calls[0];
    expect(fields.trace.id).toBe("my-trace-id-123");
  });

  it("generates a new UUID when the supplied correlation ID is invalid", () => {
    const req = makeReq();
    req.headers["x-correlation-id"] = "<script>bad</script>";
    const res = makeRes();

    requestLogger(req, res, vi.fn());

    const [, fields] = logger.info.mock.calls[0];
    expect(fields.trace.id).toMatch(/^[\w-]{1,64}$/);
    expect(fields.trace.id).not.toBe("<script>bad</script>");
  });
});

// ── response status level mapping ──────────────────────────────────────────

describe("response log level", () => {
  it.each([
    [200, "info"],
    [302, "info"],
    [400, "warn"],
    [404, "warn"],
    [500, "error"],
    [503, "error"],
  ])("uses '%s' level for HTTP %i", (statusCode, expectedLevel) => {
    const req = makeReq({ originalUrl: "/api/test", path: "/test" });
    const res = makeRes(statusCode);

    requestLogger(req, res, vi.fn());
    res.emit("finish");

    const calls = logger[expectedLevel].mock.calls.filter(([msg]) => msg === "HTTP response sent");
    expect(calls).toHaveLength(1);
  });
});
