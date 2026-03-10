"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel, StatGrid, StatusList, TextList } from "@/components/dashboard/panels";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

const stats = [
  { label: "Check-ins", value: "58", delta: "+9" },
  { label: "Expected Guests", value: "31", delta: "Today" },
  { label: "Waiting", value: "6", delta: "Now" },
  { label: "Escalations", value: "1", delta: "Low" }
];

const queueItems = [
  { title: "Nisha Rao", subtitle: "Meeting with HR", status: "Waiting" },
  { title: "Vikram Singh", subtitle: "Document Verification", status: "Called" },
  { title: "Vendor Team", subtitle: "Maintenance", status: "Checked-in" },
  { title: "Girish Patel", subtitle: "Interview", status: "Waiting" }
];

const checklistItems = [
  "Verify visitor IDs",
  "Notify hosts on arrival",
  "Issue temporary badges",
  "Capture check-out signatures"
];

export default function ReceptionDashboard() {
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  return (
    <DashboardShell
      title="Reception Dashboard"
      subtitle="Manage check-ins, appointment flow, and visitor desk operations in real time."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "QR Check-in", href: "/reception/qr-checkin" },
        { label: "History", href: "/reception/history" },
      ]}
    >
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Front Desk Queue">
          <StatusList items={queueItems} />
        </Panel>

        <Panel title="Today’s Checklist">
          <TextList items={checklistItems} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
