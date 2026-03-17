"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import AppDataGrid, { GridColDef } from "@/components/ui/app-data-grid";
import type { GridRenderCellParams, GridValueGetter } from "@mui/x-data-grid";

export interface HostEmployee {
  id: number;
  name: string;
  department: string;
  email?: string | null;
}

interface HostSearchProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onSelectHost?: (host: HostEmployee | null) => void;
}

export default function HostSearch({ value, onChange, onSelectHost }: HostSearchProps) {
  const [hosts, setHosts] = useState<HostEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadHosts() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<HostEmployee[]>("/employees/hosts");
        if (mounted) setHosts(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load hosts");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadHosts();
    return () => {
      mounted = false;
    };
  }, []);

  const selected = hosts.find((host) => host.id === value);

  useEffect(() => {
    if (onSelectHost) {
      onSelectHost(selected ?? null);
    }
  }, [onSelectHost, selected]);

  type HostValueGetterParams = { row: HostEmployee };

  const columns: GridColDef<HostEmployee>[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        type: "string",
        flex: 1,
        minWidth: 160,
        valueGetter: ((params: HostValueGetterParams) => {
          const row = params?.row as HostEmployee & {
            full_name?: string | null;
            employee_name?: string | null;
            host_name?: string | null;
          };
          const value =
            row?.name ??
            row?.full_name ??
            row?.employee_name ??
            row?.host_name ??
            "";
          return String(value ?? "").trim();
        }) as GridValueGetter<HostEmployee>,
        renderCell: (params: GridRenderCellParams<HostEmployee>) => {
          const row = params?.row as HostEmployee & {
            full_name?: string | null;
            employee_name?: string | null;
            host_name?: string | null;
          };
          const value =
            row?.name ??
            row?.full_name ??
            row?.employee_name ??
            row?.host_name ??
            "";
          return <span>{String(value ?? "").trim() || "-"}</span>;
        },
      },
      {
        field: "department",
        headerName: "Department",
        type: "string",
        flex: 1,
        minWidth: 160,
        valueGetter: ((params: HostValueGetterParams) => {
          const row = params?.row as HostEmployee & {
            department_name?: string | null;
            dept?: string | null;
          };
          const value = row?.department ?? row?.department_name ?? row?.dept ?? "";
          return String(value ?? "").trim();
        }) as GridValueGetter<HostEmployee>,
        renderCell: (params: GridRenderCellParams<HostEmployee>) => {
          const row = params?.row as HostEmployee & {
            department_name?: string | null;
            dept?: string | null;
          };
          const value = row?.department ?? row?.department_name ?? row?.dept ?? "";
          return <span>{String(value ?? "").trim() || "-"}</span>;
        },
      },
      {
        field: "email",
        headerName: "Email",
        type: "string",
        flex: 1,
        minWidth: 200,
        valueGetter: ((params: HostValueGetterParams) => {
          const email = params?.row?.email;
          return email && String(email).trim().length > 0 ? String(email).trim() : "";
        }) as GridValueGetter<HostEmployee>,
        renderCell: (params: GridRenderCellParams<HostEmployee>) => {
          const email = params?.row?.email;
          return <span>{email && String(email).trim().length > 0 ? email : "-"}</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-2">
      <label className="text-sm text-[var(--text-2)]">Host Employee</label>
      {error ? <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div> : null}
      <div className="h-[320px]">
        <AppDataGrid
          rows={hosts}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          autoHeight={false}
          sx={{ height: "100%" }}
          searchPlaceholder="Search host by name, department, or email..."
          initialState={{
            columns: { columnVisibilityModel: { email: true } },
          }}
          rowSelection
          disableRowSelectionOnClick={false}
          rowSelectionModel={value ? [value] : []}
          onRowSelectionModelChange={(model) => {
            const nextId = model[0] ? Number(model[0]) : null;
            onChange(nextId);
          }}
        />
      </div>
      <div className="text-xs text-[var(--text-3)]">Selected: {selected ? `${selected.name}` : "None"}</div>
    </div>
  );
}
