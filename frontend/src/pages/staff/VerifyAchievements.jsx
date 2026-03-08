import React from "react";
import AchievementsManagement from "./AchievementsManagement";
import BackButton from "../../components/BackButton";
import LayoutContainer from "../../components/ui/LayoutContainer";

export default function VerifyAchievements({ isAdminView = false }) {
  return (
    <LayoutContainer maxWidth="lg" padding="md">
      {isAdminView && <BackButton />}
      <AchievementsManagement />
    </LayoutContainer>
  );
}
