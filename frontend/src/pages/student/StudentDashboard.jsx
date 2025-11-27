import React from "react";
import { Navigate } from "react-router-dom";

// Deprecated: legacy dashboard. Always redirect to the new Home UI.
export default function StudentDashboard() {
  return <Navigate to="/" replace />;
}
