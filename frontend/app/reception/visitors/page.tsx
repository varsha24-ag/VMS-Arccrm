"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import FilterBar from "@/components/ui/filter-bar";
import Pagination from "@/components/ui/pagination";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

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
  const router = useRouter();
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<VisitHistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist" && user.role !== "admin") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  useEffect(() => {
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
  }, []);

  const queueRows = useMemo(() => {
    return history
      .filter((item) => item.status === "pending" || item.status === "approved")
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

  return (
    <DashboardShell
      title="Visitor List"
      subtitle="Front desk queue and full visitor history."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Visitors", href: "/reception/visitors" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "History", href: "/reception/history" },
        { label: "Checkout", href: "/reception/manual-checkout" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <Panel
            title="Front Desk Queue"
            action={
              <Link
                href="/reception/register"
                className="rounded-md border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
              >
                Add
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-300">
                  <tr>
                    <th className="pb-3 pr-3">Visitor</th>
                    <th className="pb-3 pr-3">Purpose</th>
                    <th className="pb-3 pr-3">Host</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-100">
                  {queueRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-slate-400">
                        {loading ? "Loading queue..." : "No visitors in queue."}
                      </td>
                    </tr>
                  ) : (
                    queueRows.map((item) => (
                      <tr
                        key={item.visit_id}
                        className="cursor-pointer border-t border-white/10 transition hover:bg-white/5"
                        onClick={() => setSelected(item)}
                      >
                        <td className="py-3 pr-3 font-semibold text-white">{item.visitor_name}</td>
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
                <thead className="text-slate-300">
                  <tr>
                    <th className="pb-3 pr-3">Sr. No.</th>
                    <th className="pb-3 pr-3">Visitor</th>
                    <th className="pb-3 pr-3">ID Card</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3">Check-in</th>
                  </tr>
                </thead>
                <tbody className="text-slate-100">
                  {filteredHistoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-slate-400">
                        {loading ? "Loading visitors..." : "No visitors found for the current filter."}
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((item, idx) => (
                      <tr
                        key={item.visit_id}
                        className="cursor-pointer border-t border-white/10 transition hover:bg-white/5"
                        onClick={() => setSelected(item)}
                      >
                        <td className="py-3 pr-3">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="py-3 pr-3 font-semibold text-white">{item.visitor_name}</td>
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
            <div className="space-y-3 text-sm text-slate-200">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visitor</p>
                <p className="text-lg font-semibold text-white">{detail.visitor_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact</p>
                <p>{detail.visitor_phone ?? "-"}</p>
                <p>{detail.visitor_email ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Company</p>
                <p>{detail.company ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Host</p>
                <p>
                  {detail.host_employee_id
                    ? hostMap[detail.host_employee_id] ?? "Unknown"
                    : "Unassigned"}
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Purpose</p>
                  <p>{detail.purpose ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                  <p className="capitalize">{detail.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">ID Card</p>
                  <p>{detail.id_number ?? "-"}</p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Check-in</p>
                  <p>{detail.checkin_time ? new Date(detail.checkin_time).toLocaleString() : "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Check-out</p>
                  <p>{detail.checkout_time ? new Date(detail.checkout_time).toLocaleString() : "-"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select a visitor to view details.</p>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
