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
  { id: "admin-visitors", label: "Visitors", path: "/reception/visitors", role: ["admin"] },
  { id: "admin-passes", label: "Visitor Access Pass", path: "/admin/passes", role: ["admin"] },
  { id: "settings", label: "System Settings", path: "/admin/settings", role: ["admin"] },

  // Receptionist Modules
  { id: "reception-dashboard", label: "Dashboard", path: "/reception/dashboard", role: ["receptionist"] },
  { id: "reception-visitors", label: "Visitors", path: "/reception/visitors", role: ["receptionist"] },
  { id: "reception-register", label: "Register", path: "/reception/register", role: ["receptionist"] },
  { id: "reception-photo", label: "Photo", path: "/reception/photo", role: ["receptionist"] },
  { id: "reception-host", label: "Host", path: "/reception/host", role: ["receptionist"] },
  { id: "reception-checkin", label: "Check-in", path: "/reception/qr-checkin", role: ["receptionist"] },
  { id: "reception-qr-scanner", label: "QR Scanner", path: "/reception/qr-scanner", role: ["receptionist"] },
  { id: "reception-qr-visitor", label: "QR Visitor", path: "/reception/qr-visitor", role: ["receptionist"] },
  { id: "reception-checkout", label: "Checkout", path: "/reception/manual-checkout", role: ["receptionist"] },
  { id: "reception-history", label: "History", path: "/reception/history", role: ["receptionist"] },

  // Employee Modules
  { id: "employee-dashboard", label: "Dashboard", path: "/employee/dashboard", role: ["employee"] },
  { id: "employee-visitors", label: "My Visitor", path: "/employee/visitors", role: ["employee"] },
  { id: "employee-pending-approvals", label: "Pending Approvals", path: "/employee/visitors?view=pending", role: ["employee"] },
  { id: "employee-approved", label: "Approved", path: "/employee/visitors?view=approved", role: ["employee"] },
  { id: "employee-missed", label: "Missed", path: "/employee/visitors?view=missed", role: ["employee"] },
  { id: "employee-passes", label: "Visitor Access Pass", path: "/employee/passes", role: ["employee"] },
];

export function getModulesForRole(role: UserRole): ModuleConfig[] {
  return MODULES.filter(m => m.role.includes(role));
}
