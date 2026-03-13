"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
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
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Configure global application behavior and security.</p>
            </header>

            <div className="grid gap-8 lg:grid-cols-3">
                <aside className="space-y-1">
                    {['General', 'Security', 'Notifications', 'Branding', 'API & Integration'].map((tab, i) => (
                        <button
                            key={i}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${i === 0 ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </aside>

                <section className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">General Configuration</h3>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Visitor Pre-registration</p>
                                    <p className="text-xs text-slate-500">Allow employees to schedule visits in advance.</p>
                                </div>
                                <div className="w-10 h-5 bg-[#e9774b] rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Host Approval Required</p>
                                    <p className="text-xs text-slate-500">Notify hosts and wait for approval before check-in.</p>
                                </div>
                                <div className="w-10 h-5 bg-[#e9774b] rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Automatic Check-out</p>
                                    <p className="text-xs text-slate-500">Automatically check-out visitors after business hours.</p>
                                </div>
                                <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <button className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all border border-transparent">Cancel</button>
                            <button className="px-5 py-2 bg-[#e9774b] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#e9774b]/20 hover:bg-[#d6663b] transition-all">Save Changes</button>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">Maintenance Window</p>
                            <p className="text-xs text-amber-700 mt-1">
                                A system-wide maintenance window is scheduled for Saturday, March 14, 2026. Audit logs will be archived during this time.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
