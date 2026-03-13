"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel, StatGrid, StatusList, TextList } from "@/components/dashboard/panels";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

type VisitHistoryItem = {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_phone?: string | null;
  visitor_email?: string | null;
  company?: string | null;
  photo_url?: string | null;
  host_employee_id?: number | null;
  purpose?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
  qr_code?: string | null;
};

export default function ReceptionDashboard() {
  const router = useRouter();
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    let mounted = true;

    async function loadData(isInitial = false) {
      if (isInitial && mounted) setLoading(true);
      try {
        const [historyData, hostData] = await Promise.all([
          apiFetch<VisitHistoryItem[]>("/visit/history"),
          apiFetch<Array<{ id: number; name: string }>>("/employees/hosts"),
        ]);
        if (!mounted) return;

        setHistory((prev) => {
          const next = historyData ?? [];
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });

        const map: Record<number, string> = {};
        (hostData ?? []).forEach((host) => {
          map[host.id] = host.name;
        });
        setHostMap((prev) => {
          return JSON.stringify(prev) === JSON.stringify(map) ? prev : map;
        });

      } catch (err) {
        if (!mounted) return;
        // Keep old data on transient network error, no need to wipe out the screen
      } finally {
        if (isInitial && mounted) setLoading(false);
      }
    }

    void loadData(true);

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString();
    const isToday = (value?: string | null) =>
      value ? new Date(value).toDateString() === todayKey : false;
    const checkinsToday = history.filter((item) => isToday(item.checkin_time)).length;
    const checkoutsToday = history.filter((item) => isToday(item.checkout_time)).length;
    const pending = history.filter((item) => item.status === "pending").length;
    const checkedInNow = history.filter((item) => item.status === "checked_in").length;
    return [
      { label: "Check-ins", value: String(checkinsToday), delta: "Today" },
      { label: "Check-outs", value: String(checkoutsToday), delta: "Today" },
      { label: "Pending Approval", value: String(pending), delta: "Awaiting host" },
      { label: "Checked-in Now", value: String(checkedInNow), delta: "Live" },
    ];
  }, [history]);

  const queueItems = useMemo(() => {
    return [...history]
      .filter((item) => item.status === "pending" || item.status === "approved")
      .sort((a, b) => b.visit_id - a.visit_id)
      .slice(0, 6)
      .map((item) => ({
        title: item.visitor_name,
        subtitle: `${item.purpose ?? "Visit"} · Host: ${item.host_employee_id ? hostMap[item.host_employee_id] ?? "Unknown" : "Unassigned"
          }`,
        status:
          item.status === "approved"
            ? "Approved"
            : item.status === "pending"
              ? "Pending"
              : item.status,
      }));
  }, [history, hostMap]);

  const checklistItems = useMemo(() => {
    const pending = history.filter((item) => item.status === "pending").length;
    const approved = history.filter((item) => item.status === "approved").length;
    const checkedIn = history.filter((item) => item.status === "checked_in").length;
    const checkedOut = history.filter((item) => item.status === "checked_out").length;
    return [
      `Pending approvals: ${pending}`,
      `Approved arrivals waiting: ${approved}`,
      `Currently checked-in: ${checkedIn}`,
      `Checked-out today: ${checkedOut}`,
    ];
  }, [history]);

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
        { label: "Manual Check-out", href: "/reception/manual-checkout" },
      ]}
    >
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Front Desk Queue"
          action={
            <span className="text-xs font-semibold text-slate-300">
              {loading ? "Updating..." : "Live"}
            </span>
          }
        >
          <StatusList items={queueItems} />
        </Panel>

        <Panel title="Today’s Checklist">
          <TextList items={checklistItems} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
