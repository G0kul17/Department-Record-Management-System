import React from "react";
import EventsManagement from "./EventsManagement";

export default function UploadEvents() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <EventsManagement />
      </div>
    </div>
  );
}
