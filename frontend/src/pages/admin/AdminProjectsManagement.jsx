import React from "react";
import ProjectsManagement from "../staff/ProjectsManagement";
import BackButton from "../../components/BackButton";

export default function AdminProjectsManagement() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <BackButton />
      <ProjectsManagement isAdminView />
    </div>
  );
}
