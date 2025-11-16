import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import events from "../data/events";
import EventCard from "../components/EventCard";

function GrantBox({ grant }) {
  if (!grant) return null;
  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
      <h4 className="text-md font-semibold">{grant.title}</h4>
      <div className="mt-2 text-sm text-slate-600">{grant.description}</div>
      <div className="mt-3 flex gap-4">
        <div className="text-sm">
          <div className="text-xs text-slate-500">Amount</div>
          <div className="font-bold">{grant.amount}</div>
        </div>
        <div className="text-sm">
          <div className="text-xs text-slate-500">Eligibility</div>
          <div className="font-medium">{grant.eligibility}</div>
        </div>
      </div>
      <a
        href={grant.apply_link}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Apply / More details
      </a>
    </div>
  );
}

export default function Events() {
  const { id } = useParams();
  const nav = useNavigate();

  if (id) {
    const ev = events.find((e) => String(e.id) === String(id));
    if (!ev)
      return (
        <div className="p-8">
          <h3 className="text-xl">Event not found</h3>
          <Link to="/events" className="text-blue-600 underline">
            Back to events
          </Link>
        </div>
      );

    return (
      <div className="mx-auto max-w-4xl p-8">
        <button
          onClick={() => nav(-1)}
          className="mb-6 text-sm text-slate-600 underline"
        >
          ← Back
        </button>

        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 p-12 text-white shadow-lg">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {ev.title}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Events</h1>
      <p className="mt-2 text-sm text-slate-600">Upcoming and recent events with grant details.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <EventCard key={ev.id} id={ev.id} title={ev.title} summary={ev.summary} date={ev.date} location={ev.location} grant={ev.grant} to={`/events/${ev.id}`} />
        ))}
      </div>
    </div>
  );
}
