"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

interface VisitHistoryItem {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  company?: string;
  photo_url?: string;
  host_employee_id?: number | null;
  purpose?: string;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
}

export default function ReceptionHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist") {
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

  const historyWithPhotos = useMemo(() => {
    return history.map((item) => ({
      ...item,
      photo: item.photo_url
        ? item.photo_url.startsWith("http")
          ? item.photo_url
          : `${baseUrl}${item.photo_url}`
        : null,
    }));
  }, [history, baseUrl]);

  return (
    <DashboardShell
      title="Visit History"
      subtitle="Review recent visits with timestamps and photos."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
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
          title="Visit History"
          subtitle="Track check-ins and check-outs with captured photos."
        />

        <Panel title="History (Photo)">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-300">
                  <th className="pb-3 pr-3">Photo</th>
                  <th className="pb-3 pr-3">Visitor</th>
                  <th className="pb-3 pr-3">Purpose</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Check-in</th>
                  <th className="pb-3">Check-out</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                {historyWithPhotos.map((item) => (
                  <tr key={item.visit_id} className="border-t border-white/10">
                    <td className="py-3 pr-3">
                      {item.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photo} alt={item.visitor_name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-white/15 bg-white/5" />
                      )}
                    </td>
                    <td className="py-3 pr-3">{item.visitor_name}</td>
                    <td className="py-3 pr-3">{item.purpose ?? "-"}</td>
                    <td className="py-3 pr-3">{item.status}</td>
                    <td className="py-3 pr-3">{item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}</td>
                    <td className="py-3">{item.checkout_time ? new Date(item.checkout_time).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message ? <p className="mt-3 text-sm text-[#ffc5aa]">{message}</p> : null}
        </Panel>
      </div>
    </DashboardShell>
  );
}
