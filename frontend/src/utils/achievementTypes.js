import apiClient from "../api/axiosClient";

export const DEFAULT_ACHIEVEMENT_TYPES = [
  "Hackathon",
  "Paper presentation",
  "Coding competition",
  "Conference presentation",
  "Journal publications",
  "NPTEL certificate",
  "Internship certificate",
  "Other MOOC courses",
  "Sports",
  "Seminar",
  "Workshop",
  "Online certifications",
  "Extra curricular activities (NSS, NCC, etc.)",
];

export async function loadAchievementTypes() {
  try {
    const data = await apiClient.get(
      "/activity-coordinators/achievement-types",
    );
    const customTypes = data.achievementTypes || [];
    
    // Always append custom achievement types to default categories without overwriting
    const seen = new Set();
    const merged = [];

    for (const item of [...DEFAULT_ACHIEVEMENT_TYPES, ...customTypes]) {
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
    return DEFAULT_ACHIEVEMENT_TYPES;
  }
}
