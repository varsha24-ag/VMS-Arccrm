"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { ActionList, Panel, SimpleTable, StatGrid } from "@/components/dashboard/panels";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

const stats = [
  { label: "Visitors Today", value: "146", delta: "+12%" },
  { label: "Pending Approvals", value: "18", delta: "-4%" },
  { label: "Active Employees", value: "62", delta: "+3%" },
  { label: "Security Alerts", value: "3", delta: "-1" }
];

const visitorTable = {
  headers: ["Name", "Host", "Purpose", "Status"],
  rows: [
    ["Riya Sharma", "Aman", "Interview", "Approved"],
    ["Rahul Jain", "Finance", "Audit", "Pending"],
    ["Sneha Patel", "IT", "Vendor Meeting", "Approved"],
    ["Karan Mehta", "Admin", "Compliance", "Rejected"]
  ]
};

const quickActions = [
  "Create receptionist account",
  "Review high-priority alerts",
  "Export weekly visitor report",
  "Update access permissions"
];

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Control user access, monitor visitor activity, and review operational health."
      modules={["Access Control", "Visitors", "Analytics", "Security", "Settings"]}
    >
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent Visitor Requests">
          <SimpleTable headers={visitorTable.headers} rows={visitorTable.rows} />
        </Panel>

        <Panel title="Quick Actions">
          <ActionList items={quickActions} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
