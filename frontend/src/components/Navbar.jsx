import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { formatDisplayName, getInitials } from "../utils/displayName";
import AvatarPicker from "./ui/AvatarPicker";
import NotificationsBell from "./NotificationsBell";
import apiClient from "../api/axiosClient";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = formatDisplayName(user);
  const photoUrl =
    (user &&
      (user.photoUrl || user.avatarUrl || user.imageUrl || user.profilePic)) ||
    null;
  const completion = (() => {
    if (user?.role === "student") {
      const fields = [
        user?.register_number,
        user?.contact_number,
        user?.leetcode_url,
        user?.hackerrank_url,
        user?.github_url,
      ];
      const filled = fields.filter(
        (v) => typeof v === "string" && v.trim(),
      ).length;
      return Math.round((filled / fields.length) * 100);
    }
    const fields = [user?.fullName, user?.email, user?.phone, user?.rollNumber];
    const filled = fields.filter(
      (v) => typeof v === "string" && v.trim(),
    ).length;
    return Math.round((filled / fields.length) * 100);
  })();

  async function handleLogout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (_) {
      // proceed with local logout even if backend call fails
    }
    logout();
    nav("/login");
  }

  function goToDashboard() {
    if (user.role === "admin") nav("/admin");
    else if (user.role === "staff") nav("/");
    else if (user.role === "student") nav("/student");
  }

  // Navigation links per role
  const navLinks =
    token && user
      ? user.role === "admin"
        ? [
            { label: "Events", section: "events", path: "/admin" },
            { label: "Projects", section: "projects", path: "/admin" },
            { label: "Achievements", section: "achievements", path: "/admin" },
            { label: "Visualization", section: "visualization", path: "/admin" },
            { label: "Notifications", section: null, path: "/notifications" },
          ]
        : user.role === "student"
        ? [
            { label: "Events", section: "events", path: "/" },
            { label: "Projects", section: "projects", path: "/" },
            { label: "Achievements", section: "achievements", path: "/" },
            { label: "Notifications", section: null, path: "/notifications" },
          ]
        : user.role === "staff"
        ? [
            { label: "Events", section: "events", path: "/" },
            { label: "Projects", section: "projects", path: "/" },
            { label: "Achievements", section: "achievements", path: "/" },
            { label: "Notifications", section: null, path: "/notifications" },
          ]
        : []
      : [];

  function handleNavLinkClick(link) {
    setMobileMenuOpen(false);
    if (link.section) {
      nav(link.path);
      setTimeout(() => {
        const element = document.getElementById(link.section);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      nav(link.path);
    }
  }

  return (
    <nav className="bg-slate-900 text-white shadow-md relative">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
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
              DRMS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {navLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavLinkClick(link)}
                  className="text-sm font-medium hover:bg-white/20 px-3 py-2 rounded-lg transition"
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}

          {/* Right side: controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {token ? (
              <>
                <NotificationsBell />
                {/* Show name only on sm+ */}
                {user && (
                  <span className="hidden sm:inline-block text-sm rounded-full bg-white/20 px-3 py-1 max-w-[140px] truncate">
                    {displayName}
                  </span>
                )}
                <div className="relative flex items-center">
                  <Avatar
                    className="relative h-9 w-9 bg-white/20 text-white border border-white/30 cursor-pointer flex-shrink-0"
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
                {/* Hamburger for mobile - only when logged in */}
                {navLinks.length > 0 && (
                  <button
                    className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/20 transition"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                {location.pathname !== "/login" &&
                  location.pathname !== "/register-student" &&
                  location.pathname !== "/register-staff" && (
                    <>
                      <Link
                        to="/login"
                        className="px-3 py-2 rounded-lg transition font-medium bg-white/20 hover:bg-white/25 text-sm whitespace-nowrap"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register-student"
                        className="hidden sm:inline-block px-3 py-2 bg-white/20 hover:bg-white/25 rounded-lg transition font-medium text-sm whitespace-nowrap"
                      >
                        Register Student
                      </Link>
                      <Link
                        to="/register-staff"
                        className="hidden sm:inline-block px-3 py-2 bg-white/20 hover:bg-white/25 rounded-lg transition font-medium text-sm whitespace-nowrap"
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

      {/* Mobile nav dropdown (only when logged in) */}
      {mobileMenuOpen && navLinks.length > 0 && (
        <div className="md:hidden border-t border-white/10 bg-slate-900 px-2 pb-3">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavLinkClick(link)}
              className="flex w-full items-center px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 rounded-lg transition"
            >
              {link.label}
            </button>
          ))}
          {user && (
            <div className="mt-1 px-3 py-2 text-sm text-slate-400 border-t border-white/10">
              Signed in as <span className="text-slate-200 font-medium">{displayName}</span>
            </div>
          )}
        </div>
      )}

      {/* Sidebar overlay and panel rendered via portal at document.body */}
      {sidebarOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed right-4 top-16 z-[9999] w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
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
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {displayName}
                  </span>
                  {user?.role && (
                    <span className="text-xs text-slate-500 capitalize">{user.role}</span>
                  )}
                </div>
                <div className="ml-auto flex-shrink-0">
                  <button
                    className="px-3 py-1 rounded-md text-xs bg-slate-100 hover:bg-slate-200"
                    onClick={() => setAvatarModalOpen(true)}
                  >
                    Change Photo
                  </button>
                </div>
              </div>
              <div className="p-2">
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100 outline-none focus:outline-none focus:ring-0 border-0"
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
                <Link
                  to="/notifications"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100 outline-none focus:outline-none focus:ring-0 border-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Notifications</span>
                </Link>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left bg-red-600 text-white hover:bg-red-700 active:bg-red-800 outline-none focus:outline-none focus:ring-0 border-0"
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 text-white"
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
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
      <AvatarPicker
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
