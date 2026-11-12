import net from "node:net";

// The unix socket clamd listens on. config/upload.js hands the same path to the
// clamscan package for real scans.
export const CLAMD_SOCKET = "/run/clamd.scan/clamd.sock";

// Asks clamd for a PING over its unix socket and resolves once it answers PONG.
//
// This replaces clamscan.getVersion() in the health check. getVersion() runs
// `clamdscan --version` as a child process, and that child blocks forever when
// clamd stops answering (a full listen queue, a wedged daemon) while nothing
// ever kills it: the health check's own timeout only stops *waiting*. The
// health check runs every minute, so a clamd outage leaked one process per
// minute (about 1.4 MB each; 2,472 of them on 2026-10-10, 4,033 on
// 2026-11-12) until the host ran out of memory.
//
// Here no process is spawned and the socket is destroyed on every path, so a
// wedged clamd costs one short-lived connection per check and nothing else.
export function pingClamd({ socketPath = CLAMD_SOCKET, timeoutMs = 3000 } = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let reply = "";
    let settled = false;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(
      () => finish(new Error(`clamd did not answer PING within ${timeoutMs}ms`)),
      timeoutMs,
    );

    socket.on("connect", () => socket.write("zPING\0"));
    socket.on("data", (chunk) => {
      reply += chunk.toString();
      if (reply.includes("PONG")) finish();
    });
    socket.on("close", () =>
      finish(new Error(`clamd closed the connection without PONG (got ${JSON.stringify(reply)})`)),
    );
    socket.on("error", (err) => finish(err));
  });
}
