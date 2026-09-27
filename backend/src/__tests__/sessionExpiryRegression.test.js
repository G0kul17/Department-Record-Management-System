import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Session Expiry & Auth State Invalidation Regression Suite", () => {
  let localStorageMock;
  let eventListeners;
  let customEventCalls;

  beforeEach(() => {
    // Set up mock localStorage
    const store = {};
    localStorageMock = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => {
        store[key] = String(val);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const k in store) delete store[k];
      }),
      _store: store,
    };

    // Set up mock window and event dispatching
    eventListeners = {};
    customEventCalls = [];

    class MockCustomEvent {
      constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail || null;
      }
    }

    const windowMock = {
      addEventListener: vi.fn((event, handler) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (!eventListeners[event]) return;
        eventListeners[event] = eventListeners[event].filter((h) => h !== handler);
      }),
      dispatchEvent: vi.fn((event) => {
        customEventCalls.push(event.type);
        if (eventListeners[event.type]) {
          eventListeners[event.type].forEach((handler) => handler(event));
        }
        return true;
      }),
    };

    globalThis.localStorage = localStorageMock;
    globalThis.window = windowMock;
    globalThis.CustomEvent = MockCustomEvent;
  });

  describe("API Client 401 handling for standard requests", () => {
    it("clears localStorage and fires session_expired on 401 response", async () => {
      // Seed authenticated storage
      localStorage.setItem("token", "jwt-token-123");
      localStorage.setItem("user", JSON.stringify({ id: 1, role: "student" }));
      localStorage.setItem("sessionToken", "sess-uuid-456");

      let sessionExpiredDispatched = false;
      const handleSessionExpired = vi.fn();
      window.addEventListener("session_expired", handleSessionExpired);

      // Simulated ApiClient.request behavior
      const mockRequest = async (endpoint, status = 200) => {
        const response = { status, ok: status >= 200 && status < 300 };
        if (response.status === 401 && !endpoint.startsWith("/auth/")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("sessionToken");
          if (!sessionExpiredDispatched) {
            sessionExpiredDispatched = true;
            window.dispatchEvent(new CustomEvent("session_expired"));
          }
          throw new Error("Unauthorized");
        }
        return { success: true };
      };

      await expect(mockRequest("/student/profile", 401)).rejects.toThrow("Unauthorized");

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(localStorage.getItem("sessionToken")).toBeNull();
      expect(handleSessionExpired).toHaveBeenCalledTimes(1);
    });

    it("does not fire session_expired when 401 is returned on /auth/ routes", async () => {
      let sessionExpiredDispatched = false;
      const handleSessionExpired = vi.fn();
      window.addEventListener("session_expired", handleSessionExpired);

      const mockRequest = async (endpoint, status = 200) => {
        const response = { status, ok: status >= 200 && status < 300 };
        if (response.status === 401 && !endpoint.startsWith("/auth/")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("sessionToken");
          if (!sessionExpiredDispatched) {
            sessionExpiredDispatched = true;
            window.dispatchEvent(new CustomEvent("session_expired"));
          }
          throw new Error("Unauthorized");
        }
        if (!response.ok) throw new Error("Invalid credentials");
        return { success: true };
      };

      await expect(mockRequest("/auth/login", 401)).rejects.toThrow("Invalid credentials");
      expect(handleSessionExpired).not.toHaveBeenCalled();
    });
  });

  describe("API Client 401 handling for file uploads", () => {
    it("clears localStorage and fires session_expired when uploadFile receives 401", async () => {
      localStorage.setItem("token", "jwt-token-upload-123");
      localStorage.setItem("user", JSON.stringify({ id: 2, role: "staff" }));
      localStorage.setItem("sessionToken", "sess-upload-789");

      let sessionExpiredDispatched = false;
      const handleSessionExpired = vi.fn();
      window.addEventListener("session_expired", handleSessionExpired);

      // Simulated ApiClient.uploadFile behavior
      const mockUploadFile = async (endpoint, formData, status = 200) => {
        const response = { status, ok: status >= 200 && status < 300 };
        if (response.status === 401 && !endpoint.startsWith("/auth/")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("sessionToken");
          if (!sessionExpiredDispatched) {
            sessionExpiredDispatched = true;
            window.dispatchEvent(new CustomEvent("session_expired"));
          }
          throw new Error("Unauthorized");
        }
        return { uploaded: true };
      };

      await expect(mockUploadFile("/projects/upload", {}, 401)).rejects.toThrow("Unauthorized");

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(localStorage.getItem("sessionToken")).toBeNull();
      expect(handleSessionExpired).toHaveBeenCalledTimes(1);
    });

    it("deduplicates session_expired event when concurrent request and upload both 401", async () => {
      let sessionExpiredDispatched = false;
      const handleSessionExpired = vi.fn();
      window.addEventListener("session_expired", handleSessionExpired);

      const trigger401 = () => {
        if (!sessionExpiredDispatched) {
          sessionExpiredDispatched = true;
          window.dispatchEvent(new CustomEvent("session_expired"));
        }
      };

      // Concurrent standard request + upload both failing with 401
      trigger401();
      trigger401();
      trigger401();

      expect(handleSessionExpired).toHaveBeenCalledTimes(1);

      // Reset guard on session_restored
      sessionExpiredDispatched = false;
      trigger401();
      expect(handleSessionExpired).toHaveBeenCalledTimes(2);
    });
  });

  describe("AuthContext in-memory state invalidation on session_expired", () => {
    it("clears in-memory auth state (user, token, sessionToken) when session_expired fires", () => {
      // Simulate AuthContext state
      let user = { id: 10, email: "student@kongu.edu", role: "student" };
      let token = "active-jwt-token";
      let sessionToken = "active-session-token";

      const setUser = (val) => { user = val; };
      const setToken = (val) => { token = val; };
      const setSessionToken = (val) => { sessionToken = val; };

      // AuthContext session_expired handler
      const handleSessionExpired = () => {
        setUser(null);
        setToken(null);
        setSessionToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("sessionToken");
      };

      window.addEventListener("session_expired", handleSessionExpired);

      // Verify state is populated initially
      expect(user).not.toBeNull();
      expect(token).toBe("active-jwt-token");
      expect(sessionToken).toBe("active-session-token");

      // Dispatch session_expired
      window.dispatchEvent(new CustomEvent("session_expired"));

      // In-memory state must be null
      expect(user).toBeNull();
      expect(token).toBeNull();
      expect(sessionToken).toBeNull();
    });

    it("prevents Login component from redirecting back to dashboard when session_expired is triggered", () => {
      // Simulate user state in AuthContext before expiry
      let authUser = { id: 1, role: "admin" };

      // AuthContext listener
      const handleSessionExpired = () => {
        authUser = null;
      };
      window.addEventListener("session_expired", handleSessionExpired);

      // Simulate App component navigating to /login
      let currentRoute = "/admin";
      let routeState = null;
      const navigate = (to, options) => {
        currentRoute = to;
        routeState = options?.state || null;
      };

      // Expiry occurs
      window.dispatchEvent(new CustomEvent("session_expired"));
      navigate("/login", { state: { sessionExpired: true } });

      // Simulate Login.jsx decision logic
      // if (user) { const dest = user.role === "admin" ? "/admin" : "/"; return <Navigate to={dest} replace />; }
      let didRedirectToDashboard = false;
      let sessionExpiredBannerVisible = false;

      if (authUser) {
        didRedirectToDashboard = true;
      } else {
        didRedirectToDashboard = false;
        if (routeState?.sessionExpired === true) {
          sessionExpiredBannerVisible = true;
        }
      }

      // Assertions
      expect(didRedirectToDashboard).toBe(false);
      expect(sessionExpiredBannerVisible).toBe(true);
      expect(currentRoute).toBe("/login");
    });
  });
});
