"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import AppDataGrid, {
  GridColDef,
  type GridRenderCellParams,
} from "@/components/ui/app-data-grid";
import FilterBar from "@/components/ui/filter-bar";
import { apiFetch } from "@/lib/api";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { useAuthGuard } from "@/lib/use-auth-guard";

type EmployeeRow = {
  id: number;
  name: string;
  email?: string | null;
  department?: string | null;
  role?: string | null;
};

export default function UserManagementPage() {
  const user = useAuthGuard({ allowedRoles: ["admin"] });
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<EmployeeRow[]>("/employees/hosts");
        if (!mounted) return;
        setRows(data ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load users");
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(rows.map((r) => r.role).filter(Boolean))) as string[];
    return roles.sort();
  }, [rows]);

  const deptOptions = useMemo(() => {
    const depts = Array.from(new Set(rows.map((r) => r.department ?? "General").filter(Boolean)));
    return depts.sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (
        roleFilter !== "all" &&
        row.role?.toLowerCase() !== roleFilter.toLowerCase()
      ) {
        return false;
      }

      const rowDept = row.department ?? "General";
      if (
        deptFilter !== "all" &&
        rowDept.toLowerCase() !== deptFilter.toLowerCase()
      ) {
        return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const haystack = [row.name, row.email, rowDept, row.role]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [rows, search, roleFilter, deptFilter]);

  const columns: GridColDef<EmployeeRow>[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 220,
        renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
          <div className="py-2">
            <p className="font-bold text-[var(--text-1)] truncate">{params.row.name}</p>
            <p className="text-xs text-[var(--text-3)] truncate">{params.row.email ?? "-"}</p>
          </div>
        ),
      },
      {
        field: "role",
        headerName: "Role",
        flex: 1,
        minWidth: 140,
        filterable: true,
        type: "singleSelect",
        valueOptions: Array.from(new Set(rows.map(r => r.role).filter(Boolean))) as string[],
        renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border-1)] ${
            params.row.role === 'admin' ? 'bg-indigo-500/15 text-indigo-500' :
            params.row.role === 'receptionist' ? 'bg-amber-500/15 text-amber-500' :
            'bg-emerald-500/15 text-emerald-500'
          }`}>
            {params.row.role ?? "unknown"}
          </span>
        ),
      },
      {
        field: "department",
        headerName: "Department",
        flex: 1,
        minWidth: 150,
        filterable: true,
        type: "singleSelect",
        valueOptions: Array.from(new Set(rows.map(r => r.department ?? "General"))).sort(),
        renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
          <span className="font-medium text-[var(--text-2)]">{params.row.department ?? "General"}</span>
        ),
      },
    ],
    [rows]
  );

  const handleExport = () => {
    const csv = buildCsv(
      filtered.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email ?? "",
        role: row.role ?? "",
        department: row.department ?? "General",
      })),
      {
        headers: [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "department", label: "Department" },
        ],
      }
    );
    downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="User Management"
        subtitle="Manage internal access and roles."
      />

      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          <AppDataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
