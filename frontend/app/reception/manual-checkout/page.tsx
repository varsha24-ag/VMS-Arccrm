"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

interface VisitHistoryItem {
  visit_id: number;
  visitor_name: string;
  status: string;
  checkin_time?: string | null;
}

export default function ManualCheckoutPage() {
  const router = useRouter();
  const [visitId, setVisitId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist" && user.role !== "admin") {
      router.replace(getRoleRedirectPath(user.role));
    }
    void loadHistory();
  }, [router]);

  async function loadHistory() {
    try {
      const data = await apiFetch<VisitHistoryItem[]>("/visit/history");
      setHistory(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load history");
    }
  }

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await apiFetch("/visit/checkout", {
        method: "POST",
        body: JSON.stringify({ visit_id: Number(visitId) }),
      });
      setMessage("Check-out completed.");
      setVisitId("");
      await loadHistory();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Check-out failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Manual Check-out"
      subtitle="Check out visitors by visit ID when needed."
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
          title="Manual Check-out"
          subtitle="Use visit ID to complete check-out quickly."
        />

        <Panel title="Check-out by Visit ID">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCheckout}>
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Visit ID"
              value={visitId}
              onChange={(e) => setVisitId(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Checking out..." : "Check-out"}
            </button>
          </form>
          {message ? <p className="mt-3 text-sm text-[#ffc5aa]">{message}</p> : null}
        </Panel>

        <Panel title="Currently Checked In">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-300">
                  <th className="pb-3 pr-3">Visit ID</th>
                  <th className="pb-3 pr-3">Visitor</th>
                  <th className="pb-3 pr-3">Check-in</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                {history
                  .filter((item) => item.status === "checked_in")
                  .map((item) => (
                    <tr key={item.visit_id} className="border-t border-white/10">
                      <td className="py-3 pr-3">{item.visit_id}</td>
                      <td className="py-3 pr-3">{item.visitor_name}</td>
                      <td className="py-3 pr-3">
                        {item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => setVisitId(String(item.visit_id))}
                          className="rounded-md border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-60"
                        >
                          Use ID
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
