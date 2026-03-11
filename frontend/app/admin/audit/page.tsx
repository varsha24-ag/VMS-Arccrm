"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AuditLogsPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const authUser = getAuthUser();
        if (!authUser || authUser.role !== "admin") {
            router.replace("/auth/login");
            return;
        }
        setUser(authUser);
    }, [router]);

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
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
                <p className="text-sm text-slate-500 mt-1">Traceable history of all system and user activities.</p>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8">
                    <div className="space-y-8 relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />

                        {logs.map((log) => (
                            <div key={log.id} className="relative pl-10 group">
                                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all group-hover:scale-110 ${log.type === 'success' ? 'bg-emerald-500' :
                                        log.type === 'danger' ? 'bg-red-500' :
                                            log.type === 'warning' ? 'bg-amber-500' :
                                                'bg-blue-500'
                                    }`} />

                                <div className="p-4 rounded-xl border border-slate-50 bg-slate-50/30 group-hover:bg-slate-50/60 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{log.action}</p>
                                            <p className="text-xs text-slate-500">Performed by <span className="font-semibold text-slate-700">{log.user}</span></p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                    <button className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Load older logs</button>
                </div>
            </div>
        </DashboardLayout>
    );
}
