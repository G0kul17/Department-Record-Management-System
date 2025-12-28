import React from "react";
import ProjectsManagement from "./ProjectsManagement";
import BackButton from "../../components/BackButton";

export default function VerifyProjects({ isAdminView = false }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {isAdminView && <BackButton />}
        <ProjectsManagement />
      </div>
    </div>
  );
}
