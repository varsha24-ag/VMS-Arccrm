"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function AuditLogsPage() {
    const user = useAuthGuard({ allowedRoles: ["admin"] });

    if (!user) return null;

    const logs = [
        { id: 1, action: "User Login", user: "admin@arccrm.com", time: "2 minutes ago", type: "success" },
        { id: 2, action: "Employee Deleted", user: "admin@arccrm.com", time: "1 hour ago", type: "danger" },
        { id: 3, action: "Settings Updated", user: "admin@arccrm.com", time: "3 hours ago", type: "warning" },
        { id: 4, action: "Database Backup", user: "System", time: "5 hours ago", type: "info" },
        { id: 5, action: "New Visitor Created", user: "Receptionist A", time: "Yesterday", type: "success" },
    ];

    return (
        <DashboardLayout user={user}>
            <DashboardPageHeader
                title="Audit Logs"
                subtitle="Traceable history of all system and user activities."
            />

            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)] overflow-hidden">
                <div className="p-8">
                    <div className="space-y-8 relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[var(--surface-2)]" />

                        {logs.map((log) => (
                            <div key={log.id} className="relative pl-10 group">
                                <div
                                    className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[var(--surface-1)] shadow-sm flex items-center justify-center transition-all group-hover:scale-110 ${
                                        log.type === "success"
                                            ? "bg-emerald-500"
                                            : log.type === "danger"
                                                ? "bg-red-500"
                                                : log.type === "warning"
                                                    ? "bg-amber-500"
                                                    : "bg-blue-500"
                                    }`}
                                />

                                <div className="p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] group-hover:bg-[var(--surface-3)] transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-1)]">{log.action}</p>
                                            <p className="text-xs text-[var(--text-3)]">
                                                Performed by{" "}
                                                <span className="font-semibold text-[var(--text-2)]">{log.user}</span>
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">{log.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-[var(--surface-2)] border-t border-[var(--border-1)] text-center">
                    <button className="text-xs font-bold text-[var(--text-3)] hover:text-[var(--text-1)] transition-all">Load older logs</button>
                </div>
            </div>
        </DashboardLayout>
    );
}
