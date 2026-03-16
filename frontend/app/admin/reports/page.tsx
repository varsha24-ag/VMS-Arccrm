"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function ReportsPage() {
    const user = useAuthGuard({ allowedRoles: ["admin"] });

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
                                    {[
                                        { name: "Alice Smith", host: "John Doe", time: "09:00 AM", status: "Checked In", sColor: "text-sky-400 bg-sky-500/15" },
                                        { name: "Bob Johnson", host: "Jane Wilson", time: "10:15 AM", status: "Waiting", sColor: "text-amber-400 bg-amber-500/15" },
                                        { name: "Charlie Brown", host: "Mike Ross", time: "11:00 AM", status: "Checked Out", sColor: "text-[var(--text-2)] bg-[var(--surface-2)]" },
                                    ].map((v, i) => (
                                        <tr key={i} className="hover:bg-[var(--surface-2)] transition-colors">
                                            <td className="py-3 pr-4 font-medium text-[var(--text-1)]">{v.name}</td>
                                            <td className="py-3 px-4 text-[var(--text-3)]">{v.host}</td>
                                            <td className="py-3 px-4 text-[var(--text-3)]">{v.time}</td>
                                            <td className="py-3 pl-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.sColor}`}>
                                                    {v.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)]">
                        <h3 className="font-bold text-[var(--text-1)] mb-4">Vendor & Delivery Visits</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Food Delivery", count: 12, trend: "+3", provider: "Zomato" },
                                { label: "IT Support", count: 2, trend: "-1", provider: "HCL Tech" },
                                { label: "Courier", count: 8, trend: "Stable", provider: "BlueDart" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                        <p className="text-sm font-bold text-[var(--text-1)]">{item.provider}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[var(--text-1)]">{item.count}</p>
                                        <p className={`text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-emerald-400' : 'text-[var(--text-3)]'}`}>{item.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)]">
                    <h3 className="font-bold text-[var(--text-1)] mb-8">Visitors by Department</h3>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { dept: "Engineering", count: 45, color: "bg-[var(--accent)]" },
                            { dept: "HR & Admin", count: 22, color: "bg-blue-500" },
                            { dept: "Marketing", count: 18, color: "bg-emerald-500" },
                            { dept: "Sales", count: 31, color: "bg-amber-500" },
                        ].map((d, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-sm font-bold text-[var(--text-1)]">{d.dept}</p>
                                    <p className="text-2xl font-black text-[var(--text-2)] leading-none">{d.count}</p>
                                </div>
                                <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                                    <div className={`h-full ${d.color} rounded-full transition-all duration-1000`} style={{ width: `${(d.count / 50) * 100}%` }} />
                                </div>
                            </div>
                        ))}
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
                        {[30, 45, 25, 60, 85, 40, 20, 35, 90, 50, 30, 15].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                <div className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${h > 70 ? 'bg-[var(--accent)]' : 'bg-blue-400'}`} style={{ height: `${h}%` }} />
                                <span className="text-[9px] font-bold text-[var(--text-3)] group-hover:text-[var(--text-1)]">{i + 8}h</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
