"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import AppDataGrid, { GridColDef } from "@/components/ui/app-data-grid";
import type {
  GridRenderCellParams,
  GridRowParams,
  GridValueFormatter,
  GridValueGetter,
} from "@mui/x-data-grid";
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
  created_at?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
};

export default function ReceptionVisitorListPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  type QueueValueGetterParams = { row: QueueRow };
  type HistoryValueGetterParams = { row: HistoryRow; api?: { getRowIndexRelativeToVisibleRows: (id: unknown) => number }; id?: unknown };

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
  const statusLabel = (status: string) => status.replace(/_/g, " ");
  const statusValueOptions = ["approved", "pending", "rejected", "checked_in", "checked_out"];

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

  const queueRowsWithHost = useMemo(() => {
    return queueRows.map((item) => ({
      ...item,
      host_name: item.host_employee_id ? hostMap[item.host_employee_id] ?? "Unknown" : "Unassigned",
      status_label: statusLabel(item.status),
    }));
  }, [queueRows, hostMap]);

  const historyRowsWithHost = useMemo(() => {
    return historyRows.map((item) => ({
      ...item,
      host_name: item.host_employee_id ? hostMap[item.host_employee_id] ?? "Unknown" : "Unassigned",
      status_label: statusLabel(item.status),
      photo:
        item.photo_url
          ? item.photo_url.startsWith("http")
            ? item.photo_url
            : `${baseUrl}${item.photo_url}`
          : null,
    }));
  }, [historyRows, hostMap, baseUrl]);

  const detail = useMemo(() => {
    if (historyRowsWithHost.length === 0) return null;
    const selected = historyRowsWithHost.find((item) => item.visit_id === selectedVisitId);
    return selected ?? historyRowsWithHost[0];
  }, [historyRowsWithHost, selectedVisitId]);

  type QueueRow = VisitHistoryItem & { host_name: string; status_label: string };
  type HistoryRow = VisitHistoryItem & { host_name: string; status_label: string; photo: string | null };

  const queueColumns: GridColDef<QueueRow>[] = [
    {
      field: "visitor_name",
      headerName: "Visitor",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "purpose",
      headerName: "Purpose",
      type: "string",
      flex: 1,
      minWidth: 160,
      valueGetter: ((params: QueueValueGetterParams) =>
        String(params?.row?.purpose ?? "").trim().toLowerCase()) as GridValueGetter<QueueRow>,
      renderCell: (params: GridRenderCellParams<QueueRow>) => (
        <span>{String(params?.row?.purpose ?? "").trim() || "-"}</span>
      ),
    },
    {
      field: "host_name",
      headerName: "Host",
      type: "string",
      flex: 1,
      minWidth: 160,
      filterable: true,
      valueGetter: ((params: QueueValueGetterParams) =>
        String(params?.row?.host_name ?? "").trim().toLowerCase()) as GridValueGetter<QueueRow>,
      renderCell: (params: GridRenderCellParams<QueueRow>) => (
        <span>{params?.row?.host_name ?? "Unknown"}</span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      type: "singleSelect",
      valueOptions: statusValueOptions,
      flex: 0.7,
      minWidth: 140,
      sortable: true,
      valueFormatter: ((value) =>
        statusLabel(String(value ?? ""))) as GridValueFormatter<QueueRow>,
      renderCell: (params: GridRenderCellParams<QueueRow>) => (
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(String(params?.row?.status ?? ""))}`}>
          {statusLabel(String(params?.row?.status ?? ""))}
        </span>
      ),
    },
  ];

  const listColumns: GridColDef<HistoryRow>[] = [
    {
      field: "sr_no",
      headerName: "Sr. No.",
      width: 90,
      sortable: false,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => {
        if (!params?.api) return "";
        return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
      }) as GridValueGetter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => {
        if (!params?.api) return "";
        return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
      },
    },
    {
      field: "visitor_name",
      headerName: "Visitor",
      flex: 1,
      minWidth: 170,
    },
    {
      field: "host_name",
      headerName: "Host",
      type: "string",
      flex: 1,
      minWidth: 160,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) =>
        String(params?.row?.host_name ?? "").trim().toLowerCase()) as GridValueGetter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => (
        <span>{params?.row?.host_name ?? "Unknown"}</span>
      ),
    },
    {
      field: "id_number",
      headerName: "ID Card",
      flex: 0.8,
      minWidth: 140,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.id_number ?? "-") as GridValueGetter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => <span>{params?.row?.id_number ?? "-"}</span>,
    },
    {
      field: "status",
      headerName: "Status",
      type: "singleSelect",
      valueOptions: statusValueOptions,
      flex: 0.8,
      minWidth: 150,
      valueFormatter: ((value) =>
        statusLabel(String(value ?? ""))) as GridValueFormatter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => (
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(String(params?.row?.status ?? ""))}`}>
          {statusLabel(String(params?.row?.status ?? ""))}
        </span>
      ),
    },
    {
      field: "checkin_time",
      headerName: "Check-in",
      flex: 1,
      minWidth: 180,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.checkin_time ?? null) as GridValueGetter<HistoryRow>,
      valueFormatter: ((value) =>
        value ? new Date(value as string).toLocaleString() : "-") as GridValueFormatter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => (
        <span>
          {params?.row?.checkin_time ? new Date(params.row.checkin_time).toLocaleString() : "-"}
        </span>
      ),
    },
    {
      field: "created_at",
      headerName: "Created",
      flex: 1,
      minWidth: 180,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.created_at ?? null) as GridValueGetter<HistoryRow>,
      valueFormatter: ((value) =>
        value ? new Date(value as string).toLocaleDateString() : "-") as GridValueFormatter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => (
        <span>{params?.row?.created_at ? new Date(params.row.created_at).toLocaleDateString() : "-"}</span>
      ),
    },
    {
      field: "company",
      headerName: "Company",
      flex: 1,
      minWidth: 160,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.company ?? "-") as GridValueGetter<HistoryRow>,
    },
    {
      field: "visitor_email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.visitor_email ?? "-") as GridValueGetter<HistoryRow>,
    },
    {
      field: "visitor_phone",
      headerName: "Phone",
      flex: 0.8,
      minWidth: 140,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.visitor_phone ?? "-") as GridValueGetter<HistoryRow>,
    },
    {
      field: "purpose",
      headerName: "Purpose",
      type: "string",
      flex: 1,
      minWidth: 160,
      valueGetter: ((params: HistoryValueGetterParams) =>
        String(params?.row?.purpose ?? "").trim().toLowerCase()) as GridValueGetter<HistoryRow>,
      renderCell: (params: GridRenderCellParams<HistoryRow>) => (
        <span>{String(params?.row?.purpose ?? "").trim() || "-"}</span>
      ),
    },
    {
      field: "visitor_id",
      headerName: "Visitor ID",
      width: 120,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.visitor_id ?? "-") as GridValueGetter<HistoryRow>,
    },
    {
      field: "visit_id",
      headerName: "Visit ID",
      width: 120,
      filterable: false,
      valueGetter: ((params: HistoryValueGetterParams) => params?.row?.visit_id ?? "-") as GridValueGetter<HistoryRow>,
    },
  ];

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
            <AppDataGrid
              rows={queueRowsWithHost}
              columns={queueColumns}
              getRowId={(row) => row.visit_id}
              loading={loading}
              onRowClick={(params: GridRowParams<QueueRow>) => setSelectedVisitId(params.row.visit_id)}
              searchPlaceholder="Search queue..."
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                columns: { columnVisibilityModel: { purpose: true } },
              }}
            />
          </Panel>

          <Panel title="Visitor List">
            <AppDataGrid
              rows={historyRowsWithHost}
              columns={listColumns}
              getRowId={(row) => row.visit_id}
              loading={loading}
              searchPlaceholder="Search visitor, ID, company, host..."
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    host_name: false,
                    id_number: true,
                    checkin_time: true,
                    company: false,
                    visitor_email: false,
                    visitor_phone: false,
                    visitor_id: false,
                    visit_id: false,
                  },
                },
              }}
              rowSelection
              disableRowSelectionOnClick={false}
              rowSelectionModel={selectedVisitId ? [selectedVisitId] : []}
              onRowSelectionModelChange={(model) => {
                const nextId = model[0] ? Number(model[0]) : null;
                setSelectedVisitId(nextId);
              }}
            />
          </Panel>
        </div>

        <Panel title="Visitor Details">
          {detail ? (
            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-1)]">
              <div className="flex flex-wrap items-center gap-4">
                {detail.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.photo}
                    alt={detail.visitor_name}
                    className="h-12 w-12 rounded-full border border-[var(--border-1)] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-3)] text-sm font-semibold text-[var(--text-1)]">
                    {detail.visitor_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-[180px]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">Visitor</p>
                  <p className="text-xl font-semibold tracking-tight text-[var(--text-1)]">{detail.visitor_name}</p>
                  <p className="text-sm text-[var(--text-2)]">{detail.company ?? "—"}</p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(detail.status)}`}
                >
                  {detail.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Phone</p>
                  <p className="text-base text-[var(--text-1)]">{detail.visitor_phone ?? "—"}</p>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Email</p>
                  <p className="text-base text-[var(--text-1)] break-words">{detail.visitor_email ?? "—"}</p>
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
