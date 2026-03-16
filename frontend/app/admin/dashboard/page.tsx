"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";

export default function AdminDashboard() {
  const user = useAuthGuard({ allowedRoles: ["admin"] });

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Dashboard Overview"
        subtitle={`Welcome back, ${user.name}. Here’s what’s happening today.`}
      />

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Visitors Today", value: "24", change: "+12%", color: "text-sky-400", bg: "bg-sky-500/15" },
          { label: "Active Visitors", value: "8", change: "Current", color: "text-[var(--accent)]", bg: "bg-[var(--nav-active-bg)]" },
          { label: "Total Employees", value: "156", change: "Stable", color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "Pending Approvals", value: "3", change: "-2", color: "text-amber-400", bg: "bg-amber-500/15" },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-1)]"
          >
            <p className="text-sm font-medium text-[var(--text-3)]">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-3xl font-bold text-[var(--text-1)]">{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.color}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Visitors */}
        <section className="lg:col-span-2 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-1)] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[var(--text-1)]">Recent Visitors</h3>
            <button className="text-sm font-semibold text-[var(--accent)] hover:brightness-95">View all</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-3)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--text-1)]">John Doe {i + 1}</p>
                    <p className="text-xs text-[var(--text-3)]">Scheduled: 10:30 AM</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase">
                  Signed In
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* System Health */}
        <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)] p-6">
          <h3 className="font-bold text-[var(--text-1)] mb-6">System Health</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[var(--text-3)] uppercase tracking-wider">Database Sync</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[var(--text-3)] uppercase tracking-wider">API Response Time</span>
                <span className="text-[var(--accent)]">42ms</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-[var(--accent)]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
