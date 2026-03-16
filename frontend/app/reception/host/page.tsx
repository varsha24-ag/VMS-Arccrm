"use client";

import { useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import HostSearch, { HostEmployee } from "@/components/entry-desk/host-search";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function ReceptionHostPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);
  const [selectedHost, setSelectedHost] = useState<HostEmployee | null>(null);

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Host Selection"
        subtitle="Search and select the employee who will host the visitor."
      />
      <div className="space-y-6">
        <EntryDeskHeader
          title="Host Directory"
          subtitle="Type a name or department to find a host."
        />

        <Panel title="Host Search">
          <HostSearch value={selectedHostId} onChange={setSelectedHostId} onSelectHost={setSelectedHost} />
          <p className="mt-1 text-xs text-[var(--text-3)]">
            Selected host email: {selectedHost?.email ?? "None"}
          </p>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
