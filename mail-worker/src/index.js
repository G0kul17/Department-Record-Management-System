// mail-worker/src/index.js
// Entry point for the standalone mail dispatch daemon.
// Starts the polling loop and handles graceful shutdown.

import dotenv from "dotenv";
dotenv.config();

import logger           from "./utils/logger.js";
import pool             from "./config/db.js";
import { runDispatcher } from "./worker/dispatcher.js";

logger.info("mail-worker.starting");

// Verify DB connectivity before entering the dispatch loop.
try {
  const { rows } = await pool.query("SELECT 1 AS ok");
  if (rows[0]?.ok !== 1) throw new Error("Unexpected DB ping result");
  logger.info("mail-worker.db.connected");
} catch (err) {
  logger.error("mail-worker.db.connection_failed — exiting", { err });
  process.exit(1);
}

runDispatcher();

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info("mail-worker.shutdown", { signal });
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
