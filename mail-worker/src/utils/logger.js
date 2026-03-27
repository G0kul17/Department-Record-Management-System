// mail-worker/src/utils/logger.js
// Winston logger with ECS (Elastic Common Schema) formatting.
// Mirrors the backend logger pattern; no per-request trace context here
// since the worker has no HTTP request scope.

import { createLogger, transports, format } from "winston";
import { ecsFormat } from "@elastic/ecs-winston-format";
import { createRequire } from "module";

const NODE_ENV = process.env.NODE_ENV || "development";

const _require = createRequire(import.meta.url);
const SERVICE_VERSION =
  process.env.SERVICE_VERSION ||
  _require("../../package.json").version ||
  "unknown";

const logger = createLogger({
  level: process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug"),
  format: format.combine(ecsFormat()),
  defaultMeta: {
    "service.name":        process.env.SERVICE_NAME || "drms-mail-worker",
    "service.version":     SERVICE_VERSION,
    "service.environment": NODE_ENV,
  },
  transports: [new transports.Console()],
});

export default logger;
