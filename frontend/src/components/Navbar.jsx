import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName =
    (user && (user.fullName || user.name || user.username || user.email)) || "";
  const photoUrl =
    (user &&
      (user.photoUrl || user.avatarUrl || user.imageUrl || user.profilePic)) ||
    null;

  function getInitials(name) {
    if (!name || typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  }

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
    else if (user.role === "staff") nav("/"); // Staff should see Home
    else if (user.role === "student") nav("/student"); // Students go to Student Dashboard
  }

  return (
    <nav className="backdrop-blur bg-white/70 text-slate-800 shadow-sm dark:bg-slate-900/70 dark:text-slate-100">
      {/* Full-width wrapper so right controls align flush right */}
      <div className="w-full px-4">
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
                    {displayName}
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
                <Avatar
                  className="h-9 w-9 bg-white dark:bg-slate-800 cursor-pointer"
                  title={displayName || "Profile"}
                  onClick={() => setSidebarOpen(true)}
                >
                  {photoUrl ? (
                    <AvatarImage
                      src={photoUrl}
                      alt={displayName || "Profile"}
                    />
                  ) : null}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
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

      {/* Sidebar overlay and panel rendered via portal at document.body */}
      {sidebarOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed right-0 top-0 z-[9999] h-full w-72 transform bg-white shadow-xl transition-transform duration-200 ease-out dark:bg-slate-800 translate-x-0">
              <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
                <Avatar className="h-10 w-10 bg-white dark:bg-slate-700">
                  {photoUrl ? (
                    <AvatarImage
                      src={photoUrl}
                      alt={displayName || "Profile"}
                    />
                  ) : null}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {displayName}
                  </span>
                  {user?.role && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2">
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Edit Profile</span>
                </Link>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="M10 17l5-5-5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 12h11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 21H6a2 2 0 01-2-2V5a2 2 0 012-2h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </nav>
  );
};

export default Navbar;
