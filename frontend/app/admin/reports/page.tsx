"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ReportsPage() {
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

    return (
        <DashboardLayout user={user}>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports</h1>
                <p className="text-sm text-slate-500 mt-1">Detailed insights into visitor traffic and facility usage.</p>
            </header>

            <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Visitors Today</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-50">
                                        <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Visitor</th>
                                        <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Host</th>
                                        <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Check-in</th>
                                        <th className="pb-3 pl-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        { name: "Alice Smith", host: "John Doe", time: "09:00 AM", status: "Checked In", sColor: "text-blue-600 bg-blue-50" },
                                        { name: "Bob Johnson", host: "Jane Wilson", time: "10:15 AM", status: "Waiting", sColor: "text-amber-600 bg-amber-50" },
                                        { name: "Charlie Brown", host: "Mike Ross", time: "11:00 AM", status: "Checked Out", sColor: "text-slate-500 bg-slate-100" },
                                    ].map((v, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="py-3 pr-4 font-medium text-slate-900">{v.name}</td>
                                            <td className="py-3 px-4 text-slate-500">{v.host}</td>
                                            <td className="py-3 px-4 text-slate-500">{v.time}</td>
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

                    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Vendor & Delivery Visits</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Food Delivery", count: 12, trend: "+3", provider: "Zomato" },
                                { label: "IT Support", count: 2, trend: "-1", provider: "HCL Tech" },
                                { label: "Courier", count: 8, trend: "Stable", provider: "BlueDart" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                        <p className="text-sm font-bold text-slate-900">{item.provider}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900">{item.count}</p>
                                        <p className={`text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>{item.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-8">Visitors by Department</h3>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { dept: "Engineering", count: 45, color: "bg-[#e9774b]" },
                            { dept: "HR & Admin", count: 22, color: "bg-blue-500" },
                            { dept: "Marketing", count: 18, color: "bg-emerald-500" },
                            { dept: "Sales", count: 31, color: "bg-amber-500" },
                        ].map((d, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-sm font-bold text-slate-900">{d.dept}</p>
                                    <p className="text-2xl font-black text-slate-100 leading-none">{d.count}</p>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${d.color} rounded-full transition-all duration-1000`} style={{ width: `${(d.count / 50) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-900">Peak Entry Time Analytics</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-[10px] font-bold text-slate-400 uppercase">Morning</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#e9774b]" /><span className="text-[10px] font-bold text-slate-400 uppercase">Peak</span></div>
                        </div>
                    </div>
                    <div className="relative h-48 w-full flex items-end gap-1 sm:gap-2">
                        {[30, 45, 25, 60, 85, 40, 20, 35, 90, 50, 30, 15].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                <div className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${h > 70 ? 'bg-[#e9774b]' : 'bg-blue-400'}`} style={{ height: `${h}%` }} />
                                <span className="text-[9px] font-bold text-slate-300 group-hover:text-slate-900">{i + 8}h</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
