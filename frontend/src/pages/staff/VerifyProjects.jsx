import React from "react";
import ProjectsManagement from "./ProjectsManagement";
import BackButton from "../../components/BackButton";
import LayoutContainer from "../../components/ui/LayoutContainer";

export default function VerifyProjects({ isAdminView = false }) {
  return (
    <LayoutContainer maxWidth="lg" padding="md">
      {isAdminView && <BackButton />}
      <ProjectsManagement />
    </LayoutContainer>
  );
}
