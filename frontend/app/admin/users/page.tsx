"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";

export default function UserManagementPage() {
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

    const users = [
        { id: 1, name: "Admin User", email: "admin@arccrm.com", role: "admin", dept: "IT" },
        { id: 2, name: "Receptionist 1", email: "reception@arccrm.com", role: "receptionist", dept: "Administration" },
        { id: 3, name: "John Host", email: "john@arccrm.com", role: "employee", dept: "Engineering" },
        { id: 4, name: "Sarah Manager", email: "sarah@arccrm.com", role: "employee", dept: "HR" },
    ];

    return (
        <DashboardLayout user={user}>
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage internal access and roles.</p>
                </div>
                <Button className="bg-[#e9774b] hover:bg-[#d6663b]">Add New User</Button>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative w-full max-w-xs">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-[#e9774b] outline-none"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Filter</button>
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Export CSV</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
                                <th className="py-4 px-6">Name & Email</th>
                                <th className="py-4 px-6">Role</th>
                                <th className="py-4 px-6">Department</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/30 group transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{u.name}</span>
                                            <span className="text-xs text-slate-500">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                                u.role === 'receptionist' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-slate-600">{u.dept}</td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-white border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-white border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
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
