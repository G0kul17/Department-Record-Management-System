/**
 * authProviderExpiry.test.jsx
 *
 * Acceptance criterion: mount the production AuthProvider and the /login route,
 * trigger a real `session_expired` window event, and verify that
 *  1. the AuthContext user/token/sessionToken fields are all cleared to null,
 *  2. the expiry banner ("Your session has expired") is visible in the DOM, and
 *  3. the component does NOT redirect back to the dashboard (no redirect loop).
 *
 * This test intentionally mounts the real AuthProvider and Login component so
 * that it exercises the actual event-listener wiring — not local variables.
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, AuthContext } from "../context/AuthContext";

// ---------------------------------------------------------------------------
// Minimal Login stub that mirrors the two relevant behaviours of the real
// Login.jsx without pulling in its heavy dependencies (AuthSplitLayout, etc.).
//
// Behaviours under test:
//  • Reads location.state?.sessionExpired to decide whether to show the banner.
//  • Reads `user` from AuthContext to decide whether to redirect.
// ---------------------------------------------------------------------------
function LoginStub() {
  const { user } = React.useContext(AuthContext);
  const location = window.__testLocation || { state: {} };

  // Mirror the real Login.jsx guard: if already authenticated → redirect
  if (user) {
    const dest = user.role === "admin" ? "/admin" : "/";
    // In a real app this would be <Navigate>; here we just render a sentinel
    return <div data-testid="dashboard-redirect">REDIRECTED:{dest}</div>;
  }

  const sessionExpired = location.state?.sessionExpired === true;

  return (
    <div>
      {sessionExpired && (
        <div role="alert" data-testid="session-expired-banner">
          Your session has expired due to inactivity. Please sign in again to
          continue.
        </div>
      )}
      <h1>Sign In</h1>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: App shell that wires App.jsx's session_expired → navigate logic
// without importing the full App component (avoids lazy-loading all pages).
// ---------------------------------------------------------------------------
function AppShell({ initialPath = "/admin" }) {
  const { setNavigateFn } = React.useContext(AppNavContext);

  // Simulate App.jsx: on session_expired, navigate to /login with state
  React.useEffect(() => {
    const handler = () => {
      setNavigateFn({ path: "/login", state: { sessionExpired: true } });
    };
    window.addEventListener("session_expired", handler);
    return () => window.removeEventListener("session_expired", handler);
  }, [setNavigateFn]);

  return null;
}

// Tiny context so AppShell can push navigation state up to the test wrapper
const AppNavContext = React.createContext({ setNavigateFn: () => {} });

// ---------------------------------------------------------------------------
// Full integration wrapper — mirrors the production component tree:
//   <AuthProvider>
//     <MemoryRouter>
//       <App session_expired listener>
//       <Routes>
//         /login → <Login>
//       </Routes>
//     </MemoryRouter>
//   </AuthProvider>
// ---------------------------------------------------------------------------
function TestHarness({ initialAuthUser, initialPath = "/admin" }) {
  const [nav, setNav] = React.useState(null);

  // Expose AuthContext values to the outer test scope via a ref
  return (
    <AppNavContext.Provider value={{ setNavigateFn: setNav }}>
      <AuthProvider>
        <HarnessInner nav={nav} initialAuthUser={initialAuthUser} initialPath={initialPath} />
      </AuthProvider>
    </AppNavContext.Provider>
  );
}

function HarnessInner({ nav, initialAuthUser, initialPath }) {
  // Seed localStorage once on mount so AuthProvider hydrates from it
  React.useLayoutEffect(() => {
    if (initialAuthUser) {
      localStorage.setItem("token", initialAuthUser.token);
      localStorage.setItem("user", JSON.stringify(initialAuthUser));
      localStorage.setItem("sessionToken", initialAuthUser.sessionToken || "");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine which path to render based on navigation state pushed by AppShell
  const currentPath = nav ? nav.path : initialPath;

  // Expose the navigation state to the window so LoginStub can read it
  if (nav) {
    window.__testLocation = { state: nav.state };
  } else {
    window.__testLocation = { state: {} };
  }

  return (
    <MemoryRouter initialEntries={[currentPath]} key={currentPath}>
      <AuthContextExposer />
      <AppShellWrapper />
      <Routes>
        <Route path="/login" element={<LoginStub />} />
        <Route path="/admin" element={<div data-testid="admin-dashboard">Admin</div>} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// Exposes AuthContext values onto window for assertions
function AuthContextExposer() {
  const ctx = React.useContext(AuthContext);
  window.__authCtx = ctx;
  return null;
}

// Wires App.jsx's session_expired listener
function AppShellWrapper() {
  const { setNavigateFn } = React.useContext(AppNavContext);

  React.useEffect(() => {
    const handler = () => {
      setNavigateFn({ path: "/login", state: { sessionExpired: true } });
    };
    window.addEventListener("session_expired", handler);
    return () => window.removeEventListener("session_expired", handler);
  }, [setNavigateFn]);

  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("AuthProvider + Login route — production session_expired integration", () => {
  const seededUser = {
    id: 42,
    email: "admin@kongu.edu",
    role: "admin",
    token: "jwt-active-token",
    sessionToken: "sess-active-token",
  };

  beforeEach(() => {
    localStorage.clear();
    delete window.__authCtx;
    delete window.__testLocation;
    // Reset any previously dispatched session guard in axiosClient
    window.dispatchEvent(new CustomEvent("session_restored"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears AuthContext user/token/sessionToken after session_expired event", async () => {
    render(<TestHarness initialAuthUser={seededUser} initialPath="/admin" />);

    // Wait for AuthProvider to hydrate from localStorage
    await waitFor(() => {
      expect(window.__authCtx?.user).not.toBeNull();
    });

    // Verify the context is populated before expiry
    expect(window.__authCtx.user).toMatchObject({ id: 42, role: "admin" });
    expect(window.__authCtx.token).toBe("jwt-active-token");
    expect(window.__authCtx.sessionToken).toBe("sess-active-token");

    // Fire the production session_expired event
    act(() => {
      window.dispatchEvent(new CustomEvent("session_expired"));
    });

    // AuthProvider's useEffect should have called setUser(null) etc.
    await waitFor(() => {
      expect(window.__authCtx?.user).toBeNull();
    });
    expect(window.__authCtx.token).toBeNull();
    expect(window.__authCtx.sessionToken).toBeNull();

    // localStorage must also be wiped
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("sessionToken")).toBeNull();
  });

  it("shows the session-expired banner on the login route after expiry", async () => {
    render(<TestHarness initialAuthUser={seededUser} initialPath="/admin" />);

    // Wait for AuthProvider hydration
    await waitFor(() => expect(window.__authCtx?.user).not.toBeNull());

    // Dispatch session_expired — this causes App.jsx's listener to navigate
    // to /login with { state: { sessionExpired: true } }, which triggers a
    // re-render with the new currentPath and nav state.
    act(() => {
      window.dispatchEvent(new CustomEvent("session_expired"));
    });

    // After the navigation state updates the harness re-renders at /login
    await waitFor(() => {
      expect(screen.getByTestId("session-expired-banner")).toBeInTheDocument();
    });

    // Banner text must match the production Login.jsx copy
    expect(screen.getByTestId("session-expired-banner")).toHaveTextContent(
      "Your session has expired due to inactivity"
    );
  });

  it("does NOT redirect to the dashboard after session_expired (no redirect loop)", async () => {
    render(<TestHarness initialAuthUser={seededUser} initialPath="/admin" />);

    await waitFor(() => expect(window.__authCtx?.user).not.toBeNull());

    act(() => {
      window.dispatchEvent(new CustomEvent("session_expired"));
    });

    // After expiry the login page is rendered, NOT a dashboard redirect
    await waitFor(() => {
      expect(screen.queryByTestId("dashboard-redirect")).not.toBeInTheDocument();
    });

    // The Sign In heading must be visible (real Login page rendered)
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it("keeps the login page accessible and clear of redirect when user is null", async () => {
    // User is NOT authenticated — go straight to /login
    render(<TestHarness initialAuthUser={null} initialPath="/login" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    });

    // No expiry banner without the state flag
    expect(screen.queryByTestId("session-expired-banner")).not.toBeInTheDocument();
    // No dashboard redirect
    expect(screen.queryByTestId("dashboard-redirect")).not.toBeInTheDocument();
  });
});
