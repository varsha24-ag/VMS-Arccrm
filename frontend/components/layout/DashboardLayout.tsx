"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AuthUser, clearAuthSession } from "@/lib/auth";
import { getModulesForRole } from "@/lib/modules";

interface DashboardLayoutProps {
    children: ReactNode;
    user: AuthUser;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const modules = getModulesForRole(user.role);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        clearAuthSession();
        router.push("/auth/login");
    };

    return (
        <div className="flex min-h-screen bg-[#f9fafb]">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } sticky top-0 h-screen flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-50`}
            >
                <div className="p-6 flex items-center gap-3 border-b border-slate-50 overflow-hidden">
                    <Image src="/arc-logo.svg" alt="Logo" width={32} height={32} className="shrink-0" />
                    {isSidebarOpen && (
                        <span className="font-bold text-lg text-slate-900 whitespace-nowrap">ArcCRM</span>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {modules.map((module) => {
                        const isActive = pathname === module.path;
                        return (
                            <Link
                                key={module.id}
                                href={module.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                        ? "bg-[#e9774b]/10 text-[#e9774b]"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#e9774b]" : "bg-transparent"} shrink-0`} />
                                {isSidebarOpen && (
                                    <span className="text-sm font-medium whitespace-nowrap">{module.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 mb-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-[#1e2c48] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {user.role} workspace
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
