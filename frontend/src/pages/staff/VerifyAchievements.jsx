import React from "react";
import AchievementsManagement from "./AchievementsManagement";

export default function VerifyAchievements() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <AchievementsManagement />
      </div>
    </div>
  );
}
