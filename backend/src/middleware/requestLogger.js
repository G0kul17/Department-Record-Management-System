// src/middleware/requestLogger.js
import { v4 as uuidv4 } from "uuid";
import logger, { reqContext } from "../utils/logger.js";

// Routes polled by load balancers / uptime monitors — log at debug to avoid noise.
const HEALTH_PROBE_PATHS = new Set(["/", "/health", "/favicon.ico"]);

// Correlation IDs from clients must match this pattern to be trusted.
// Anything outside [word chars and hyphens, 1–64 chars] gets replaced with a fresh UUID.
const CORRELATION_ID_RE = /^[\w-]{1,64}$/;

// Requests exceeding this threshold get an extra "warn" log entry.
// Override via SLOW_REQUEST_THRESHOLD_MS env var (default: 1000 ms).
const SLOW_THRESHOLD_NS = BigInt(
  (Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 1000) * 1_000_000,
);

// Build ECS-compatible fields from an incoming Express request.
// Raw req/res objects are intentionally NOT passed to Winston — doing so with
// convertReqRes: true triggers the ECS formatter's internal Morgan serialiser,
// which overwrites our custom message with an apache combined-log string.
// Extracting fields manually also prevents sensitive headers (e.g. Authorization)
// from appearing in logs.
function reqFields(req, correlationId, urlPath) {
  return {
    trace: { id: correlationId },
    http: {
      version: req.httpVersion,
      request: { method: req.method },
    },
    url: {
      path: urlPath,
      domain: req.hostname,
    },
    client: {
      ip: req.ip,
      address: req.ip,
    },
    user_agent: { original: req.headers["user-agent"] },
  };
}

function resFields(req, res, correlationId, durationNs, urlPath) {
  const contentLength = parseInt(res.getHeader("content-length"), 10);
  const meta = {
    trace: { id: correlationId },
    http: {
      version: req.httpVersion,
      request: { method: req.method },
      response: {
        status_code: res.statusCode,
        ...(Number.isFinite(contentLength) && { body: { bytes: contentLength } }),
      },
    },
    url: {
      path: urlPath,
      domain: req.hostname,
    },
    client: {
      ip: req.ip,
      address: req.ip,
    },
    user_agent: { original: req.headers["user-agent"] },
    event: { duration: Number(durationNs) },
  };
  if (req.user?.id != null) {
    meta.user = { id: String(req.user.id) };
  }
  return meta;
}

/**
 * Request logging middleware.
 *
 * 1. Assigns a correlation ID to every incoming request.
 *    - Validates the client-supplied X-Correlation-ID header against a safe
 *      pattern before reusing it (prevents header-injection log pollution).
 *    - Falls back to a new UUID v4 when the header is absent or invalid.
 *
 * 2. Attaches the ID to req.correlationId so controllers and downstream
 *    middleware can include it in their own log entries via reqContext(req).
 *
 * 3. Echoes the ID back in the X-Correlation-ID response header so clients
 *    and API gateways can correlate responses to requests.
 *
 * 4. Emits ECS-structured log events per request:
 *    - "HTTP request received"  — on incoming request (skipped for health probes).
 *                                 user.id is intentionally absent here because auth
 *                                 middleware has not yet run.
 *    - "HTTP response sent"     — after the response is flushed (finish event).
 *                                 user.id is present for authenticated routes.
 *    - "HTTP request aborted"   — when the client disconnects before a response.
 *    - "Slow request detected"  — extra warn when duration > SLOW_REQUEST_THRESHOLD_MS.
 *    All events carry the correlation ID in the ECS trace.id field, making
 *    them linkable inside Kibana without any additional processing.
 */
export function requestLogger(req, res, next) {
  // Validate the client-supplied correlation ID before trusting it.
  const rawId = req.headers["x-correlation-id"];
  const correlationId =
    rawId && CORRELATION_ID_RE.test(rawId) ? rawId : uuidv4();

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);

  // Capture the full path now, before Express routing rewrites req.url/req.path
  // relative to the matched router's mount point.
  const urlPath = (req.originalUrl || req.path).split("?")[0];

  const startTime = process.hrtime.bigint();
  const isHealthProbe = HEALTH_PROBE_PATHS.has(urlPath);

  // "HTTP request received" — auth has not run yet so user.id is intentionally omitted.
  logger[isHealthProbe ? "debug" : "info"](
    "HTTP request received",
    reqFields(req, correlationId, urlPath),
  );

  let responded = false;

  res.on("finish", () => {
    responded = true;
    const durationNs = process.hrtime.bigint() - startTime;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[isHealthProbe ? "debug" : level](
      "HTTP response sent",
      resFields(req, res, correlationId, durationNs, urlPath),
    );

    // Emit an extra warning when a request takes longer than the threshold.
    if (!isHealthProbe && durationNs > SLOW_THRESHOLD_NS) {
      logger.warn("Slow request detected", {
        "url.path": urlPath,
        "http.request.method": req.method,
        "event.duration": Number(durationNs),
        "slow_threshold_ms": Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 1000,
        ...reqContext(req),
      });
    }
  });

  // Detect client disconnects that happen before the response is sent.
  res.on("close", () => {
    if (!responded) {
      logger.warn("HTTP request aborted", {
        "url.path": urlPath,
        "http.request.method": req.method,
        "event.duration": Number(process.hrtime.bigint() - startTime),
        ...reqContext(req),
      });
    }
  });

  next();
}
