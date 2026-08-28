import apiClient from "../api/axiosClient";

export const DEFAULT_FACULTY_EVENT_TYPES = [
  "Certification",
  "Conference Presentation",
  "Conference Publications",
  "FDP",
  "Hackathon",
  "Industrial Training",
  "Journal Publications",
  "NPTEL - FDP",
  "NPTEL Certification",
  "Professional Development Course",
  "Resource Person",
  "Reviewer",
  "Seminar",
  "Special Awards Received",
  "STTP",
  "Webinar",
  "Workshop",
];

export async function loadFacultyEventTypes() {
  try {
    const data = await apiClient.get("/faculty-participations/event-types");
    const customTypes = data.eventTypes || [];

    const seen = new Set();
    const merged = [];

    for (const item of [...DEFAULT_FACULTY_EVENT_TYPES, ...customTypes]) {
      if (!item) continue;
      const normalized = String(item).trim();
      const lower = normalized.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        merged.push(normalized);
      }
    }

    return merged;
  } catch {
    return DEFAULT_FACULTY_EVENT_TYPES;
  }
}
