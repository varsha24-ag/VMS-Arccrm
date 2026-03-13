"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, getRoleRedirectPath, AuthUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser) {
      router.replace("/auth/login");
      return;
    }
    if (authUser.role !== "admin") {
      router.replace(getRoleRedirectPath(authUser.role));
      return;
    }
    setUser(authUser);
  }, [router]);

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back, {user.name}. Here's what's happening today.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Visitors Today", value: "24", change: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Visitors", value: "8", change: "Current", color: "text-[#e9774b]", bg: "bg-[#e9774b]/10" },
          { label: "Total Employees", value: "156", change: "Stable", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Approvals", value: "3", change: "-2", color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.color}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Visitors */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Recent Visitors</h3>
            <button className="text-sm font-semibold text-[#e9774b] hover:text-[#d6663b]">View all</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">John Doe {i + 1}</p>
                    <p className="text-xs text-slate-500">Scheduled: 10:30 AM</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#065f46] text-[10px] font-bold uppercase">
                  Signed In
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* System Health */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-6">System Health</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider">Database Sync</span>
                <span className="text-emerald-600">Active</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider">API Response Time</span>
                <span className="text-[#e9774b]">42ms</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-[#e9774b]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
