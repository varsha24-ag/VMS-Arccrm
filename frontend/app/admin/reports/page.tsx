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
                <p className="text-sm text-slate-500 mt-1">
                    Detailed insights into visitor traffic and facility usage.
                </p>
            </header>

            <div className="space-y-8">
                {/* Visitors Today & Vendor Visits */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Visitors Today</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
                                        <th className="pb-3 px-2">Visitor</th>
                                        <th className="pb-3 px-2">Host</th>
                                        <th className="pb-3 px-2">Check-In</th>
                                        <th className="pb-3 px-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        { name: "Alice Smith", host: "John Doe", time: "09:00 AM", status: "Checked In" },
                                        { name: "Bob Johnson", host: "Jane Wilson", time: "10:15 AM", status: "Waiting" },
                                        { name: "Charlie Brown", host: "Mike Ross", time: "11:00 AM", status: "Checked Out" },
                                    ].map((row, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-4 px-2 font-medium text-slate-900">{row.name}</td>
                                            <td className="py-4 px-2 text-slate-600">{row.host}</td>
                                            <td className="py-4 px-2 text-slate-500">{row.time}</td>
                                            <td className="py-4 px-2 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.status === "Checked In" ? "bg-blue-100 text-blue-700" :
                                                        row.status === "Checked Out" ? "bg-slate-100 text-slate-600" :
                                                            "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {row.status}
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
                                { type: "Food Delivery", company: "Zomato", count: 12, trend: "+3" },
                                { type: "IT Support", company: "HCL Tech", count: 2, trend: "-1" },
                                { type: "Courier", company: "BlueDart", count: 8, trend: "Stable" },
                            ].map((v, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/50">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{v.type}</p>
                                        <p className="text-sm font-bold text-slate-900">{v.company}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900">{v.count}</p>
                                        <p className={`text-[10px] font-bold ${v.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`}>{v.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Visitors by Department */}
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
                                    <span className="text-sm font-bold text-slate-900">{d.dept}</span>
                                    <span className="text-2xl font-black text-slate-100 leading-none">{d.count}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div className={`h-full ${d.color} rounded-full`} style={{ width: `${(d.count / 45) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Peak Entry Time Analytics */}
                <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-900">Peak Entry Time Analytics</h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-100" /> Morning
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#e9774b]" /> Peak
                            </span>
                        </div>
                    </div>

                    <div className="relative h-48 w-full flex items-end gap-1 sm:gap-2">
                        {[3, 5, 8, 12, 18, 25, 22, 15, 10, 8, 5, 4].map((h, i) => {
                            const isPeak = h === 25;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${isPeak ? 'bg-[#e9774b]' : 'bg-blue-50 group-hover:bg-blue-100'}`}
                                        style={{ height: `${(h / 25) * 100}%` }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded -translate-x-1/4 transition-opacity">
                                            {h} visitors
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-2">
                                        {i + 9 < 12 ? `${i + 9}am` : i + 9 === 12 ? '12pm' : `${i + 9 - 12}pm`}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
