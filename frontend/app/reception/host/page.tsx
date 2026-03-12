"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import HostSearch from "@/components/entry-desk/host-search";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

export default function ReceptionHostPage() {
  const router = useRouter();
  const [hostId, setHostId] = useState<number | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist" && user.role !== "admin") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  return (
    <DashboardShell
      title="Host Selection"
      subtitle="Search and select the employee who will host the visitor."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Visitors", href: "/reception/visitors" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "QR Check-in", href: "/reception/qr-checkin" },
        { label: "History", href: "/reception/history" },
        { label: "Manual Check-out", href: "/reception/manual-checkout" },
      ]}
    >
      <div className="space-y-6">
        <EntryDeskHeader
          title="Host Directory"
          subtitle="Type a name or department to find a host."
        />

        <Panel title="Host Search">
          <HostSearch value={hostId} onChange={setHostId} />
          <p className="mt-3 text-xs text-slate-300">
            Selected host ID: {hostId ?? "None"}
          </p>
        </Panel>
      </div>
    </DashboardShell>
  );
}
