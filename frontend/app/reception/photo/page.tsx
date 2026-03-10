"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import PhotoCapture from "@/components/entry-desk/photo-capture";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

export default function ReceptionPhotoPage() {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState("");

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
      title="Photo Capture"
      subtitle="Capture and preview visitor photos."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "QR Check-in", href: "/reception/qr-checkin" },
        { label: "History", href: "/reception/history" },
      ]}
    >
      <div className="space-y-6">
        <EntryDeskHeader
          title="Photo Station"
          subtitle="Open the camera, capture a photo, and confirm the preview."
        />

        <Panel title="Camera">
          <PhotoCapture value={photoUrl} onChange={setPhotoUrl} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
