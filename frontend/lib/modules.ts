import { UserRole } from "@/lib/auth";

export interface ModuleConfig {
  id: string;
  label: string;
  path: string;
  role: UserRole[];
}

export const MODULES: ModuleConfig[] = [
  // Admin Modules
  { id: "admin-dashboard", label: "Dashboard", path: "/admin/dashboard", role: ["admin"] },
  { id: "reports", label: "Reports", path: "/admin/reports", role: ["admin"] },
  { id: "users", label: "User Management", path: "/admin/users", role: ["admin"] },
  { id: "admin-history", label: "Visitors", path: "/reception/visitors", role: ["admin"] },
  { id: "settings", label: "System Settings", path: "/admin/settings", role: ["admin"] },
  { id: "audit", label: "Audit Logs", path: "/admin/audit", role: ["admin"] },

  // Receptionist Modules
  { id: "reception-dashboard", label: "Dashboard", path: "/reception/dashboard", role: ["receptionist"] },
  { id: "reception-visitors", label: "Visitors", path: "/reception/visitors", role: ["receptionist"] },
  { id: "reception-register", label: "Register", path: "/reception/register", role: ["receptionist"] },
  { id: "reception-photo", label: "Photo", path: "/reception/photo", role: ["receptionist"] },
  { id: "reception-host", label: "Host", path: "/reception/host", role: ["receptionist"] },
  { id: "reception-checkin", label: "Check-in", path: "/reception/qr-checkin", role: ["receptionist"] },
  { id: "reception-history", label: "History", path: "/reception/history", role: ["receptionist"] },
  { id: "reception-checkout", label: "Checkout", path: "/reception/manual-checkout", role: ["receptionist"] },

  // Employee Modules
  { id: "employee-dashboard", label: "Dashboard", path: "/employee/dashboard", role: ["employee"] },
];

export function getModulesForRole(role: UserRole): ModuleConfig[] {
  return MODULES.filter(m => m.role.includes(role));
}
