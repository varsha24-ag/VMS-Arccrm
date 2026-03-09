import { UserRole } from "@/lib/auth";

const MODULES_BY_ROLE: Record<UserRole, string[]> = {
  admin: ["Visitor Analytics", "User Management", "System Settings", "Audit Logs"],
  receptionist: ["Visitor Check-in", "Visitor Check-out", "Appointment Queue"],
  employee: ["My Visitors", "Host Approvals", "Visit History"]
};

export function getModulesForRole(role: UserRole): string[] {
  return MODULES_BY_ROLE[role];
}
