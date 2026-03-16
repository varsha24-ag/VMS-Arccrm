"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import FilterBar from "@/components/ui/filter-bar";
import Pagination from "@/components/ui/pagination";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface VisitHistoryItem {
  visit_id: number;
  visitor_name: string;
  status: string;
  checkin_time?: string | null;
}

export default function ManualCheckoutPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [visitId, setVisitId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (!user) return;
    void loadHistory();
  }, [user]);

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

  const checkedInRows = useMemo(
    () =>
      history
        .filter((item) => item.status === "checked_in")
        .sort((a, b) => b.visit_id - a.visit_id),
    [history]
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return checkedInRows;
    return checkedInRows.filter((item) => {
      const haystack = [item.visitor_name, item.visit_id, item.checkin_time]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [checkedInRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Checkout" subtitle="Check out visitors by visit ID when needed." />
      <div className="space-y-6">
        <EntryDeskHeader
          title="Checkout"
          subtitle="Use visit ID to complete check-out quickly."
        />

        <Panel title="Check-out by Visit ID">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCheckout}>
            <input
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              placeholder="Visit ID"
              value={visitId}
              onChange={(e) => setVisitId(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Checking out..." : "Check-out"}
            </button>
          </form>
          {message ? <p className="mt-3 text-sm text-[var(--text-2)]">{message}</p> : null}
        </Panel>

        <Panel title="Currently Checked In">
          <div className="mb-4">
            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search visitor or visit ID..."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--text-3)]">
                  <th className="pb-3 pr-3">Sr. No.</th>
                  <th className="pb-3 pr-3">Visitor</th>
                  <th className="pb-3 pr-3">Check-in</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-1)]">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-[var(--text-3)]">
                      {loading ? "Loading checked-in visitors..." : "No checked-in visitors found."}
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((item, idx) => (
                    <tr key={item.visit_id} className="border-t border-[var(--border-1)]">
                      <td className="py-3 pr-3">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="py-3 pr-3">{item.visitor_name}</td>
                      <td className="py-3 pr-3">
                        {item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => setVisitId(String(item.visit_id))}
                          className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-1)] hover:bg-[var(--surface-3)] disabled:opacity-60"
                        >
                          Use ID
                        </button>
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
              totalItems={filteredRows.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
