"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function UserManagementPage() {
    const user = useAuthGuard({ allowedRoles: ["admin"] });

    if (!user) return null;

    const users = [
        { id: 1, name: "Admin User", email: "admin@arccrm.com", role: "admin", dept: "IT" },
        { id: 2, name: "Receptionist 1", email: "reception@arccrm.com", role: "receptionist", dept: "Administration" },
        { id: 3, name: "John Host", email: "john@arccrm.com", role: "employee", dept: "Engineering" },
        { id: 4, name: "Sarah Manager", email: "sarah@arccrm.com", role: "employee", dept: "HR" },
    ];

    return (
        <DashboardLayout user={user}>
            <DashboardPageHeader
                title="User Management"
                subtitle="Manage internal access and roles."
                actions={
                    <button className="px-6 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl text-sm font-bold shadow-[var(--shadow-1)] hover:brightness-95 transition-all">
                        Add New User
                    </button>
                }
            />

            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border-1)] flex items-center justify-between">
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-1)] placeholder:text-[var(--text-3)] rounded-xl text-xs focus:ring-4 focus:ring-[var(--nav-active-bg)] focus:border-[var(--accent)] outline-none transition-all"
                        />
                        <svg className="w-4 h-4 text-[var(--text-3)] absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-[var(--border-1)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all font-bold text-[10px] uppercase tracking-widest px-3">Filter</button>
                        <button className="p-2 rounded-lg border border-[var(--border-1)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all font-bold text-[10px] uppercase tracking-widest px-3">Export CSV</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[var(--text-3)] border-b border-[var(--border-1)]">
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px]">Name & Email</th>
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px]">Role</th>
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px]">Department</th>
                                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-1)]">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-[var(--surface-2)] group transition-colors">
                                    <td className="py-4 px-6">
                                        <p className="font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors">{u.name}</p>
                                        <p className="text-xs text-[var(--text-3)]">{u.email}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border-1)] ${u.role === 'admin' ? 'bg-indigo-500/15 text-indigo-500' :
                                                u.role === 'receptionist' ? 'bg-amber-500/15 text-amber-500' :
                                                    'bg-[var(--surface-2)] text-[var(--text-2)]'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-[var(--text-2)]">{u.dept}</td>
                                    <td className="py-4 px-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-[var(--text-3)] hover:text-[var(--accent)] p-1">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button className="text-[var(--text-3)] hover:text-red-400 p-1 ml-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
