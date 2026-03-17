"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Panel, StatGrid, StatusList, TextList } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import Pagination from "@/components/ui/pagination";
import { apiFetch } from "@/lib/api";
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
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [modalKey, setModalKey] = useState<"pending" | "approved" | "checked_in" | "checked_out" | null>(null);
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(5);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "border-emerald-300/60 bg-emerald-500/15 text-emerald-400";
      case "pending":
        return "border-amber-300/60 bg-amber-500/15 text-amber-400";
      case "rejected":
        return "border-red-300/60 bg-red-500/15 text-red-400";
      case "checked_in":
        return "border-orange-300/60 bg-orange-500/15 text-orange-400";
      case "checked_out":
        return "border-slate-300/60 bg-slate-500/15 text-slate-400";
      default:
        return "border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)]";
    }
  };

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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8005";
    const source = new EventSource(`${baseUrl}/events/visits?token=${encodeURIComponent(token)}`);

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
    return [...history]
      .sort((a, b) => b.visit_id - a.visit_id)
      .slice(0, 5)
      .map((item) => ({
        title: item.visitor_name,
        subtitle: `${item.purpose ?? "Visit"} · Host: ${item.host_employee_id ? hostMap[item.host_employee_id] ?? "Unknown" : "Unassigned"
          }`,
        image: item.photo_url
          ? item.photo_url.startsWith("http")
            ? item.photo_url
            : `${baseUrl}${item.photo_url}`
          : null,
        status:
          item.status === "approved"
            ? "Approved"
            : item.status === "pending"
              ? "Pending"
              : item.status,
      }));
  }, [history, hostMap, baseUrl]);

  const checklistItems = useMemo(() => {
    const pending = history.filter((item) => item.status === "pending").length;
    const approved = history.filter((item) => item.status === "approved").length;
    const checkedIn = history.filter((item) => item.status === "checked_in").length;
    const checkedOut = history.filter((item) => item.status === "checked_out").length;
    return [
      { key: "pending" as const, label: "Pending approvals", count: pending },
      { key: "approved" as const, label: "Approved arrivals waiting", count: approved },
      { key: "checked_in" as const, label: "Currently checked-in", count: checkedIn },
      { key: "checked_out" as const, label: "Checked-out", count: checkedOut },
    ];
  }, [history]);

  const modalTitle = useMemo(() => {
    if (modalKey === "pending") return "Pending Approvals";
    if (modalKey === "approved") return "Approved Visitors";
    if (modalKey === "checked_in") return "Currently Checked-in";
    if (modalKey === "checked_out") return "Checked-out Visitors";
    return "";
  }, [modalKey]);

  const modalRows = useMemo(() => {
    if (!modalKey) return [];
    return history
      .filter((item) => item.status === modalKey)
      .sort((a, b) => b.visit_id - a.visit_id);
  }, [history, modalKey]);

  const modalTotalPages = Math.max(1, Math.ceil(modalRows.length / modalPageSize));
  const modalPagedRows = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize;
    return modalRows.slice(start, start + modalPageSize);
  }, [modalRows, modalPage, modalPageSize]);

  useEffect(() => {
    setModalPage(1);
  }, [modalKey, modalPageSize]);

  useEffect(() => {
    if (modalPage > modalTotalPages) {
      setModalPage(modalTotalPages);
    }
  }, [modalPage, modalTotalPages]);

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

        <Panel title="Today’s Checklist">
          <ul className="space-y-3 text-sm text-[var(--text-2)]">
            {checklistItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setModalKey(item.key)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text-2)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
                >
                  <span>{item.label}</span>
                  <span className="rounded-full border border-[var(--border-1)] bg-[var(--surface-1)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-1)]">
                    {item.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {modalKey ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-1)] px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">Today’s Checklist</p>
                <h3 className="text-xl font-semibold text-[var(--text-1)]">{modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalKey(null)}
                className="rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] p-2.5 text-[var(--text-2)] shadow-[var(--shadow-1)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-6 py-5">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-[var(--text-3)]">
                      <th className="pb-3 pr-4 font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                        Visitor
                      </th>
                      <th className="pb-3 pr-4 font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                        Phone
                      </th>
                      <th className="pb-3 pr-4 font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                        Host
                      </th>
                      <th className="pb-3 pr-4 font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                        Visit Time
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-1)]">
                    {modalPagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-[var(--text-3)]">
                          No visitors found for this status.
                        </td>
                      </tr>
                    ) : (
                      modalPagedRows.map((item) => (
                        <tr
                          key={item.visit_id}
                          className="border-t border-[var(--border-1)] transition hover:bg-[var(--surface-2)]"
                        >
                          <td className="py-4 pr-4 font-semibold text-[var(--text-1)]">{item.visitor_name}</td>
                          <td className="py-4 pr-4">{item.visitor_phone ?? "—"}</td>
                          <td className="py-4 pr-4">
                            {item.host_employee_id ? hostMap[item.host_employee_id] ?? "Unknown" : "Unassigned"}
                          </td>
                          <td className="py-4 pr-4">
                            {item.checkin_time
                              ? new Date(item.checkin_time).toLocaleString()
                              : item.checkout_time
                              ? new Date(item.checkout_time).toLocaleString()
                              : "—"}
                          </td>
                          <td className="py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                item.status
                              )}`}
                            >
                              {item.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-5">
                <Pagination
                  page={modalPage}
                  totalItems={modalRows.length}
                  pageSize={modalPageSize}
                  onPageChange={setModalPage}
                  onPageSizeChange={setModalPageSize}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
