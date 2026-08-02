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
];

export async function loadAchievementTypes() {
  try {
    const data = await apiClient.get(
      "/activity-coordinators/achievement-types",
    );
    const achievementTypes = data.achievementTypes || [];
    return achievementTypes.length
      ? achievementTypes
      : DEFAULT_ACHIEVEMENT_TYPES;
  } catch {
    return DEFAULT_ACHIEVEMENT_TYPES;
  }
}
