// src/utils/logger.js
import { createLogger, transports, format } from "winston";
import { ecsFormat } from "@elastic/ecs-winston-format";
import { createRequire } from "module";
import { getTraceCtx } from "./traceStore.js";

const NODE_ENV = process.env.NODE_ENV || "development";

// Read version from package.json directly so it works regardless of how the
// process was started (npm start, node server.js, PM2, Docker CMD, etc.).
// npm_package_version is only set when the process is launched via an npm script,
// so it silently falls back to "unknown" in most production setups.
const _require = createRequire(import.meta.url);
const SERVICE_VERSION =
  process.env.SERVICE_VERSION ||
  _require("../../package.json").version ||
  "unknown";

// ─── Custom format: auto-inject trace context ────────────────────────────────
//
// Reads the per-request context from AsyncLocalStorage (seeded by
// requestLogger.js, enriched by authMiddleware.js) and merges it into every
// log entry so trace.id, user.id, url.path, and http.method appear in ALL
// Winston logs — even from utility modules that never receive `req`.
//
// Explicit fields passed by the caller always take precedence over the store
// values, so reqContext(req) overrides are never lost.
//
const injectTraceCtx = format((info) => {
  const ctx = getTraceCtx();

  // trace.id — link every log to a single request
  if (ctx.trace?.id && !info.trace?.id) {
    info.trace = { id: ctx.trace.id };
  }

  // user.id — present after auth middleware runs
  if (ctx.user?.id && !info.user?.id) {
    info.user = { id: String(ctx.user.id) };
  }

  // url.path + http.request.method — present for all request-scoped logs
  if (ctx.url?.path && !info.url?.path) {
    info.url = { ...(info.url ?? {}), path: ctx.url.path };
  }
  if (ctx.http?.request?.method && !info.http?.request?.method) {
    info.http = {
      ...(info.http ?? {}),
      request: { method: ctx.http.request.method },
    };
  }

  return info;
});

// ECS (Elastic Common Schema) format — produces structured JSON that Logstash,
// Filebeat, and the Elastic Stack can ingest without any additional mapping.
// convertReqRes is left off (default false) so the formatter never invokes
// Morgan internally; requestLogger.js extracts ECS fields manually instead.
const logger = createLogger({
  level: process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug"),
  format: format.combine(
    injectTraceCtx(),
    ecsFormat(),
  ),
  defaultMeta: {
    "service.name": process.env.SERVICE_NAME || "drms-backend",
    "service.version": SERVICE_VERSION,
    "service.environment": NODE_ENV,
  },
  transports: [
    // Logs to stdout — consumed by Docker/systemd/PM2 and forwarded to Elastic
    // via Filebeat or a Logstash pipeline configured to read from stdout/file.
    new transports.Console(),
  ],
});

export default logger;

/**
 * Build a structured ECS log context object from an Express request.
 *
 * Returns nested ECS fields so Elasticsearch/Kibana map them correctly:
 *   trace.id → { trace: { id: "..." } }   (not the flat "trace.id" string key)
 *   user.id  → { user:  { id: "..." } }   (not the flat "user.id"  string key)
 *   url.path → { url:   { path: "..." } }
 *   http.request.method → { http: { request: { method: "..." } } }
 *
 * user.id is omitted when req.user is not yet set (e.g. unauthenticated routes).
 *
 * Usage:
 *   logger.error("Something failed", { err, ...reqContext(req) });
 */
export function reqContext(req) {
  const ctx = {
    trace: { id: req.correlationId },
    url: { path: req.originalUrl ? req.originalUrl.split("?")[0] : req.path },
    http: { request: { method: req.method } },
  };
  if (req.user?.id !== undefined) ctx.user = { id: String(req.user.id) };
  return ctx;
}
