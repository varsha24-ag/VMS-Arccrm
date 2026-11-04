"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import AppDataGrid, {
  GridColDef,
  type GridRenderCellParams,
} from "@/components/ui/app-data-grid";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface VisitHistoryItem {
  visit_id: number;
  id_number?: string | null;
  visitor_name: string;
  status: string;
  created_at?: string | null;
  checkin_time?: string | null;
}

interface CheckoutCandidate {
  visit_id: number;
  visitor_name: string;
  id_number?: string | null;
}

export default function ManualCheckoutPage() {
  const user = useAuthGuard({ allowedRoles: ["guard", "admin", "superadmin"] });
  const { pushToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [checkoutCandidate, setCheckoutCandidate] = useState<CheckoutCandidate | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<VisitHistoryItem[]>("/visit/history");
      setHistory(data ?? []);
    } catch (err) {
      pushToast({
        title: "Failed to load history",
        description: err instanceof Error ? err.message : "Failed to load history",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (!user) return;
    void loadHistory();
  }, [user, loadHistory]);

  async function submitCheckout(candidate: CheckoutCandidate) {
    setLoading(true);
    try {
      const bodyPayload = candidate.visit_id > 0
        ? { visit_id: candidate.visit_id }
        : { id_number: candidate.id_number };

      await apiFetch("/visit/checkout", {
        method: "POST",
        body: JSON.stringify(bodyPayload),
      });

      pushToast({
        title: "Visitor Checked OUT",
        description: `${candidate.visitor_name} was checked out successfully.`,
        variant: "success",
      });
      setSearchInput("");
      setCheckoutCandidate(null);
      await loadHistory();
    } catch (err) {
      pushToast({
        title: "OUT failed",
        description: err instanceof Error ? err.message : "OUT failed",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const checkedInRows = useMemo(
    () =>
      history
        .filter((item) => item.status === "checked_in" || item.status === "IN")
        .sort((a, b) => b.visit_id - a.visit_id),
    [history]
  );

  function handleCheckoutSubmit(e: FormEvent) {
    e.preventDefault();
    const query = searchInput.trim().toLowerCase();
    if (!query) return;

    // Match by id_number, visitor_name, or visit_id
    const matched = checkedInRows.find(
      (r) =>
        (r.id_number && r.id_number.toLowerCase() === query) ||
        r.visitor_name.toLowerCase().includes(query) ||
        String(r.visit_id) === query
    );

    if (matched) {
      setCheckoutCandidate({
        visit_id: matched.visit_id,
        visitor_name: matched.visitor_name,
        id_number: matched.id_number,
      });
    } else {
      // Direct ID card check-out candidate
      setCheckoutCandidate({
        visit_id: 0,
        visitor_name: `ID Card ${searchInput.trim()}`,
        id_number: searchInput.trim(),
      });
    }
  }

  type VisitHistoryValueGetterParams = { row: VisitHistoryItem; id?: unknown; index: number };

  const columns: GridColDef<VisitHistoryItem>[] = useMemo(
    () => [
      {
        field: "sr_no",
        headerName: "Sr. No.",
        width: 80,
        sortable: false,
        filterable: false,
        valueGetter: ((params: VisitHistoryValueGetterParams) => params.index + 1),
        renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => params.index + 1,
      },
      {
        field: "visitor_name",
        headerName: "Visitor",
        flex: 1,
        minWidth: 160,
        filterable: true,
      },
      {
        field: "id_number",
        headerName: "ID Card",
        width: 150,
        filterable: true,
        valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.id_number ?? "No ID Card"),
        renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
          <span
            className={`block truncate text-xs ${
              !params.row.id_number
                ? "text-[var(--text-3)] italic"
                : "font-semibold text-[var(--accent)]"
            }`}
          >
            {params.row.id_number || "No ID Card"}
          </span>
        ),
      },
      {
        field: "checkin_time",
        headerName: "IN Time",
        flex: 1,
        minWidth: 160,
        filterable: false,
        valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.checkin_time ?? null),
        valueFormatter: ((value) =>
          value ? new Date(value as string).toLocaleString() : "-"),
      },
      {
        field: "actions",
        headerName: "Action",
        width: 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setCheckoutCandidate({
                visit_id: params.row.visit_id,
                visitor_name: params.row.visitor_name,
                id_number: params.row.id_number,
              })
            }
            title={`Check out ${params.row.visitor_name}`}
            className="rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1 active:scale-95 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>OUT</span>
          </button>
        ),
      },
    ],
    [loading]
  );

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Visitor OUT (Manual Checkout)"
        subtitle="Check out any checked-in visitor with or without an ID card."
      />
      <div className="space-y-4">
        <EntryDeskHeader
          title="Manual Checkout"
          subtitle="Search by ID card or visitor name, or click OUT directly from the active visitors list."
        />

        <Panel title="Quick OUT by ID Card or Visitor Name">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCheckoutSubmit}>
            <input
              className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Enter ID Card Number or Visitor Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="whitespace-nowrap rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Find & OUT"}
            </button>
          </form>
        </Panel>

        <Panel title={`Currently IN (${checkedInRows.length})`}>
          <AppDataGrid
            rows={checkedInRows}
            columns={columns}
            getRowId={(row) => row.visit_id}
            loading={loading && checkedInRows.length === 0}
            searchPlaceholder="Search visitor or ID card..."
            localeText={{
              noRowsLabel: loading ? "Loading checked-in visitors..." : "No active checked-in visitors.",
            }}
          />
        </Panel>
      </div>

      {checkoutCandidate ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              <h2 className="text-lg font-bold text-[var(--text-1)]">Confirm Visitor OUT</h2>
            </div>
            <p className="mt-3 text-sm text-[var(--text-2)] leading-relaxed">
              Are you sure you want to check out{" "}
              <strong className="text-[var(--text-1)] font-semibold">{checkoutCandidate.visitor_name}</strong>?
            </p>
            <div className="mt-2 p-3 rounded-xl bg-[var(--surface-2)] text-xs text-[var(--text-3)] flex items-center justify-between">
              <span>ID Card:</span>
              <span className="font-semibold text-[var(--text-1)]">
                {checkoutCandidate.id_number || "None (Checked in via QR code)"}
              </span>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutCandidate(null)}
                disabled={loading}
                className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitCheckout(checkoutCandidate)}
                disabled={loading}
                className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-orange-500 disabled:opacity-60 flex items-center gap-1.5"
              >
                {loading ? "Processing..." : "Confirm OUT"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
