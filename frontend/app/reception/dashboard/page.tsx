"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Panel, StatGrid, StatusList } from "@/components/dashboard/panels";
import { TodaysChecklistPanel } from "@/components/dashboard/todays-checklist";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useAuthGuard } from "@/lib/use-auth-guard";

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
  const user = useAuthGuard({ allowedRoles: ["receptionist"] });
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const [historyData, hostData] = await Promise.all([
          apiFetch<VisitHistoryItem[]>("/visit/history"),
          apiFetch<Array<{ id: number; name: string }>>("/employees/hosts"),
        ]);

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
      } catch {
        // Keep old data on transient network error, no need to wipe out the screen
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!user) return;
    void loadData(true);
  }, [loadData, user]);

  useEffect(() => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;
    const source = new EventSource(`${API_BASE_URL}/events/visits?token=${encodeURIComponent(token)}`);

    source.onmessage = () => {
      void loadData();
    };
    source.onerror = () => {
      source.close();
    };
    return () => {
      source.close();
    };
  }, [loadData, user]);

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
    const todayKey = new Date().toDateString();
    const isToday = (value?: string | null) =>
      value ? new Date(value).toDateString() === todayKey : false;
    return [...history]
      .filter((item) => item.status === "pending" || item.status === "approved")
      .filter((item) => isToday(item.checkin_time) || isToday(item.checkout_time))
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

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Reception Dashboard"
        subtitle="Manage check-ins, appointment flow, and visitor desk operations in real time."
      />
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Front Desk Queue"
          action={
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-3)]">
                {loading ? "Updating..." : "Live"}
              </span>
              <Link
                href="/reception/visitors"
                className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)]"
              >
                View all
              </Link>
            </div>
          }
        >
          <StatusList items={queueItems} />
        </Panel>

        <TodaysChecklistPanel history={history} hostMap={hostMap} />
      </div>
    </DashboardLayout>
  );
}
