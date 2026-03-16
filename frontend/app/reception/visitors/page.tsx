"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import FilterBar from "@/components/ui/filter-bar";
import Pagination from "@/components/ui/pagination";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

type VisitHistoryItem = {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  id_number?: string | null;
  visitor_phone?: string | null;
  visitor_email?: string | null;
  company?: string | null;
  photo_url?: string | null;
  host_employee_id?: number | null;
  purpose?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
};

export default function ReceptionVisitorListPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<VisitHistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [historyData, hostData] = await Promise.all([
          apiFetch<VisitHistoryItem[]>("/visit/history"),
          apiFetch<Array<{ id: number; name: string }>>("/employees/hosts"),
        ]);
        if (!mounted) return;
        setHistory(historyData ?? []);
        const map: Record<number, string> = {};
        (hostData ?? []).forEach((host) => {
          map[host.id] = host.name;
        });
        setHostMap(map);
      } catch {
        if (!mounted) return;
        setHistory([]);
        setHostMap({});
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 12000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const queueRows = useMemo(() => {
    const todayKey = new Date().toDateString();
    const isToday = (value?: string | null) =>
      value ? new Date(value).toDateString() === todayKey : false;
    return history
      .filter((item) => item.status === "pending" || item.status === "approved")
      .filter(
        (item) =>
          item.status === "pending" ||
          isToday(item.checkin_time) ||
          isToday(item.checkout_time)
      )
      .sort((a, b) => b.visit_id - a.visit_id);
  }, [history]);

  const historyRows = useMemo(() => {
    return [...history].sort((a, b) => b.visit_id - a.visit_id);
  }, [history]);

  const statusOptions = useMemo(() => {
    const unique = new Set(historyRows.map((item) => item.status).filter(Boolean));
    return ["all", ...Array.from(unique).sort()];
  }, [historyRows]);

  const filteredHistoryRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedStatus = statusFilter.trim().toLowerCase();
    return historyRows.filter((item) => {
      if (normalizedStatus !== "all" && item.status.toLowerCase() !== normalizedStatus) {
        return false;
      }
      if (!query) return true;
      const hostName = item.host_employee_id ? hostMap[item.host_employee_id] ?? "" : "";
      const haystack = [
        item.visitor_name,
        item.visitor_id,
        item.id_number,
        item.company,
        item.visitor_email,
        item.visitor_phone,
        item.purpose,
        item.status,
        hostName,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [historyRows, hostMap, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistoryRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistoryRows.slice(start, start + pageSize);
  }, [filteredHistoryRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const detail =
    (selected && filteredHistoryRows.some((item) => item.visit_id === selected.visit_id) ? selected : null) ??
    filteredHistoryRows[0] ??
    null;

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Visitor List" subtitle="Front desk queue and full visitor history." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <Panel
            title="Front Desk Queue"
            action={
              <Link
                href="/reception/register"
                className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)]"
              >
                Add
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[var(--text-3)]">
                  <tr>
                    <th className="pb-3 pr-3">Visitor</th>
                    <th className="pb-3 pr-3">Purpose</th>
                    <th className="pb-3 pr-3">Host</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-1)]">
                  {queueRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-[var(--text-3)]">
                        {loading ? "Loading queue..." : "No visitors in queue."}
                      </td>
                    </tr>
                  ) : (
                    queueRows.map((item) => (
                      <tr
                        key={item.visit_id}
                        className="cursor-pointer border-t border-[var(--border-1)] transition hover:bg-[var(--surface-2)]"
                        onClick={() => setSelected(item)}
                      >
                        <td className="py-3 pr-3 font-semibold text-[var(--text-1)]">{item.visitor_name}</td>
                        <td className="py-3 pr-3">{item.purpose ?? "-"}</td>
                        <td className="py-3 pr-3">
                          {item.host_employee_id ? hostMap[item.host_employee_id] ?? "Unknown" : "Unassigned"}
                        </td>
                        <td className="py-3">{item.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Visitor List">
            <div className="mb-4">
              <FilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search visitor, ID, company, host..."
                selectValue={statusFilter}
                onSelectChange={setStatusFilter}
                selectOptions={statusOptions.map((status) => ({
                  value: status,
                  label: status === "all" ? "All statuses" : status,
                }))}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[var(--text-3)]">
                  <tr>
                    <th className="pb-3 pr-3">Sr. No.</th>
                    <th className="pb-3 pr-3">Visitor</th>
                    <th className="pb-3 pr-3">ID Card</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3">Check-in</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-1)]">
                  {filteredHistoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-[var(--text-3)]">
                        {loading ? "Loading visitors..." : "No visitors found for the current filter."}
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((item, idx) => (
                      <tr
                        key={item.visit_id}
                        className="cursor-pointer border-t border-[var(--border-1)] transition hover:bg-[var(--surface-2)]"
                        onClick={() => setSelected(item)}
                      >
                        <td className="py-3 pr-3">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="py-3 pr-3 font-semibold text-[var(--text-1)]">{item.visitor_name}</td>
                        <td className="py-3 pr-3">{item.id_number ?? "-"}</td>
                        <td className="py-3 pr-3">{item.status}</td>
                        <td className="py-3">
                          {item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Pagination
                page={page}
                totalItems={filteredHistoryRows.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </Panel>
        </div>

        <Panel title="Visitor Details">
          {detail ? (
            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-1)]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-3)] text-sm font-semibold text-[var(--text-1)]">
                  {detail.visitor_name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-[180px]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">Visitor</p>
                  <p className="text-xl font-semibold tracking-tight text-[var(--text-1)]">{detail.visitor_name}</p>
                  <p className="text-sm text-[var(--text-2)]">{detail.company ?? "—"}</p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    detail.status === "approved" ||
                    detail.status === "pending" ||
                    detail.status === "checked_in" ||
                    detail.status === "checked_out"
                      ? "border-[var(--nav-active-bg)] bg-[var(--nav-active-bg)] text-[var(--accent)]"
                      : detail.status === "rejected"
                      ? "border-rose-200/60 bg-rose-500/15 text-rose-400"
                      : "border-[var(--border-1)] bg-[var(--surface-1)] text-[var(--text-2)]"
                  }`}
                >
                  {detail.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Phone</p>
                  <p className="text-base text-[var(--text-1)]">{detail.visitor_phone ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Email</p>
                  <p className="text-base text-[var(--text-1)]">{detail.visitor_email ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Host</p>
                  <p className="text-base text-[var(--text-1)]">
                    {detail.host_employee_id ? hostMap[detail.host_employee_id] ?? "Unknown" : "Unassigned"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">ID Card</p>
                  <p className="text-base text-[var(--text-1)]">{detail.id_number ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Purpose</p>
                  <p className="text-base text-[var(--text-1)]">{detail.purpose ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Company</p>
                  <p className="text-base text-[var(--text-1)]">{detail.company ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Check-in</p>
                  <p className="text-base text-[var(--text-1)]">
                    {detail.checkin_time ? new Date(detail.checkin_time).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Check-out</p>
                  <p className="text-base text-[var(--text-1)]">
                    {detail.checkout_time ? new Date(detail.checkout_time).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-3)]">Select a visitor to view details.</p>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
