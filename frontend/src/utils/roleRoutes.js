// Role-based route permissions
export const roleRoutes = {
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  student: "/student/dashboard",
  alumni: "/student/dashboard",
};

export const routePermissions = {
  "/admin/dashboard": ["admin"],
  "/staff/dashboard": ["staff"],
  "/student/dashboard": ["student", "alumni"],
};

export const hasPermission = (userRole, route) => {
  const permissions = routePermissions[route];
  if (!permissions) return true; // Public route
  return permissions.includes(userRole);
};