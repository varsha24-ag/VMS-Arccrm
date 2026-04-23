"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

type VisitHistoryItem = {
    visit_id: number;
    visitor_id: number;
    visitor_name: string;
    host_employee_id?: number | null;
    purpose?: string | null;
    checkin_time?: string | null;
    checkout_time?: string | null;
    status: string;
};

type EmployeeRow = {
    id: number;
    name: string;
    department?: string | null;
};

function isToday(value?: string | null) {
    if (!value) return false;
    const d = new Date(value);
    return d.toDateString() === new Date().toDateString();
}

export default function ReportsPage() {
    const user = useAuthGuard({ allowedRoles: ["admin", "superadmin"] });
    const [history, setHistory] = useState<VisitHistoryItem[]>([]);
    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        let mounted = true;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const [historyData, employeesData] = await Promise.all([
                    apiFetch<VisitHistoryItem[]>("/visit/history"),
                    apiFetch<EmployeeRow[]>("/employees/hosts"),
                ]);
                if (!mounted) return;
                setHistory(historyData ?? []);
                setEmployees(employeesData ?? []);
            } catch (err) {
                if (!mounted) return;
                setError(err instanceof Error ? err.message : "Failed to load reports data");
                setHistory([]);
                setEmployees([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        void load();
        return () => {
            mounted = false;
        };
    }, [user]);

    const hostMap = useMemo(() => {
        const map: Record<number, { name: string; department: string }> = {};
        employees.forEach((emp) => {
            map[emp.id] = { name: emp.name, department: emp.department ?? "General" };
        });
        return map;
    }, [employees]);

    const todayVisits = useMemo(() => {
        return history.filter((item) => isToday(item.checkin_time));
    }, [history]);

    const visitorsTodayRows = useMemo(() => {
        return [...todayVisits]
            .sort((a, b) => b.visit_id - a.visit_id)
            .slice(0, 10)
            .map((item) => {
                const host = item.host_employee_id ? hostMap[item.host_employee_id]?.name ?? "Unknown" : "Unassigned";
                const time = item.checkin_time ? new Date(item.checkin_time).toLocaleTimeString() : "-";
                const statusLabel = item.status.replaceAll("_", " ");
                const badge =
                    item.status === "checked_in"
                        ? "text-emerald-400 bg-emerald-500/15"
                        : item.status === "checked_out"
                            ? "text-[var(--text-2)] bg-[var(--surface-2)]"
                            : item.status === "approved"
                                ? "text-sky-400 bg-sky-500/15"
                                : item.status === "rejected"
                                    ? "text-red-400 bg-red-500/15"
                                    : "text-amber-400 bg-amber-500/15";
                return {
                    id: item.visit_id,
                    name: item.visitor_name,
                    host,
                    time,
                    statusLabel,
                    badge,
                };
            });
    }, [hostMap, todayVisits]);

    const purposeStats = useMemo(() => {
        const counts = new Map<string, number>();
        todayVisits.forEach((item) => {
            const key = (item.purpose ?? "Unspecified").trim() || "Unspecified";
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([purpose, count]) => ({ purpose, count }));
    }, [todayVisits]);

    const visitsByDepartment = useMemo(() => {
        const counts = new Map<string, number>();
        todayVisits.forEach((item) => {
            const dept =
                item.host_employee_id ? hostMap[item.host_employee_id]?.department ?? "General" : "Unassigned";
            counts.set(dept, (counts.get(dept) ?? 0) + 1);
        });
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 4).map(([dept, count]) => ({ dept, count }));
        const max = Math.max(1, ...top.map((t) => t.count));
        return { top, max };
    }, [hostMap, todayVisits]);

    const peakHours = useMemo(() => {
        const hours = Array.from({ length: 12 }, (_, idx) => idx + 8); // 08:00–19:00
        const counts = new Map<number, number>();
        hours.forEach((h) => counts.set(h, 0));
        todayVisits.forEach((item) => {
            if (!item.checkin_time) return;
            const hour = new Date(item.checkin_time).getHours();
            if (!counts.has(hour)) return;
            counts.set(hour, (counts.get(hour) ?? 0) + 1);
        });
        const values = hours.map((h) => ({ hour: h, count: counts.get(h) ?? 0 }));
        const max = Math.max(1, ...values.map((v) => v.count));
        return { values, max };
    }, [todayVisits]);

    if (!user) return null;

    return (
        <DashboardLayout user={user}>
            <DashboardPageHeader
                title="System Reports"
                subtitle="Detailed insights into visitor traffic and facility usage."
            />

            <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)]">
                        <h3 className="font-bold text-[var(--text-1)] mb-4">Visitors Today</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-[var(--text-3)] border-b border-[var(--border-1)]">
                                        <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Visitor</th>
                                        <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Host</th>
                                        <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Check-in</th>
                                        <th className="pb-3 pl-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-1)]">
                                    {visitorsTodayRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-sm text-[var(--text-3)]">
                                                {loading ? "Loading visits..." : error ? error : "No visits found for today."}
                                            </td>
                                        </tr>
                                    ) : (
                                        visitorsTodayRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-[var(--surface-2)] transition-colors">
                                                <td className="py-3 pr-4 font-medium text-[var(--text-1)]">{row.name}</td>
                                                <td className="py-3 px-4 text-[var(--text-3)]">{row.host}</td>
                                                <td className="py-3 px-4 text-[var(--text-3)]">{row.time}</td>
                                                <td className="py-3 pl-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.badge}`}>
                                                        {row.statusLabel.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)]">
                        <h3 className="font-bold text-[var(--text-1)] mb-4">Purpose Breakdown (Today)</h3>
                        <div className="space-y-4">
                            {purposeStats.length === 0 ? (
                                <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-3)]">
                                    {loading ? "Loading purposes..." : "No purpose data available for today."}
                                </div>
                            ) : (
                                purposeStats.map((item) => (
                                    <div
                                        key={item.purpose}
                                        className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest leading-none mb-1">
                                                Purpose
                                            </p>
                                            <p className="text-sm font-bold text-[var(--text-1)] truncate">{item.purpose}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-[var(--text-1)]">{item.count}</p>
                                            <p className="text-[10px] font-bold text-[var(--text-3)]">visits</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <section className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)]">
                    <h3 className="font-bold text-[var(--text-1)] mb-8">Visitors by Department</h3>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {visitsByDepartment.top.length === 0 ? (
                            <div className="text-sm text-[var(--text-3)]">No department data available for today.</div>
                        ) : (
                            visitsByDepartment.top.map((d) => (
                            <div key={d.dept} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-sm font-bold text-[var(--text-1)]">{d.dept}</p>
                                    <p className="text-2xl font-black text-[var(--text-2)] leading-none">{d.count}</p>
                                </div>
                                <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-1000"
                                        style={{ width: `${(d.count / visitsByDepartment.max) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )))}
                    </div>
                </section>

                <section className="bg-[var(--surface-1)] p-8 rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)] overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-[var(--text-1)]">Peak Entry Time Analytics</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-[10px] font-bold text-[var(--text-3)] uppercase">Morning</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--accent)]" /><span className="text-[10px] font-bold text-[var(--text-3)] uppercase">Peak</span></div>
                        </div>
                    </div>
                    <div className="relative h-48 w-full flex items-end gap-1 sm:gap-2">
                        {peakHours.values.map((row) => {
                            const heightPct = (row.count / peakHours.max) * 100;
                            return (
                                <div key={row.hour} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                                            row.count === peakHours.max && row.count > 0 ? "bg-[var(--accent)]" : "bg-blue-400"
                                        }`}
                                        style={{ height: `${heightPct}%` }}
                                        title={`${row.count} check-ins`}
                                    />
                                    <span className="text-[9px] font-bold text-[var(--text-3)] group-hover:text-[var(--text-1)]">{row.hour}h</span>
                                </div>
                            );
                        })}
                    </div>
                    {todayVisits.length === 0 ? (
                        <p className="mt-4 text-sm text-[var(--text-3)]">{loading ? "Loading..." : "No check-ins today."}</p>
                    ) : null}
                </section>
            </div>
        </DashboardLayout>
    );
}
