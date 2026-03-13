import { UserRole } from "@/lib/auth";

export interface ModuleConfig {
  id: string;
  label: string;
  path: string;
  role: UserRole[];
}

export const MODULES: ModuleConfig[] = [
  // Admin Modules
  { id: "analytics", label: "Analytics", path: "/admin/dashboard", role: ["admin"] },
  { id: "reports", label: "Reports", path: "/admin/reports", role: ["admin"] },
  { id: "users", label: "User Management", path: "/admin/users", role: ["admin"] },
  { id: "settings", label: "System Settings", path: "/admin/settings", role: ["admin"] },
  { id: "audit", label: "Audit Logs", path: "/admin/audit", role: ["admin"] },

  // Receptionist Modules
  { id: "checkin", label: "Visitor Check-in", path: "/reception/checkin", role: ["receptionist", "admin"] },
  { id: "checkout", label: "Visitor Check-out", path: "/reception/checkout", role: ["receptionist", "admin"] },
  { id: "queue", label: "Appointment Queue", path: "/reception/queue", role: ["receptionist", "admin"] },

  // Employee Modules
  { id: "my-visitors", label: "My Visitors", path: "/employee/visitors", role: ["employee", "admin"] },
  { id: "approvals", label: "Host Approvals", path: "/employee/approvals", role: ["employee", "admin"] },
  { id: "history", label: "Visit History", path: "/employee/history", role: ["employee", "admin"] },
];

export function getModulesForRole(role: UserRole): ModuleConfig[] {
  return MODULES.filter(m => m.role.includes(role));
}
