const bannedEmailTokens = new Set([
  "cse",
  "ece",
  "eee",
  "mech",
  "civil",
  "it",
  "aids",
  "ads",
  "aiml",
  "csbs",
  "mca",
  "mba",
  "bca",
  "bsc",
  "msc",
  "ug",
  "pg",
  "dept",
  "department",
  "sonatech",
  "sona",
]);

const nameDecomposeMap = {
  gokulnathan: ["Gokul", "Nathan"],
};

function titleCase(word) {
  if (!word) return "";
  if (word.length === 1) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizeRawName(raw) {
  const parts = raw
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean)
    .map((p) => titleCase(p));
  return parts.join(" ");
}

function buildNameFromEmail(email) {
  if (!email) return "";
  const local = email.split("@")[0];
  const tokens = local.split(/[._-]+/);
  const words = [];
  for (const t of tokens) {
    const cleaned = t.replace(/\d+/g, "").trim();
    if (!cleaned) continue;
    const lc = cleaned.toLowerCase();
    if (bannedEmailTokens.has(lc)) continue;
    if (nameDecomposeMap[lc]) {
      words.push(...nameDecomposeMap[lc]);
    } else {
      words.push(titleCase(cleaned));
    }
  }
  return words.join(" ");
}

export function formatDisplayName(user) {
  if (!user) return "";
  const raw =
    user.fullName ||
    user.user_fullname ||
    (user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : null) ||
    user.name ||
    user.username ||
    "";

  if (typeof raw === "string" && raw.trim()) {
    const hasBanned = Array.from(bannedEmailTokens).some((tok) =>
      raw.toLowerCase().includes(tok)
    );
    const parts = raw.trim().split(/\s+/);
    const singleLongToken = parts.length === 1 && parts[0].length >= 12;
    if (!hasBanned && !singleLongToken) {
      return normalizeRawName(raw);
    }
    // Prefer email-derived segmentation if raw looks like an institutional string
    const fromEmail = buildNameFromEmail(user.email || "");
    if (fromEmail) return fromEmail;
    return normalizeRawName(raw);
  }
  const fromEmail = buildNameFromEmail(user.email || "");
  return fromEmail || "";
}

export function getInitials(name) {
  if (!name || typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}
