// src/config/db.js
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

// ============================================================================
// DATABASE CONNECTION POOL MANAGEMENT
// ============================================================================
// Problem: Uncontrolled connections cause database overload and degradation
// Solution: Explicit pool configuration aligned with PostgreSQL max_connections
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// Default pool configuration based on environment
const DEFAULT_POOL_CONFIG = {
  development: {
    max: 20, // Maximum connections for development
    min: 2, // Minimum idle connections
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 seconds
  },
  production: {
    max: 50, // Maximum connections for production
    min: 10, // Minimum idle connections
    idleTimeoutMillis: 60000, // 60 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
  },
};

// Get environment-specific defaults
const defaults = IS_PRODUCTION
  ? DEFAULT_POOL_CONFIG.production
  : DEFAULT_POOL_CONFIG.development;

// Parse pool configuration from environment variables
const poolConfig = {
  // Basic connection parameters
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 5432),

  // Connection pool parameters
  max: Number(process.env.DB_POOL_MAX || defaults.max),
  min: Number(process.env.DB_POOL_MIN || defaults.min),
  idleTimeoutMillis: Number(
    process.env.DB_IDLE_TIMEOUT_MS || defaults.idleTimeoutMillis,
  ),
  connectionTimeoutMillis: Number(
    process.env.DB_CONNECTION_TIMEOUT_MS || defaults.connectionTimeoutMillis,
  ),

  // Connection validation
  allowExitOnIdle: false, // Keep pool alive even when all connections are idle

  // Statement timeout (prevent long-running queries)
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 30000),

  // Query timeout (overall query execution time)
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 60000),
};

// Validate pool configuration
if (poolConfig.max < poolConfig.min) {
  throw new Error(
    `❌ Invalid pool configuration: max (${poolConfig.max}) must be >= min (${poolConfig.min})`,
  );
}

if (poolConfig.max > 100) {
  console.warn(
    `⚠️  Large pool size detected (${poolConfig.max}). ` +
      `Ensure PostgreSQL max_connections is configured appropriately.`,
  );
}

// Create connection pool
const pool = new Pool(poolConfig);

// Pool event handlers
let poolStats = {
  totalConnections: 0,
  totalErrors: 0,
  connectionAttempts: 0,
  lastError: null,
};

// Track new connections
pool.on("connect", (client) => {
  poolStats.totalConnections++;
  console.log(
    `📊 Database connection established (total: ${poolStats.totalConnections})`,
  );

  // Set connection-level parameters
  client.query(`SET statement_timeout = ${poolConfig.statement_timeout}`);
});

// Handle connection errors (individual client errors)
pool.on("error", (err, client) => {
  poolStats.totalErrors++;
  poolStats.lastError = {
    message: err.message,
    timestamp: new Date().toISOString(),
  };

  console.error("❌ Unexpected database client error:", {
    message: err.message,
    code: err.code,
    totalErrors: poolStats.totalErrors,
  });

  // Critical errors that should alert
  const criticalErrors = [
    "ECONNREFUSED", // Database not running
    "ENOTFOUND", // Invalid host
    "ETIMEDOUT", // Connection timeout
    "ECONNRESET", // Connection reset
  ];

  if (criticalErrors.includes(err.code)) {
    console.error("🚨 CRITICAL: Database connection error detected!");
    console.error("   Check database availability and network connectivity.");
  }
});

// Track connection acquisition
pool.on("acquire", (client) => {
  poolStats.connectionAttempts++;
});

// Track connection removal
pool.on("remove", (client) => {
  console.log(`🔌 Database connection closed`);
});

// ============================================================================
// POOL HEALTH MONITORING
// ============================================================================

/**
 * Get current pool statistics and health status
 * @returns {Object} Pool health information
 */
export function getPoolHealth() {
  return {
    totalCount: pool.totalCount, // Total clients in pool
    idleCount: pool.idleCount, // Available clients
    waitingCount: pool.waitingCount, // Clients waiting for connection
    config: {
      max: poolConfig.max,
      min: poolConfig.min,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    },
    stats: {
      totalConnections: poolStats.totalConnections,
      totalErrors: poolStats.totalErrors,
      connectionAttempts: poolStats.connectionAttempts,
      lastError: poolStats.lastError,
    },
    health: {
      status: getHealthStatus(),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Determine pool health status
 * @returns {string} Health status: 'healthy', 'warning', 'critical'
 */
function getHealthStatus() {
  const utilization = (pool.totalCount - pool.idleCount) / poolConfig.max;
  const errorRate =
    poolStats.totalErrors / Math.max(poolStats.connectionAttempts, 1);

  // Critical: High utilization and high error rate
  if (utilization > 0.9 || errorRate > 0.1 || pool.waitingCount > 5) {
    return "critical";
  }

  // Warning: Moderate utilization or some errors
  if (utilization > 0.7 || errorRate > 0.05 || pool.waitingCount > 2) {
    return "warning";
  }

  return "healthy";
}

/**
 * Log pool health information
 */
export function logPoolHealth() {
  const health = getPoolHealth();
  const status = health.health.status;

  const icon =
    {
      healthy: "✅",
      warning: "⚠️",
      critical: "🚨",
    }[status] || "❓";

  console.log(`${icon} Database Pool Health: ${status.toUpperCase()}`);
  console.log(
    `   Total: ${health.totalCount} | Idle: ${health.idleCount} | Waiting: ${health.waitingCount}`,
  );
  console.log(`   Max: ${health.config.max} | Min: ${health.config.min}`);
  console.log(
    `   Connections: ${health.stats.totalConnections} | Errors: ${health.stats.totalErrors}`,
  );

  if (status === "warning" || status === "critical") {
    console.warn(
      `   ⚠️  Consider increasing DB_POOL_MAX or optimizing queries`,
    );
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

let isShuttingDown = false;

/**
 * Gracefully close all database connections
 * @returns {Promise<void>}
 */
export async function closePool() {
  if (isShuttingDown) {
    console.log("⏳ Pool shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log("🔌 Closing database connection pool...");

  try {
    // Log final pool stats
    logPoolHealth();

    // Close all connections
    await pool.end();

    console.log("✅ Database pool closed successfully");
  } catch (err) {
    console.error("❌ Error closing database pool:", err.message);
    throw err;
  }
}

// Register shutdown handlers
process.on("SIGTERM", async () => {
  console.log("\n📡 Received SIGTERM signal");
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\n📡 Received SIGINT signal (Ctrl+C)");
  await closePool();
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("❌ Uncaught Exception:", err);
  await closePool();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", async (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  await closePool();
  process.exit(1);
});

// ============================================================================
// EXPORT
// ============================================================================

console.log("📊 Database Pool Configuration:");
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Host: ${poolConfig.host}:${poolConfig.port}`);
console.log(`   Database: ${poolConfig.database}`);
console.log(`   Pool Max: ${poolConfig.max} | Min: ${poolConfig.min}`);
console.log(`   Idle Timeout: ${poolConfig.idleTimeoutMillis}ms`);
console.log(`   Connection Timeout: ${poolConfig.connectionTimeoutMillis}ms`);

export default pool;
