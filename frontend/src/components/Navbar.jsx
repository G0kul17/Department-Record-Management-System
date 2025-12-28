import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName =
    (user && (user.fullName || user.name || user.username || user.email)) || "";
  const photoUrl =
    (user &&
      (user.photoUrl || user.avatarUrl || user.imageUrl || user.profilePic)) ||
    null;
  const completion = (() => {
    if (user?.role === "student") {
      // For students, check register_number, contact_number, leetcode_url, hackerrank_url, codechef_url, github_url
      const fields = [
        user?.register_number,
        user?.contact_number,
        user?.leetcode_url,
        user?.hackerrank_url,
        user?.github_url,
      ];
      const filled = fields.filter(
        (v) => typeof v === "string" && v.trim()
      ).length;
      return Math.round((filled / fields.length) * 100);
    }
    // For staff/admin, use existing logic
    const fields = [user?.fullName, user?.email, user?.phone, user?.rollNumber];
    const filled = fields.filter(
      (v) => typeof v === "string" && v.trim()
    ).length;
    return Math.round((filled / fields.length) * 100);
  })();

  function getInitials(name) {
    if (!name || typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  }

  // Professional dashboard style: light theme only

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
    <nav className="bg-[#87CEEB] text-white shadow-sm">
      {/* Full-width wrapper so right controls align flush right */}
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            {/* Inline SVG Logo */}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
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
            <span className="text-[15px] font-semibold tracking-tight">
              DEPARTMENT RECORDS MANAGEMENT SYSTEM
            </span>
          </Link>

          {/* Center nav links removed per spec (hide dashboard/achievements/projects/events) */}
          <div className="hidden md:flex items-center gap-4" />

          <div className="flex items-center gap-4">
            {token ? (
              <>
                {user && (
                  <span className="text-sm rounded-full bg-white/20 px-3 py-1">
                    {displayName}
                  </span>
                )}
                <div className="relative flex items-center">
                  <Avatar
                    className="relative h-9 w-9 bg-white/20 text-white border border-white/30 cursor-pointer"
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
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                {location.pathname !== "/login" &&
                  location.pathname !== "/register-student" &&
                  location.pathname !== "/register-staff" && (
                    <>
                      <Link
                        to="/login"
                        className="px-4 py-2 rounded-lg transition font-medium bg-white/20 hover:bg-white/25"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register-student"
                        className="px-3 py-2 bg-white/20 hover:bg-white/25 rounded-lg transition font-medium text-sm"
                      >
                        Register Student
                      </Link>
                      <Link
                        to="/register-staff"
                        className="px-3 py-2 bg-white/20 hover:bg-white/25 rounded-lg transition font-medium text-sm"
                      >
                        Register Staff
                      </Link>
                    </>
                  )}
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
            <div className="fixed right-4 top-16 z-[9999] w-72 max-h-[80vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-200 p-4">
                <Avatar className="h-10 w-10 bg-slate-100">
                  {photoUrl ? (
                    <AvatarImage
                      src={photoUrl}
                      alt={displayName || "Profile"}
                    />
                  ) : null}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">
                    {displayName}
                  </span>
                  {user?.role && (
                    <span className="text-xs text-slate-500">{user.role}</span>
                  )}
                </div>
              </div>
              <div className="p-2">
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
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
                  className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50"
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
