"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import AppDataGrid, { GridColDef } from "@/components/ui/app-data-grid";
import type {
  GridRenderCellParams,
  GridValueFormatter,
  GridValueGetter,
} from "@mui/x-data-grid";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface VisitHistoryItem {
  visit_id: number;
  visitor_name: string;
  status: string;
  created_at?: string | null;
  checkin_time?: string | null;
}

export default function ManualCheckoutPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist"] });
  const [visitId, setVisitId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);

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

  type VisitHistoryValueGetterParams = { row: VisitHistoryItem; api?: { getRowIndexRelativeToVisibleRows: (id: unknown) => number }; id?: unknown };

  const columns: GridColDef<VisitHistoryItem>[] = useMemo(
    () => [
      {
        field: "sr_no",
        headerName: "Sr. No.",
        width: 90,
        sortable: false,
        filterable: false,
        valueGetter: ((params: VisitHistoryValueGetterParams) => {
          if (!params?.api) return "";
          return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
        }) as GridValueGetter<VisitHistoryItem>,
      },
      {
        field: "visitor_name",
        headerName: "Visitor",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "checkin_time",
        headerName: "Check-in",
        flex: 1,
        minWidth: 180,
        valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.checkin_time ?? null) as GridValueGetter<VisitHistoryItem>,
        valueFormatter: ((value) =>
          value ? new Date(value as string).toLocaleString() : "-") as GridValueFormatter<VisitHistoryItem>,
      },
      {
        field: "actions",
        headerName: "Action",
        width: 140,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
          <button
            type="button"
            disabled={loading}
            onClick={() => setVisitId(String(params.row.visit_id))}
            className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-1)] hover:bg-[var(--surface-3)] disabled:opacity-60"
          >
            Use ID
          </button>
        ),
      },
      {
        field: "created_at",
        headerName: "Created",
        flex: 1,
        minWidth: 180,
        valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.created_at ?? null) as GridValueGetter<VisitHistoryItem>,
        valueFormatter: ((value) =>
          value ? new Date(value as string).toLocaleString() : "-") as GridValueFormatter<VisitHistoryItem>,
        renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
          <span>{params?.row?.created_at ? new Date(params.row.created_at).toLocaleString() : "-"}</span>
        ),
      },
    ],
    [loading]
  );

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
              className="whitespace-nowrap rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Checking out..." : "Check-out"}
            </button>
          </form>
          {message ? <p className="mt-3 text-sm text-[var(--text-2)]">{message}</p> : null}
        </Panel>

        <Panel title="Currently Checked In">
          <AppDataGrid
            rows={checkedInRows}
            columns={columns}
            getRowId={(row) => row.visit_id}
            loading={loading && checkedInRows.length === 0}
            searchPlaceholder="Search visitor or visit ID..."
            localeText={{
              noRowsLabel: loading ? "Loading checked-in visitors..." : "No checked-in visitors found.",
            }}
          />
        </Panel>
      </div>
    </DashboardLayout>
  );
}
