export type UserRole = "admin" | "guard" | "employee" | "superadmin";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
}

const TOKEN_KEY = "vms_access_token";
const USER_KEY = "vms_user";

type JwtPayload = {
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }
  return token;
}

export function getAuthUser(): AuthUser | null {
  if (!getAccessToken()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getRoleRedirectPath(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === "admin" || normalized === "superadmin") return "/admin/dashboard";
  if (normalized === "guard") return "/guard/dashboard";
  return "/employee/dashboard";
}

export function normalizeRole(role: string): UserRole | null {
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "guard") return "guard";
  if (normalized === "employee") return "employee";
  if (normalized === "superadmin") return "superadmin";
  return null;
}
