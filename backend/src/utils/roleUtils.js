// Detect role by email pattern
export function detectRole(email) {
  const domain = "sonatech.ac.in";
  if (!email || !email.toLowerCase().endsWith(`@${domain}`)) return null;

  const local = email.split("@")[0];

  // Student: letters + optional dot + 2 digits + letters (e.g., gokulnathan.23ads or gokulnathan23ads)
  const studentRegex = /^[a-zA-Z]+\.?[0-9]{2}[a-zA-Z]+$/;

  // Staff: alphabetic local-part only (no digits)
  const staffRegex = /^[a-zA-Z]+$/;

  if (studentRegex.test(local)) return "student";
  if (staffRegex.test(local)) return "staff";

  return null;
}
