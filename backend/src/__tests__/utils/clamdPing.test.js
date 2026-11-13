import { describe, it, expect, afterEach } from "vitest";
import net from "node:net";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { pingClamd, CLAMD_SOCKET } from "../../utils/clamdPing.js";

// A fake clamd on a unix socket (a named pipe on Windows).
const servers = [];
function socketPath() {
  const name = `clamd-test-${process.pid}-${Math.random().toString(36).slice(2)}`;
  return process.platform === "win32" ? `\\\\.\\pipe\\${name}` : path.join(os.tmpdir(), `${name}.sock`);
}
function fakeClamd(onConnection) {
  const p = socketPath();
  const state = { path: p, connections: 0, closed: 0 };
  const server = net.createServer((conn) => {
    state.connections += 1;
    conn.on("close", () => (state.closed += 1));
    conn.on("error", () => {});
    conn.resume(); // read until EOF, so the server notices when the client hangs up
    onConnection(conn);
  });
  servers.push(server);
  return new Promise((resolve) => server.listen(p, () => resolve(state)));
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

describe("pingClamd", () => {
  it("resolves when clamd answers PONG", async () => {
    const clamd = await fakeClamd((conn) => conn.on("data", () => conn.write("PONG\0")));
    await expect(pingClamd({ socketPath: clamd.path })).resolves.toBeUndefined();
  });

  it("sends a null-terminated PING command", async () => {
    let received = "";
    const clamd = await fakeClamd((conn) =>
      conn.on("data", (d) => {
        received += d.toString();
        conn.write("PONG\n");
      }),
    );
    await pingClamd({ socketPath: clamd.path });
    expect(received).toBe("zPING\0");
  });

  it("rejects within the timeout when clamd accepts but never answers, and closes the connection", async () => {
    const clamd = await fakeClamd(() => {}); // wedged: accepts, stays silent
    const started = Date.now();
    await expect(pingClamd({ socketPath: clamd.path, timeoutMs: 300 })).rejects.toThrow(/did not answer PING within 300ms/);
    expect(Date.now() - started).toBeLessThan(2000);
    await new Promise((r) => setTimeout(r, 100));
    expect(clamd.closed).toBe(clamd.connections); // nothing is left open on the daemon's side
  });

  it("rejects when there is no socket at all", async () => {
    await expect(pingClamd({ socketPath: socketPath(), timeoutMs: 300 })).rejects.toThrow();
  });

  it("rejects when clamd closes the connection without PONG", async () => {
    const clamd = await fakeClamd((conn) => conn.end("ERROR\0"));
    await expect(pingClamd({ socketPath: clamd.path })).rejects.toThrow(/without PONG/);
  });

  it("rejects on an unexpected reply", async () => {
    const clamd = await fakeClamd((conn) => conn.on("data", () => conn.end("UNKNOWN COMMAND\0")));
    await expect(pingClamd({ socketPath: clamd.path })).rejects.toThrow(/without PONG/);
  });

  it("settles once: a late PONG after the timeout changes nothing", async () => {
    const clamd = await fakeClamd((conn) => conn.on("data", () => setTimeout(() => conn.write("PONG\0"), 400)));
    await expect(pingClamd({ socketPath: clamd.path, timeoutMs: 100 })).rejects.toThrow(/did not answer/);
  });

  it("defaults to the socket the clamscan package uses for scans", () => {
    expect(CLAMD_SOCKET).toBe("/run/clamd.scan/clamd.sock");
  });
});

// The state clamd was in during the incident: it accepts nothing and its listen queue is full, so a non-blocking connect() fails at once with
// EAGAIN (a blocking one, like the clamdscan binary's, would hang). A child process listens and then blocks its event loop, so the kernel never drains
// the queue. Linux only: other platforms have no such backlog behaviour on their sockets.
describe.skipIf(process.platform !== "linux")("pingClamd with a full listen queue", () => {
  it("rejects at once with EAGAIN and leaves nothing behind", async () => {
    const sock = socketPath();
    const child = spawn(
      process.execPath,
      [
        "-e",
        `require("net").createServer().listen({ path: process.argv[1], backlog: 1 }, () => { console.log("ready"); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000); });`,
        sock,
      ],
      { stdio: ["ignore", "pipe", "inherit"] },
    );
    const fillers = [];
    try {
      await new Promise((resolve, reject) => {
        child.stdout.once("data", resolve);
        child.once("error", reject);
      });
      // fill the queue: keep opening connections until one is refused with EAGAIN
      for (let i = 0; i < 10; i++) {
        const filler = net.createConnection(sock);
        fillers.push(filler);
        const outcome = await new Promise((resolve) => {
          filler.once("connect", () => resolve("queued"));
          filler.once("error", (err) => resolve(err.code));
        });
        if (outcome === "EAGAIN") break;
      }
      const started = Date.now();
      await expect(pingClamd({ socketPath: sock, timeoutMs: 2000 })).rejects.toMatchObject({ code: "EAGAIN" });
      expect(Date.now() - started).toBeLessThan(500);
    } finally {
      fillers.forEach((f) => f.destroy());
      child.kill("SIGKILL");
    }
  });
});
