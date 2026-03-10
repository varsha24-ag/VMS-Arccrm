"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

export default function ReceptionQrCheckinPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

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

  async function handleQrCheckin(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await apiFetch("/visit/qr-checkin", {
        method: "POST",
        body: JSON.stringify({ qr_code: qrCode, policy_accepted: policyAccepted }),
      });
      setMessage("QR check-in completed.");
      pushToast({
        title: "Check-in completed",
        description: "QR check-in successful.",
        variant: "success",
      });
      setQrCode("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "QR check-in failed";
      setMessage(errorMessage);
      pushToast({
        title: "Check-in failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="QR Check-in"
      subtitle="Scan or paste a QR code to complete a check-in."
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
          title="QR Fast Check-in"
          subtitle="Use QR codes for returning visitors and access passes."
        />

        <Panel title="QR Code">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleQrCheckin}>
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Scan or paste QR code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Checking in..." : "Check-in"}
            </button>
          </form>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={policyAccepted}
              onChange={(e) => setPolicyAccepted(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#ff7a45]"
            />
            Policy agreement accepted
          </label>
          {message ? <p className="mt-3 text-sm text-[#ffc5aa]">{message}</p> : null}
        </Panel>
      </div>
    </DashboardShell>
  );
}
