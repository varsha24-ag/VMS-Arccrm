"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { apiFetch, assignRole } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";

// Updated Interface to match backend data exactly
interface Employee {
    id: number | string;
    name: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    employee_code?: string;
}

export default function SettingsPage() {
    const user = useAuthGuard({ allowedRoles: ["admin", "superadmin"] });
    const { pushToast } = useToast();
    
    // States
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<"admin" | "guard">("admin");
    const isSuperAdmin = user?.role === "superadmin";

    // Revert role selection if non-superadmin somehow targets admin
    useEffect(() => {
        if (!isSuperAdmin && selectedRole === "admin") {
            setSelectedRole("guard");
        }
    }, [isSuperAdmin, selectedRole]);

    // Calculate next Saturday for maintenance window
    const getNextSaturday = () => {
        const now = new Date();
        const nextSat = new Date();
        nextSat.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
        if (nextSat.toDateString() === now.toDateString()) {
            nextSat.setDate(nextSat.getDate() + 7);
        }
        return nextSat.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const [maintenanceDate] = useState(getNextSaturday());

    // Consolidated data fetcher
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Use server-side filtering to exclude admins
            const data = await apiFetch<Employee[]>("/employees/hosts?exclude_role=admin");
            setEmployees(data || []);
        } catch (err: any) {
            const msg = err.message || "Failed to load employee directory";
            setError(msg);
            pushToast({ variant: "error", title: "Sync Error", description: msg });
        } finally {
            setIsLoading(false);
        }
    }, [pushToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!user) return null;

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_code && emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 50);

    const handleGiveAccess = async () => {
        if (!selectedEmployeeId) return;
        
        setIsSubmitting(true);
        try {
            // Convert to number explicitly if needed since promote API expects int
            await assignRole(Number(selectedEmployeeId), selectedRole);
            pushToast({ variant: "success", title: "Access Granted", description: `Employee assigned ${selectedRole} role successfully` });
            setSelectedEmployeeId(null);
            setSearchTerm("");
            // Refresh list
            await fetchData();
        } catch (err: any) {
            pushToast({ variant: "error", title: "Promotion Failed", description: err.message || "Failed to promote employee" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout user={user}>
            <DashboardPageHeader
                title="System Settings"
                subtitle="Configure global application behavior and security."
            />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-1)] shadow-[var(--shadow-1)] p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[var(--text-1)]">Create Admin</h3>
                            <div className="px-3 py-1 rounded-full bg-[var(--accent-alpha)] border border-[var(--accent)] text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider">
                                Role Management
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">Select Access Level</label>
                                <div className={`flex gap-2 p-1 bg-[var(--surface-3)] rounded-xl border border-[var(--border-1)] ${isSuperAdmin ? 'max-w-sm' : 'max-w-[200px]'}`}>
                                    {isSuperAdmin && (
                                        <button 
                                            onClick={() => setSelectedRole("admin")}
                                            className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${selectedRole === "admin" ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg scale-[1.02]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Administrator
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setSelectedRole("guard")}
                                        className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${selectedRole === "guard" ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg scale-[1.02]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Security Guard
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--text-2)]">Search and Select Employee</label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Search by name or code..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1"
                                    />
                                    <button 
                                        onClick={() => fetchData()}
                                        className="p-2.5 rounded-xl border border-[var(--border-1)] hover:bg-[var(--surface-2)] transition-colors text-[var(--text-3)] hover:text-[var(--text-1)]"
                                        title="Refresh directory"
                                    >
                                        <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] min-h-[200px] relative">
                                {isLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-1)]/50 backdrop-blur-sm z-10 transition-all rounded-xl">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-xs font-medium text-[var(--text-3)] animate-pulse uppercase tracking-widest">Updating Directory...</p>
                                        </div>
                                    </div>
                                ) : null}

                                {error ? (
                                    <div className="p-12 text-center space-y-4">
                                        <div className="w-12 h-12 bg-rose-500/10 rounded-full mx-auto flex items-center justify-center border border-rose-500/20">
                                            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-[var(--text-1)]">Sync Error</p>
                                            <p className="text-xs text-[var(--text-3)] max-w-[240px] mx-auto italic">{error}</p>
                                        </div>
                                        <button 
                                            onClick={() => fetchData()}
                                            className="px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg text-xs font-bold hover:bg-[var(--surface-3)] transition-all"
                                        >
                                            Retry Synchronizing
                                        </button>
                                    </div>
                                ) : filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((emp) => (
                                        <div 
                                            key={emp.id}
                                            onClick={() => setSelectedEmployeeId(emp.id)}
                                            className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-[var(--surface-3)] group ${
                                                selectedEmployeeId === emp.id ? 'bg-[var(--accent-alpha)] border-l-4 border-[var(--accent)]' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black uppercase transition-all ${
                                                    selectedEmployeeId === emp.id ? 'bg-[var(--accent)] text-[var(--accent-fg)] scale-110' : 'bg-[var(--surface-3)] text-[var(--text-3)] group-hover:bg-[var(--surface-1)]'
                                                }`}>
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold transition-all ${selectedEmployeeId === emp.id ? 'text-[var(--text-1)]' : 'text-[var(--text-1)]'}`}>
                                                        {emp.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {emp.employee_code && (
                                                            <span className="text-[10px] uppercase font-bold text-[var(--text-3)] bg-[var(--surface-1)] px-1.5 py-0.5 rounded border border-[var(--border-1)]">
                                                                #{emp.employee_code}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-3)] flex items-center gap-1">
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            {emp.department}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedEmployeeId === emp.id && (
                                                <div className="w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--surface-1)] animate-in zoom-in-50 duration-200">
                                                    <svg className="w-4 h-4 text-[var(--accent-fg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center space-y-2">
                                        <div className="w-12 h-12 bg-[var(--surface-3)] rounded-full mx-auto flex items-center justify-center">
                                            <svg className="w-6 h-6 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-[var(--text-3)] italic">
                                            {searchTerm ? "No employees match your search." : "Your employee directory appears empty."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[var(--border-1)] flex justify-end">
                        <button 
                            className="px-8 py-3 bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            onClick={handleGiveAccess}
                            disabled={!selectedEmployeeId || isSubmitting || isLoading}
                        >
                            {isSubmitting ? "Updating..." : `Give ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Access`}
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 flex gap-4 shadow-[var(--shadow-1)]">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-1)]">Maintenance Notice</p>
                        <p className="text-xs text-[var(--text-2)] mt-1">
                            A system-wide maintenance window is scheduled for {maintenanceDate}. Audit logs will be archived during this time.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}



