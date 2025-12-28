import React from "react";
import AchievementsManagement from "../staff/AchievementsManagement";
import BackButton from "../../components/BackButton";

export default function AdminAchievementsManagement() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <BackButton />
      <AchievementsManagement isAdminView />
    </div>
  );
}
