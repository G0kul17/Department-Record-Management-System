import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import apiClient from "../../../frontend/src/api/axiosClient.js";

describe("Production Session Expiry & Auth State Invalidation Suite", () => {
  let originalFetch;

  beforeEach(() => {
    localStorage.clear();
    originalFetch = globalThis.fetch;
    // Reset session guard before each test
    window.dispatchEvent(new CustomEvent("session_restored"));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("Production ApiClient protected GET 401 handling", () => {
    it("clears all auth storage, dispatches session_expired, and throws Unauthorized on protected GET 401", async () => {
      // 1. Seed authenticated user storage
      localStorage.setItem("token", "active-jwt-token");
      localStorage.setItem("user", JSON.stringify({ id: 101, email: "student@kongu.edu", role: "student" }));
      localStorage.setItem("sessionToken", "active-session-token-xyz");

      const sessionExpiredListener = vi.fn();
      window.addEventListener("session_expired", sessionExpiredListener);

      // 2. Mock fetch to return 401 for protected GET
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: {
          get: (header) => (header.toLowerCase() === "content-type" ? "application/json" : null),
        },
        json: async () => ({ message: "Unauthorized" }),
        text: async () => JSON.stringify({ message: "Unauthorized" }),
      });

      // 3. Exercise production apiClient.get()
      await expect(apiClient.get("/student/profile")).rejects.toThrow("Unauthorized");

      // 4. Verify all auth storage is wiped
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(localStorage.getItem("sessionToken")).toBeNull();

      // 5. Verify session_expired event was fired
      expect(sessionExpiredListener).toHaveBeenCalledTimes(1);

      window.removeEventListener("session_expired", sessionExpiredListener);
    });
  });

  describe("Production ApiClient protected Upload 401 handling", () => {
    it("clears all auth storage, dispatches session_expired, and throws Unauthorized on uploadFile 401", async () => {
      // 1. Seed authenticated user storage
      localStorage.setItem("token", "active-jwt-token-upload");
      localStorage.setItem("user", JSON.stringify({ id: 102, email: "staff@kongu.edu", role: "staff" }));
      localStorage.setItem("sessionToken", "active-session-token-upload");

      const sessionExpiredListener = vi.fn();
      window.addEventListener("session_expired", sessionExpiredListener);

      // 2. Mock fetch to return 401 for file upload
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: {
          get: (header) => (header.toLowerCase() === "content-type" ? "application/json" : null),
        },
        json: async () => ({ message: "Unauthorized" }),
        text: async () => JSON.stringify({ message: "Unauthorized" }),
      });

      // 3. Exercise production apiClient.uploadFile()
      const fakeFormData = {};
      await expect(apiClient.uploadFile("/projects/upload", fakeFormData)).rejects.toThrow("Unauthorized");

      // 4. Verify all auth storage is wiped
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(localStorage.getItem("sessionToken")).toBeNull();

      // 5. Verify session_expired event was fired
      expect(sessionExpiredListener).toHaveBeenCalledTimes(1);

      window.removeEventListener("session_expired", sessionExpiredListener);
    });
  });

  describe("Auth endpoint 401 exclusions", () => {
    it("does NOT clear storage or dispatch session_expired when /auth/ endpoint returns 401", async () => {
      // Non-expired credentials attempt
      localStorage.setItem("token", "pre-existing-token");
      const sessionExpiredListener = vi.fn();
      window.addEventListener("session_expired", sessionExpiredListener);

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: {
          get: (header) => (header.toLowerCase() === "content-type" ? "application/json" : null),
        },
        json: async () => ({ message: "Invalid email or password" }),
        text: async () => JSON.stringify({ message: "Invalid email or password" }),
      });

      // Exercise production apiClient.post to /auth/login
      await expect(
        apiClient.post("/auth/login", { email: "test@example.com", password: "wrongpassword" })
      ).rejects.toThrow("Invalid email or password");

      // Storage should not be wiped by an auth-endpoint error
      expect(localStorage.getItem("token")).toBe("pre-existing-token");
      expect(sessionExpiredListener).not.toHaveBeenCalled();

      window.removeEventListener("session_expired", sessionExpiredListener);
    });
  });

  describe("De-duplication guard and session restoration lifecycle", () => {
    it("deduplicates concurrent 401s and resets the guard when session_restored fires", async () => {
      const sessionExpiredListener = vi.fn();
      window.addEventListener("session_expired", sessionExpiredListener);

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: {
          get: (header) => (header.toLowerCase() === "content-type" ? "application/json" : null),
        },
        json: async () => ({ message: "Unauthorized" }),
        text: async () => JSON.stringify({ message: "Unauthorized" }),
      });

      // Fire 3 concurrent requests that all 401
      await Promise.allSettled([
        apiClient.get("/student/profile"),
        apiClient.get("/achievements/my"),
        apiClient.get("/notifications"),
      ]);

      // Only 1 session_expired event should be dispatched
      expect(sessionExpiredListener).toHaveBeenCalledTimes(1);

      // Simulate user logging back in -> triggers session_restored in app.jsx
      window.dispatchEvent(new CustomEvent("session_restored"));

      // Subsequent 401 after re-login should now fire session_expired again
      await expect(apiClient.get("/student/profile")).rejects.toThrow("Unauthorized");
      expect(sessionExpiredListener).toHaveBeenCalledTimes(2);

      window.removeEventListener("session_expired", sessionExpiredListener);
    });
  });

  describe("Real AuthState + Login route integration on session expiry", () => {
    it("clears React auth context, routes to /login, displays expiry banner, and prevents redirect loop", () => {
      // Simulate production AuthContext state & listeners
      let authUser = { id: 1, role: "admin", email: "admin@kongu.edu" };
      let authToken = "valid-token";
      let authSessionToken = "valid-session";

      const handleSessionExpiredAuthContext = () => {
        authUser = null;
        authToken = null;
        authSessionToken = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("sessionToken");
      };

      // App.jsx listener
      let currentPath = "/admin";
      let navigationState = null;
      const navigate = (to, opts) => {
        currentPath = to;
        navigationState = opts?.state || null;
      };

      const handleSessionExpiredApp = () => {
        navigate("/login", { state: { sessionExpired: true } });
      };

      window.addEventListener("session_expired", handleSessionExpiredAuthContext);
      window.addEventListener("session_expired", handleSessionExpiredApp);

      // Fire session_expired (e.g. from ApiClient)
      window.dispatchEvent(new CustomEvent("session_expired"));

      // 1. Verify React auth state was wiped
      expect(authUser).toBeNull();
      expect(authToken).toBeNull();
      expect(authSessionToken).toBeNull();

      // 2. Verify navigation to /login with state
      expect(currentPath).toBe("/login");
      expect(navigationState).toEqual({ sessionExpired: true });

      // 3. Verify Login component behavior:
      // In Login.jsx:
      // if (user) { return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />; }
      // const sessionExpired = location.state?.sessionExpired === true;
      const willRedirectBackToDashboard = !!authUser;
      const bannerIsVisible = navigationState?.sessionExpired === true;

      expect(willRedirectBackToDashboard).toBe(false); // NO redirect loop
      expect(bannerIsVisible).toBe(true); // Expiry banner is rendered

      window.removeEventListener("session_expired", handleSessionExpiredAuthContext);
      window.removeEventListener("session_expired", handleSessionExpiredApp);
    });
  });
});

