"use client";

import { useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import PhotoCapture from "@/components/entry-desk/photo-capture";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function ReceptionPhotoPage() {
  const user = useAuthGuard({ allowedRoles: ["guard", "admin", "superadmin"] });
  const [photoUrl, setPhotoUrl] = useState("");

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Photo Capture" subtitle="Capture and preview visitor photos." />
      <div className="space-y-6">
        <EntryDeskHeader
          title="Photo Station"
          subtitle="Open the camera, capture a photo, and confirm the preview."
        />

        <Panel title="Camera">
          <PhotoCapture value={photoUrl} onChange={setPhotoUrl} />
        </Panel>
      </div>
    </DashboardLayout>
  );
}
