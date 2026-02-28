import React from "react";
import Home from "../Home";

// Admin dashboard renders Home without the "At a Glance" section.
export default function AdminDashboard() {
  return <Home hideAtAGlance />;
}
