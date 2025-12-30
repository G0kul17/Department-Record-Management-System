import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import BackButton from "./components/BackButton";

// Lazy load all page components - only load when needed
const Login = React.lazy(() => import("./pages/Login"));
const VerifyOtp = React.lazy(() => import("./pages/VerifyOtp"));
const RegisterStudent = React.lazy(() => import("./pages/RegisterStudent"));
const RegisterStaff = React.lazy(() => import("./pages/RegisterStaff"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const StaffDashboard = React.lazy(() => import("./pages/staff/StaffDashboard"));
const VerifyAchievements = React.lazy(() =>
  import("./pages/staff/VerifyAchievements")
);
const VerifyProjects = React.lazy(() => import("./pages/staff/VerifyProjects"));
const UploadEvents = React.lazy(() => import("./pages/staff/UploadEvents"));
const ReportGenerator = React.lazy(() =>
  import("./pages/staff/ReportGenerator")
);
// Admin wrappers
const AdminProjectsManagement = React.lazy(() =>
  import("./pages/admin/AdminProjectsManagement")
);
const AdminAchievementsManagement = React.lazy(() =>
  import("./pages/admin/AdminAchievementsManagement")
);
const AdminEventsManagement = React.lazy(() =>
  import("./pages/admin/AdminEventsManagement")
);
const AdminVerifyProjects = React.lazy(() =>
  import("./pages/admin/AdminVerifyProjects")
);
const AdminVerifyAchievements = React.lazy(() =>
  import("./pages/admin/AdminVerifyAchievements")
);
const AdminUploadEvents = React.lazy(() =>
  import("./pages/admin/AdminUploadEvents")
);
const AdminReportGenerator = React.lazy(() =>
  import("./pages/admin/AdminReportGenerator")
);
const AdminUsersManagement = React.lazy(() =>
  import("./pages/admin/AdminUsersManagement.jsx")
);
const AdminRoleUsersList = React.lazy(() =>
  import("./pages/admin/AdminRoleUsersList")
);
const StudentDashboard = React.lazy(() =>
  import("./pages/student/StudentDashboard")
);
const Home = React.lazy(() => import("./pages/Home"));
const QuickActions = React.lazy(() => import("./pages/QuickActions"));
const AdminQuickActions = React.lazy(() =>
  import("./pages/admin/AdminQuickActions")
);
const UploadExtracurricular = React.lazy(() =>
  import("./pages/staff/StaffDataEntry")
);
const AdminUploadExtracurricular = React.lazy(() =>
  import("./pages/admin/AdminDataEntry")
);
const FacultyParticipation = React.lazy(() =>
  import("./pages/staff/FacultyParticipation")
);
const AdminFacultyParticipation = React.lazy(() =>
  import("./pages/admin/AdminFacultyParticipation")
);
const FacultyResearch = React.lazy(() =>
  import("./pages/staff/FacultyResearch")
);
const AdminFacultyResearch = React.lazy(() =>
  import("./pages/admin/AdminFacultyResearch")
);
const FacultyConsultancy = React.lazy(() =>
  import("./pages/staff/FacultyConsultancy")
);
const AdminFacultyConsultancy = React.lazy(() =>
  import("./pages/admin/AdminFacultyConsultancy")
);
const StudentsBatchUpload = React.lazy(() =>
  import("./pages/staff/StudentsBatchUpload.jsx")
);
const AdminStudentsBatchUpload = React.lazy(() =>
  import("./pages/admin/AdminStudentsBatchUpload.jsx")
);
const Achievements = React.lazy(() =>
  import("./pages/student/StudentsAchievements")
);
const ProjectUpload = React.lazy(() =>
  import("./pages/student/StudentsProjectUpload")
);
const Events = React.lazy(() => import("./pages/student/StudentsEventsReg"));
const ProjectsApproved = React.lazy(() => import("./pages/ProjectsApproved"));
const AchievementsApproved = React.lazy(() =>
  import("./pages/AchievementsApproved")
);
const ProjectDetail = React.lazy(() => import("./pages/ProjectDetail"));
const AchievementDetail = React.lazy(() => import("./pages/AchievementDetail"));
const Profile = React.lazy(() => import("./pages/Profile"));

// Keep these as regular imports (always needed)
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function RoleRedirect() {
  const { user } = useAuth();
  if (!user?.token) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;
  if (user.role === "staff") return <Navigate to="/staff" />;
  return <Navigate to="/student" />;
}

export default function App() {
  const location = useLocation();
  const path = (location?.pathname || "/").replace(/\/+$/, "") || "/";
  const hideBackButton =
    path === "/" ||
    path.startsWith("/admin") ||
    path.startsWith("/staff") ||
    path.startsWith("/student");
  // Show Back button on all non-dashboard routes (admin routes will render local Back inside pages)
  const showBackButton = !hideBackButton;
  return (
    <>
      <Navbar />
      {showBackButton && <BackButton />}
      <Suspense fallback={<LoadingFallback />}>
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
              <ProtectedRoute
                allowedRoles={["student", "alumni", "staff", "admin"]}
              >
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
          {/* Staff-friendly alias for the same upload page */}
          <Route
            path="/staff/projects/upload"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <ProjectUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                <AchievementDetail />
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quick-actions"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminQuickActions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/approved"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                <ProjectsApproved />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements/approved"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                <AchievementsApproved />
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
          {/* Admin management routes */}
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminProjectsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAchievementsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminEventsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verify-projects"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminVerifyProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verify-achievements"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminVerifyAchievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-events"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUploadEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-students-batch"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminStudentsBatchUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-extra-curricular"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUploadExtracurricular />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReportGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsersManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRoleUsersList role="student" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRoleUsersList role="staff" />
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
          {/* Redirect legacy staff root to new Home dashboard */}
          <Route path="/staff" element={<Navigate to="/" replace />} />

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
            path="/upload-extra-curricular"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <UploadExtracurricular />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-students-batch"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <StudentsBatchUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reports"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <ReportGenerator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty-participation"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <FacultyParticipation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/faculty-participation"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminFacultyParticipation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty-research"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <FacultyResearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty-research"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminFacultyResearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty-consultancy"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin"]}>
                <FacultyConsultancy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty-consultancy"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminFacultyConsultancy />
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
            path="/staff/upload-extra-curricular"
            element={<Navigate to="/upload-extra-curricular" replace />}
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
      </Suspense>
    </>
  );
}
