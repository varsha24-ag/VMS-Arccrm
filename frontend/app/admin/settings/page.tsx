"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function SettingsPage() {
    const user = useAuthGuard({ allowedRoles: ["admin"] });

    if (!user) return null;

    return (
        <DashboardLayout user={user}>
            <DashboardPageHeader
                title="System Settings"
                subtitle="Configure global application behavior and security."
            />

            <div className="grid gap-8 lg:grid-cols-3">
                <aside className="space-y-1">
                    {['General', 'Security', 'Notifications', 'Branding', 'API & Integration'].map((tab, i) => (
                        <button
                            key={i}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                i === 0
                                    ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-[var(--shadow-1)] border border-[var(--border-1)]'
                                    : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </aside>

                <section className="lg:col-span-2 space-y-6">
                    <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)] p-8 space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-[var(--text-1)]">General Configuration</h3>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-1)]">Visitor Pre-registration</p>
                                    <p className="text-xs text-[var(--text-3)]">Allow employees to schedule visits in advance.</p>
                                </div>
                                <div className="w-10 h-5 bg-[var(--accent)] rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-[var(--surface-1)] rounded-full shadow-sm" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-1)]">Host Approval Required</p>
                                    <p className="text-xs text-[var(--text-3)]">Notify hosts and wait for approval before check-in.</p>
                                </div>
                                <div className="w-10 h-5 bg-[var(--accent)] rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-[var(--surface-1)] rounded-full shadow-sm" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-1)]">Automatic Check-out</p>
                                    <p className="text-xs text-[var(--text-3)]">Automatically check-out visitors after business hours.</p>
                                </div>
                                <div className="w-10 h-5 bg-[var(--surface-3)] rounded-full relative cursor-pointer">
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-[var(--surface-1)] rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--border-1)] flex justify-end gap-3">
                            <button className="px-5 py-2 rounded-xl text-sm font-bold text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all border border-transparent">Cancel</button>
                            <button className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl text-sm font-bold shadow-[var(--shadow-1)] hover:brightness-95 transition-all">Save Changes</button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 flex gap-4 shadow-[var(--shadow-1)]">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center shrink-0 border border-[var(--border-1)]">
                            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--text-1)]">Maintenance Window</p>
                            <p className="text-xs text-[var(--text-2)] mt-1">
                                A system-wide maintenance window is scheduled for Saturday, March 21, 2026. Audit logs will be archived during this time.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
