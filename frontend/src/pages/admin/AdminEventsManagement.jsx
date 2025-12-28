import React from "react";
import EventsManagement from "../staff/EventsManagement";
import BackButton from "../../components/BackButton";

export default function AdminEventsManagement() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <BackButton />
      <EventsManagement isAdminView />
    </div>
  );
}
