// src/utils/logger.js
import { createLogger, transports } from "winston";
import { ecsFormat } from "@elastic/ecs-winston-format";

const NODE_ENV = process.env.NODE_ENV || "development";

// Prefer the version npm injects at startup; fall back to the env var or a
// sentinel so it's obvious when neither is set rather than silently logging "1.0.0".
const SERVICE_VERSION =
  process.env.npm_package_version ||
  process.env.SERVICE_VERSION ||
  "unknown";

// ECS (Elastic Common Schema) format — produces structured JSON that Logstash,
// Filebeat, and the Elastic Stack can ingest without any additional mapping.
// convertReqRes is left off (default false) so the formatter never invokes
// Morgan internally; requestLogger.js extracts ECS fields manually instead.
const logger = createLogger({
  level: process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug"),
  format: ecsFormat(),
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
 *
 * user.id is omitted when req.user is not yet set (e.g. unauthenticated routes).
 *
 * Usage:
 *   logger.error("Something failed", { err, ...reqContext(req) });
 */
export function reqContext(req) {
  const ctx = { trace: { id: req.correlationId } };
  if (req.user?.id !== undefined) ctx.user = { id: req.user.id };
  return ctx;
}
