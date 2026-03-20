"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
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
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) => {
            const haystack = [row.name, row.email, row.department, row.role]
                .filter(Boolean)
                .map((value) => String(value).toLowerCase())
                .join(" ");
            return haystack.includes(q);
        });
    }, [query, rows]);

    if (!user) return null;

    return (
        <DashboardLayout user={user}>
            <DashboardPageHeader
                title="User Management"
                subtitle="Manage internal access and roles."
            />

            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border-1)] flex items-center justify-between">
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-1)] placeholder:text-[var(--text-3)] rounded-xl text-xs focus:ring-4 focus:ring-[var(--nav-active-bg)] focus:border-[var(--accent)] outline-none transition-all"
                        />
                        <svg className="w-4 h-4 text-[var(--text-3)] absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={filtered.length === 0}
                            onClick={() => {
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
                            }}
                            className="p-2 rounded-lg border border-[var(--border-1)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all font-bold text-[10px] uppercase tracking-widest px-3 disabled:opacity-60"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[var(--text-3)] border-b border-[var(--border-1)]">
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px]">Name & Email</th>
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px]">Role</th>
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px]">Department</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-1)]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-6 px-6 text-sm text-[var(--text-3)]">
                                        {loading ? "Loading users..." : error ? error : "No users found."}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-[var(--surface-2)] transition-colors">
                                    <td className="py-4 px-6">
                                        <p className="font-bold text-[var(--text-1)]">{u.name}</p>
                                        <p className="text-xs text-[var(--text-3)]">{u.email ?? "-"}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border-1)] ${u.role === 'admin' ? 'bg-indigo-500/15 text-indigo-500' :
                                                u.role === 'receptionist' ? 'bg-amber-500/15 text-amber-500' :
                                                    'bg-emerald-500/15 text-emerald-500'
                                            }`}>
                                            {u.role ?? "unknown"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-[var(--text-2)]">{u.department ?? "General"}</td>
                                </tr>
                            ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
