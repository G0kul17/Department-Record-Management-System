import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { formatDisplayName, getInitials } from "../utils/displayName";
import AvatarPicker from "./ui/AvatarPicker";
import NotificationsBell from "./NotificationsBell";
import apiClient from "../api/axiosClient";
import { getFileUrl } from "../utils/fileUrl";
import {
  FaPencilAlt,
  FaBell,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = formatDisplayName(user);

  const photoUrl = (() => {
    const raw =
      (user &&
        (user.photoUrl ||
          user.avatarUrl ||
          user.imageUrl ||
          user.profilePic)) ||
      "";
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;

    const uploadsMarker = "/uploads/";
    if (value.includes(uploadsMarker)) {
      return getFileUrl(value.split(uploadsMarker)[1]);
    }
    if (/^https?:\/\//i.test(value)) return value;

    return getFileUrl(value);
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
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <img
                src="/drms-logo.png"
                alt="DRMS Logo"
                className="h-10 w-10 object-contain rounded-xl group-hover:scale-105 transition-transform drop-shadow-md"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  DRMS
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </Link>

            {/* Center Navigation Floating Pill Bar */}
            {navLinks.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-full px-2.5 py-1.5 shadow-inner">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavLinkClick(link)}
                    className="inline-flex items-center text-xs font-extrabold text-slate-200 hover:text-white hover:bg-slate-700/80 px-3.5 py-1.5 rounded-full transition-all duration-150 cursor-pointer"
                  >
                    <span>{link.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Right side: controls */}
            <div className="flex items-center gap-3">
              {token ? (
                <>
                  <NotificationsBell />

                  {/* User Profile Pill Trigger */}
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 pl-1.5 pr-3 py-1 text-xs font-extrabold text-slate-100 shadow-sm transition cursor-pointer group"
                  >
                    <Avatar className="h-7 w-7 bg-blue-600/30 text-white border border-blue-400/40 flex-shrink-0">
                      {photoUrl ? (
                        <AvatarImage
                          src={photoUrl}
                          alt={displayName || "Profile"}
                        />
                      ) : null}
                      <AvatarFallback className="font-extrabold text-[10px]">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    {user && (
                      <span className="hidden sm:inline-block max-w-[120px] truncate">
                        {displayName}
                      </span>
                    )}

                    <FaChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-white transition-colors" />
                  </button>

                  {/* Hamburger for mobile */}
                  {navLinks.length > 0 && (
                    <button
                      className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-800 bg-slate-800/90 hover:bg-slate-700 transition"
                      onClick={() => setMobileMenuOpen((v) => !v)}
                      aria-label="Toggle menu"
                    >
                      {mobileMenuOpen ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {location.pathname !== "/login" &&
                    location.pathname !== "/register-student" &&
                    location.pathname !== "/register-staff" && (
                      <>
                        <Link
                          to="/login"
                          className="px-4 py-2 rounded-xl transition font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-md shadow-blue-500/20 whitespace-nowrap"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register-student"
                          className="hidden sm:inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition font-bold text-xs whitespace-nowrap text-slate-200"
                        >
                          Register Student
                        </Link>
                        <Link
                          to="/register-staff"
                          className="hidden sm:inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition font-bold text-xs whitespace-nowrap text-slate-200"
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

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && navLinks.length > 0 && (
          <div className="md:hidden absolute left-0 right-0 top-16 z-[9997] max-h-[70vh] border-t border-slate-800 bg-slate-900 px-3 py-3 overflow-auto space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavLinkClick(link)}
                className="flex w-full items-center px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-xl transition"
              >
                <span>{link.label}</span>
              </button>
            ))}
            {user && (
              <div className="mt-2 px-3 py-2 text-xs text-slate-400 border-t border-slate-800">
                Signed in as{" "}
                <span className="text-slate-200 font-bold">{displayName}</span>
              </div>
            )}
          </div>
        )}

        {/* Profile Popup Dropdown Card */}
        {sidebarOpen &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[9998] bg-slate-950/20 backdrop-blur-xs"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed right-3 sm:right-6 top-16 z-[9999] w-[280px] rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-3">
                {/* Header: User Avatar, Name, Role & Change Photo button */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-11 w-11 bg-slate-100 border border-slate-200 flex-shrink-0">
                      {photoUrl ? (
                        <AvatarImage
                          src={photoUrl}
                          alt={displayName || "Profile"}
                        />
                      ) : null}
                      <AvatarFallback className="font-extrabold text-slate-700">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">
                        {displayName}
                      </h4>
                      {user?.role && (
                        <p className="text-xs font-semibold text-slate-400 capitalize">
                          {user.role}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      setAvatarModalOpen(true);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 transition cursor-pointer flex-shrink-0"
                  >
                    Change Photo
                  </button>
                </div>

                {/* Menu Options */}
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <FaPencilAlt className="w-4 h-4 text-slate-500" />
                    <span>Edit Profile</span>
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <FaBell className="w-4 h-4 text-slate-500" />
                    <span>Notifications</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white font-extrabold text-sm shadow-md shadow-rose-500/20 transition cursor-pointer mt-2"
                  >
                    <FaSignOutAlt className="w-4 h-4 text-white" />
                    <span>Logout</span>
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
      <div className="h-16" />
    </>
  );
};

export default Navbar;
