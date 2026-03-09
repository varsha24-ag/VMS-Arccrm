export type UserRole = "admin" | "receptionist" | "employee";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
}

const TOKEN_KEY = "vms_access_token";
const USER_KEY = "vms_user";

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getRoleRedirectPath(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === "admin") return "/admin/dashboard";
  if (normalized === "receptionist") return "/reception/dashboard";
  return "/employee/dashboard";
}

export function normalizeRole(role: string): UserRole | null {
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "receptionist") return "receptionist";
  if (normalized === "employee") return "employee";
  return null;
}
