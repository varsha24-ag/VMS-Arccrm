"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AccessPassForm, type AccessPassPayload, type AccessPassResult } from "@/components/employee/access-pass-form";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { Panel } from "@/components/dashboard/panels";
import AppDataGrid, { type GridColDef, type GridRenderCellParams } from "@/components/ui/app-data-grid";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

type PassStatus = "all" | "active" | "expired";

type AccessPassRow = {
  id: number;
  visitor_id: number;
  visitor_name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  purpose?: string | null;
  valid_from: string;
  valid_to: string;
  created_at: string;
  max_visits: number;
  remaining_visits: number;
  status: "active" | "expired";
  qr_code: string;
};

function toDateTimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function createRecreatePayload(row: AccessPassRow): AccessPassPayload {
  const now = new Date();
  const validTo = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return {
    visitor_name: row.visitor_name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    company: row.company ?? "",
    purpose: row.purpose ?? "",
    valid_from: toDateTimeLocal(now),
    valid_to: toDateTimeLocal(validTo),
  };
}

export default function EmployeePassesPage() {
  const user = useAuthGuard({ allowedRoles: ["employee"] });
  const { pushToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<PassStatus>("all");
  const [recreateTarget, setRecreateTarget] = useState<AccessPassRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rows, setRows] = useState<AccessPassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    email: false,
    phone: false,
  });

  const fetchPasses = useCallback(async () => {
    return apiFetch<AccessPassRow[]>("/employees/me/passes");
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchPasses();
        if (!cancelled) {
          setRows(data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          pushToast({
            title: "Failed to load passes",
            description: err instanceof Error ? err.message : "Failed to load passes",
            variant: "error",
            durationMs: 5000,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPasses, pushToast, user]);

  const filteredRows = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((row) => row.status === statusFilter)),
    [rows, statusFilter]
  );

  const columns = useMemo<GridColDef<AccessPassRow>[]>(
    () => [
      { field: "visitor_name", headerName: "Visitor Name", flex: 1, minWidth: 180, filterable: true },
      { field: "email", headerName: "Email", flex: 1, minWidth: 180, filterable: true },
      { field: "phone", headerName: "Phone", flex: 0.8, minWidth: 140, filterable: true },
      { field: "purpose", headerName: "Purpose", flex: 1, minWidth: 180, filterable: true },
      {
        field: "created_at",
        headerName: "Date",
        flex: 0.9,
        minWidth: 140,
        filterable: true,
        valueFormatter: (value) => (value ? new Date(value as string).toLocaleDateString() : "-"),
      },
      {
        field: "valid_to",
        headerName: "Time",
        flex: 1,
        minWidth: 170,
        filterable: false,
        valueFormatter: (value) =>
          value
            ? new Date(value as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "-",
      },
      {
        field: "status",
        headerName: "Status",
        type: "singleSelect",
        valueOptions: ["active", "expired"],
        width: 130,
        minWidth: 130,
        filterable: true,
        renderCell: (params: GridRenderCellParams<AccessPassRow>) => (
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              params.row.status === "active"
                ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-400"
                : "border-slate-300/60 bg-slate-500/15 text-slate-400"
            }`}
          >
            {params.row.status}
          </span>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<AccessPassRow>) =>
          params.row.status === "expired" ? (
            <button
              type="button"
              onClick={() => setRecreateTarget(params.row)}
              className="min-h-[38px] rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)]"
            >
              Recreate Pass
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="min-h-[38px] cursor-not-allowed rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-3)] opacity-60"
            >
              Recreate Pass
            </button>
          ),
      },
    ],
    []
  );

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Visitor Access Pass"
        subtitle="Track every visitor pass you have issued and recreate expired ones."
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex min-h-[40px] items-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95"
          >
            Generate Pass
          </button>
        }
      />
      <Panel
        title="Visitor Passes"
        action={
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "expired"] as PassStatus[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatusFilter(option)}
                className={`min-h-[40px] rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  statusFilter === option
                    ? "border-[var(--accent)] bg-[var(--nav-active-bg)] text-[var(--accent)]"
                    : "border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                }`}
              >
                {option === "all" ? "All" : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        <AppDataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          showColumns={true}
          showExport={false}
          showSearch
          showFilters
          showPagination
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={setColumnVisibility}
          searchPlaceholder="Search visitor, purpose, status..."
          localeText={{ noRowsLabel: loading ? "Loading passes..." : "No passes found." }}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        />
      </Panel>

      {recreateTarget ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--modal-overlay)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-1)]">Recreate Pass</h2>
                <p className="mt-1 text-sm text-[var(--text-3)]">Update the visitor details before sending a new pass.</p>
              </div>
              <button
                type="button"
                onClick={() => setRecreateTarget(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <AccessPassForm
              initialValues={createRecreatePayload(recreateTarget)}
              submitLabel="Send New Pass"
              loadingLabel="Sending..."
              onSuccess={(created: AccessPassResult) => {
                const description =
                  created.email_sent === false
                    ? created.email_error ?? "Pass recreated, but email was not sent."
                    : "Access pass recreated successfully. QR has been sent to the visitor email.";
                pushToast({
                  title: created.email_sent === false ? "Pass recreated" : "New pass sent",
                  description,
                  variant: created.email_sent === false ? "info" : "success",
                  durationMs: 5000,
                });
                void fetchPasses().then((data) => setRows(data ?? []));
                setRecreateTarget(null);
              }}
              onError={(err) => {
                pushToast({
                  title: "Failed to recreate pass",
                  description: err.message,
                  variant: "error",
                  durationMs: 5000,
                });
              }}
            />
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--modal-overlay)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-1)]">Visitor Access Pass</h2>
                <p className="mt-1 text-sm text-[var(--text-3)]">Enter visitor details to send an access pass.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <AccessPassForm
              submitLabel="Create Pass"
              loadingLabel="Creating..."
              onSuccess={(created: AccessPassResult) => {
                const description =
                  created.email_sent === false
                    ? created.email_error ?? "Access pass created, but email was not sent."
                    : "Access pass created successfully. QR has been sent to the visitor email.";
                pushToast({
                  title: created.email_sent === false ? "Pass created" : "Access pass created",
                  description,
                  variant: created.email_sent === false ? "info" : "success",
                  durationMs: 5000,
                });
                void fetchPasses().then((data) => setRows(data ?? []));
                setShowCreateModal(false);
              }}
              onError={(err) => {
                pushToast({
                  title: "Failed to create pass",
                  description: err.message,
                  variant: "error",
                  durationMs: 5000,
                });
              }}
            />
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
