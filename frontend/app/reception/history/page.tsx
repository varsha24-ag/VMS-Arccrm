"use client";

import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import FilterBar from "@/components/ui/filter-bar";
import Pagination from "@/components/ui/pagination";
import { apiFetch, resolveApiAssetUrl } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

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
  created_at?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
}

export default function ReceptionHistoryPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void loadHistory();
  }, [user]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await apiFetch<VisitHistoryItem[]>("/visit/history");
      setHistory(data);
      setMessage("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  const historyWithPhotos = useMemo(() => {
    return history.map((item) => ({
      ...item,
      photo: resolveApiAssetUrl(item.photo_url),
    }));
  }, [history]);

  const columns: GridColDef<VisitHistoryItem & { photo?: string | null }>[] = [
    {
      field: "photo",
      headerName: "Photo",
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<VisitHistoryItem & { photo?: string | null }>) =>
        params.value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <button
            type="button"
            onClick={() => setPreviewPhoto(params.value as string)}
            className="group h-10 w-10 overflow-hidden rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]"
          >
            <img
              src={params.value as string}
              alt={params.row.visitor_name}
              className="h-10 w-10 object-cover transition group-hover:scale-105"
            />
          </button>
        ) : (
          <div className="h-10 w-10 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]" />
        ),
    },
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
      valueGetter: ((params: VisitHistoryValueGetterParams) =>
        String(params?.row?.purpose ?? "").trim().toLowerCase()) as GridValueGetter<VisitHistoryItem>,
      renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
        <span>{String(params?.row?.purpose ?? "").trim() || "-"}</span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      type: "singleSelect",
      valueOptions: statusOptions,
      flex: 0.7,
      minWidth: 140,
      valueFormatter: ((value) =>
        statusLabel(String(value ?? ""))) as GridValueFormatter<VisitHistoryItem>,
      renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(params?.row?.status ?? "")}`}>
          {statusLabel(String(params?.row?.status ?? "-"))}
        </span>
      ),
    },
    {
      field: "checkin_time",
      headerName: "Check-in",
      flex: 1,
      minWidth: 180,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.checkin_time ?? null) as GridValueGetter<VisitHistoryItem>,
      valueFormatter: ((value) =>
        value ? new Date(value as string).toLocaleString() : "-") as GridValueFormatter<VisitHistoryItem>,
      renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
        <span>
          {params?.row?.checkin_time ? new Date(params.row.checkin_time).toLocaleString() : "-"}
        </span>
      ),
    },
    {
      field: "checkout_time",
      headerName: "Check-out",
      flex: 1,
      minWidth: 180,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.checkout_time ?? null) as GridValueGetter<VisitHistoryItem>,
      valueFormatter: ((value) =>
        value ? new Date(value as string).toLocaleString() : "-") as GridValueFormatter<VisitHistoryItem>,
      renderCell: (params: GridRenderCellParams<VisitHistoryItem>) => (
        <span>
          {params?.row?.checkout_time ? new Date(params.row.checkout_time).toLocaleString() : "-"}
        </span>
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
    {
      field: "company",
      headerName: "Company",
      flex: 1,
      minWidth: 160,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.company ?? "-") as GridValueGetter<VisitHistoryItem>,
    },
    {
      field: "visitor_email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.visitor_email ?? "-") as GridValueGetter<VisitHistoryItem>,
    },
    {
      field: "visitor_phone",
      headerName: "Phone",
      flex: 0.8,
      minWidth: 140,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.visitor_phone ?? "-") as GridValueGetter<VisitHistoryItem>,
    },
    {
      field: "visitor_id",
      headerName: "Visitor ID",
      width: 120,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.visitor_id ?? "-") as GridValueGetter<VisitHistoryItem>,
    },
    {
      field: "visit_id",
      headerName: "Visit ID",
      width: 120,
      valueGetter: ((params: VisitHistoryValueGetterParams) => params?.row?.visit_id ?? "-") as GridValueGetter<VisitHistoryItem>,
    },
  ];

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Visit History" subtitle="Review recent visits with timestamps and photos." />
      <div className="space-y-6">
        <EntryDeskHeader
          title="Visit History"
          subtitle="Track check-ins and check-outs with captured photos."
        />

        <Panel title="History">
          <div className="mb-4">
            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search visitor, purpose, status..."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--text-3)]">
                  <th className="pb-3 pr-3">Photo</th>
                  <th className="pb-3 pr-3">Visitor</th>
                  <th className="pb-3 pr-3">Purpose</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Check-in</th>
                  <th className="pb-3">Check-out</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-1)]">
                {pagedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-[var(--text-3)]">
                      {message ? message : "No visit history found."}
                    </td>
                  </tr>
                ) : (
                  pagedHistory.map((item) => (
                    <tr key={item.visit_id} className="border-t border-[var(--border-1)]">
                      <td className="py-3 pr-3">
                        {item.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(item.photo ?? null)}
                            className="group h-10 w-10 overflow-hidden rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]"
                          >
                            <img
                              src={item.photo}
                              alt={item.visitor_name}
                              className="h-10 w-10 object-cover transition group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="h-10 w-10 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]" />
                        )}
                      </td>
                      <td className="py-3 pr-3">{item.visitor_name}</td>
                      <td className="py-3 pr-3">{item.purpose ?? "-"}</td>
                      <td className="py-3 pr-3">{item.status}</td>
                      <td className="py-3 pr-3">
                        {item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}
                      </td>
                      <td className="py-3">
                        {item.checkout_time ? new Date(item.checkout_time).toLocaleString() : "-"}
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
              totalItems={filteredHistory.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </Panel>
      </div>
      {previewPhoto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute right-4 top-4 rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] p-2 text-[var(--text-2)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewPhoto} alt="Visitor" className="h-full w-full rounded-xl object-cover" />
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
