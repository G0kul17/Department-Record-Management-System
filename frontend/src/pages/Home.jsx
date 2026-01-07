import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/axiosClient";
import EventsCarousel from "../components/EventsCarousel";
import AchievementsFeed from "../components/AchievementsFeed";
import BlurText from "../components/ui/BlurText";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [projCount, setProjCount] = useState(null);
  const [achCount, setAchCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [staffCount, setStaffCount] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [researchCount, setResearchCount] = useState(null);
  const [consultancyCount, setConsultancyCount] = useState(null);
  const [participationCount, setParticipationCount] = useState(null);

  // use shared events data
  // events is imported from ../data/events

  const goToQuickActions = () => {
    if (!user) return nav("/login");
    if (user.role === "admin") return nav("/admin/quick-actions");
    return nav("/quick-actions");
  };

  // carousel handled by EventsCarousel component

  useEffect(() => {
    // fetch stats and events (resilient: don't let one failure block others)
    let mounted = true;
    (async () => {
      const [p, a] = await Promise.allSettled([
        apiClient.get("/projects/count?verified=true"),
        apiClient.get("/achievements/count?verified=true"),
      ]);
      if (!mounted) return;
      setProjCount(p.status === "fulfilled" ? p.value?.count ?? 0 : 0);
      setAchCount(a.status === "fulfilled" ? a.value?.count ?? 0 : 0);

      // fetch latest 4 events (last added)
      try {
        const ev = await apiClient.get("/events?order=latest&limit=4");
        const evs = ev?.events || [];
        if (mounted) setEvents(evs);
      } catch (_) {
        if (mounted) setEvents([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Admin-only totals: students, staff, events
  useEffect(() => {
    let mounted = true;
    if (user?.role !== "admin") return;
    (async () => {
      try {
        const stats = await apiClient.get("/admin/stats");
        if (!mounted) return;
        setStudentCount(stats?.students ?? 0);
        setStaffCount(stats?.staff ?? 0);
        setEventCount(stats?.events ?? 0);
      } catch (e) {
        if (!mounted) return;
        setStudentCount(0);
        setStaffCount(0);
        setEventCount(0);
      }
      // Load admin-only faculty stats counts
      try {
        const [fr, fc, fp] = await Promise.all([
          apiClient.get("/faculty-research"),
          apiClient.get("/faculty-consultancy"),
          apiClient.get("/faculty-participations"),
        ]);
        if (!mounted) return;
        setResearchCount(Array.isArray(fr?.data) ? fr.data.length : 0);
        setConsultancyCount(Array.isArray(fc?.data) ? fc.data.length : 0);
        setParticipationCount(Array.isArray(fp?.data) ? fp.data.length : 0);
      } catch (e) {
        if (!mounted) return;
        setResearchCount(0);
        setConsultancyCount(0);
        setParticipationCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-800">
          <BlurText text="Sona College of Technology" />
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Your central hub for achievements, projects, and community engagement.
        </p>

        <div className="mt-10">
          <Button onClick={goToQuickActions} className="px-6 py-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M14 4l6 6-6 6-6-6 6-6z"
                fill="currentColor"
                opacity=".15"
              />
              <path
                d="M14 4l6 6-6 6m0-12l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-semibold">Explore Actions</span>
          </Button>
        </div>
      </div>

      {/* Events carousel (latest 4 events) */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <PageHeader title="Events" />
        <div className="mt-2">
          <EventsCarousel events={events} intervalMs={5000} />
        </div>
      </div>

      {/* Achievements feed below events for admin landing */}
      {user && <AchievementsFeed title="Recent Achievements" limit={12} />}

      {/* Stats */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <PageHeader title="At a Glance" />
        <div
          className={`grid gap-4 ${
            user?.role === "admin"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          <Card
            onClick={() => nav("/projects/approved")}
            className="p-6 glitter-card bulge-card"
          >
            <div className="text-sm font-semibold text-slate-800">Projects</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900">
                {projCount === null ? "—" : projCount}
              </div>
            </div>
          </Card>
          <Card
            onClick={() => nav("/achievements/approved")}
            className="p-6 glitter-card bulge-card"
          >
            <div className="text-sm font-semibold text-slate-800">
              Achievements
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-extrabold text-slate-900">
                {achCount === null ? "—" : achCount}
              </div>
            </div>
          </Card>
          {user?.role === "admin" && (
            <>
              <Card
                onClick={() => nav("/admin/students")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="text-sm font-semibold text-slate-800">
                  Students
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {studentCount === null ? "—" : studentCount}
                </div>
              </Card>
              <Card
                onClick={() => nav("/admin/staff")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="text-sm font-semibold text-slate-800">
                  Staff
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {staffCount === null ? "—" : staffCount}
                </div>
              </Card>
              <Card
                onClick={() => nav("/events")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="text-sm font-semibold text-slate-800">
                  Events
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {eventCount === null ? "—" : eventCount}
                </div>
              </Card>
              <Card
                onClick={() => nav("/faculty-research-approved")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="text-sm font-semibold text-slate-800">
                  Research Publications
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {researchCount === null ? "—" : researchCount}
                </div>
              </Card>
              <Card
                onClick={() => nav("/faculty-consultancy-approved")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="text-sm font-semibold text-slate-800">
                  Consultancy Projects
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {consultancyCount === null ? "—" : consultancyCount}
                </div>
              </Card>
              <Card
                onClick={() => nav("/faculty-participation-approved")}
                className="p-6 glitter-card bulge-card"
              >
                <div className="text-sm font-semibold text-slate-800">
                  Faculty Participation
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {participationCount === null ? "—" : participationCount}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
