import React from "react";
import EventsManagement from "./EventsManagement";
import BackButton from "../../components/BackButton";

export default function UploadEvents({ isAdminView = false }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {isAdminView && <BackButton />}
        <EventsManagement />
      </div>
    </div>
  );
}
