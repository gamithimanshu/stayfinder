export function getSafeReturnPath(from) {
  if (!from || typeof from !== "string") return "/";
  if (!from.startsWith("/")) return "/";
  if (from.startsWith("//")) return "/";
  return from;
}

export function getRoleHome(user) {
  if (user?.role === "admin" || user?.isAdmin) return "/admin";
  if (user?.role === "owner") return "/owner";
  return "/";
}
