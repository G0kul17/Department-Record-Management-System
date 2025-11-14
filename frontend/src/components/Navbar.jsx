import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/login");
  }

  function goToDashboard() {
    if (user.role === "admin") nav("/admin");
    else if (user.role === "staff") nav("/staff");
    else if (user.role === "student") nav("/student");
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="text-xl font-bold hover:text-blue-100 transition"
          >
            DRMS - Department Record Management Systems
          </Link>

          <div className="flex items-center gap-4">
            {token ? (
              <>
                <button
                  onClick={goToDashboard}
                  className="text-sm font-medium hover:text-blue-200 transition"
                >
                  Dashboard
                </button>
                {user && (
                  <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
                    {user.email} • {user.role?.toUpperCase()}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register-student"
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition font-medium text-sm"
                >
                  Register Student
                </Link>
                <Link
                  to="/register-staff"
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition font-medium text-sm"
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
