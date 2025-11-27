import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage or OS preference
    const stored = localStorage.getItem("theme");
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = stored ? stored === "dark" : prefersDark;
    setDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function handleLogout() {
    logout();
    nav("/login");
  }

  function goToDashboard() {
    if (user.role === "admin") nav("/admin");
    else if (user.role === "staff") nav("/staff");
    else if (user.role === "student") nav("/"); // use new Home UI
  }

  return (
    <nav className="backdrop-blur bg-white/70 text-slate-800 shadow-sm dark:bg-slate-900/70 dark:text-slate-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Inline SVG Logo */}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow group-hover:shadow-md transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" opacity=".15" />
                <path
                  d="M20 7.5L12 12 4 7.5M12 12v9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              DEPARTMENT RECORDS MANAGEMENT SYSTEM
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {token ? (
              <>
                {user && (
                  <span className="text-sm rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    {user.email}{" "}
                    <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                      {user.role?.toUpperCase()}
                    </span>
                  </span>
                )}
                <button
                  onClick={toggleTheme}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Toggle theme"
                >
                  {/* Inline SVG moon icon */}
                  {dark ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                    >
                      <path
                        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                    >
                      <path
                        d="M12 3v2m0 14v2m7-9h2M3 12H1m15.95 6.95l1.41 1.41M5.64 5.64L4.22 4.22m12.73 0l1.41 1.41M5.64 18.36l-1.41 1.41"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={goToDashboard}
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg transition font-medium bg-red-500 text-white hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg transition font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/register-student"
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition font-medium text-sm text-white"
                >
                  Register Student
                </Link>
                <Link
                  to="/register-staff"
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition font-medium text-sm text-white"
                >
                  Register Staff
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
