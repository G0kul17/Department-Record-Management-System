import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterStaff from "./pages/RegisterStaff";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

function Home() {
  const { user } = useAuth();
  if (!user?.token) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;
  if (user.role === "staff") return <Navigate to="/staff" />;
  return <Navigate to="/student" />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/register-student" element={<RegisterStudent />} />
        <Route path="/register-staff" element={<RegisterStaff />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
        {/** Route aliases to avoid 404 on old links */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forbidden"
          element={
            <div className="container">
              <div className="card">
                <h3 className="text-xl">403 — Forbidden</h3>
                <p className="small">You don’t have access.</p>
              </div>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="container">
              <div className="card">
                <h3 className="text-xl">404 — Not found</h3>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}
