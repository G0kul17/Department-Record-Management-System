import React from "react";
import AchievementsManagement from "./AchievementsManagement";
import BackButton from "../../components/BackButton";

export default function VerifyAchievements({ isAdminView = false }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {isAdminView && <BackButton />}
        <AchievementsManagement />
      </div>
    </div>
  );
}
