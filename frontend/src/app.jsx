import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import BackButton from "./components/BackButton";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterStaff from "./pages/RegisterStaff";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import VerifyProjects from "./pages/staff/VerifyProjects";
import VerifyAchievements from "./pages/staff/VerifyAchievements";
import UploadEvents from "./pages/staff/UploadEvents";
import StudentDashboard from "./pages/student/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import Home from "./pages/Home";
import QuickActions from "./pages/QuickActions";
import Achievements from "./pages/student/StudentsAchievements";
import ProjectUpload from "./pages/student/StudentsProjectUpload";
import Events from "./pages/student/StudentsEventsReg";

function RoleRedirect() {
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
      <BackButton />
      <Routes>
        {/* New Home landing page (requires auth) */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute allowedRoles={["student", "alumni", "staff"]}>
              <Achievements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/upload"
          element={
            <ProtectedRoute allowedRoles={["student", "staff", "admin"]}>
              <ProjectUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quick-actions"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff", "student", "alumni"]}
            >
              <QuickActions />
            </ProtectedRoute>
          }
        />
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

        {/** Standalone staff pages without dashboard layout (top-level to avoid /staff/* overlap) */}
        <Route
          path="/verify-projects"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <VerifyProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-achievements"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <VerifyAchievements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-events"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <UploadEvents />
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

        {/** Backward-compatible redirects from old staff paths */}
        <Route
          path="/staff/verify-projects"
          element={<Navigate to="/verify-projects" replace />}
        />
        <Route
          path="/staff/verify-achievements"
          element={<Navigate to="/verify-achievements" replace />}
        />
        <Route
          path="/staff/upload-events"
          element={<Navigate to="/upload-events" replace />}
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
