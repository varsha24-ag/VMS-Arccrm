"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthUser, clearAuthSession } from "@/lib/auth";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { getModulesForRole } from "@/lib/modules";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useToast } from "@/components/ui/toast";

const getModuleIcon = (id: string, isActive: boolean) => {
  const iconClass = `w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-2)] group-hover:text-[var(--text-1)]'}`;
  
  if (id.includes("dashboard")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  );
  
  if (id.includes("pending")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  if (id.includes("approved")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  if (id.includes("rejected")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  if (id.includes("report") || id.includes("history")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
  
  if (id.includes("visitors") || id.includes("host")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  
  if (id.includes("pass") || id.includes("checkout")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );

  if (id.includes("users") || id.includes("employee")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
  
  if (id.includes("settings")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  
  if (id.includes("photo")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  
  if (id.includes("checkin")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );
  
  if (id.includes("scanner")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7V5a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M10 21H6a2 2 0 01-2-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" />
    </svg>
  );
  
  if (id.includes("qr")) return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm10 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 19h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
  
  // Default Register / Clipboard / etc
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
};

interface DashboardLayoutProps {
  children: ReactNode;
  user: AuthUser;
}
export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const modules = getModulesForRole(user.role);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    if (!user || !["guard", "admin", "employee"].includes(user.role)) return;
    const token = getAccessToken();
    if (!token) return;
    const source = new EventSource(`${API_BASE_URL}/events/visits?token=${encodeURIComponent(token)}`);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          status?: string;
          visit_id?: number;
          visitor_id?: number;
        };
        if (payload?.type !== "visit_status" || !payload.status) return;

        // Broadcast a global event so other pages can refresh automatically
        window.dispatchEvent(new CustomEvent("visitor-status-updated", { detail: payload }));

        const statusLabel =
          payload.status === "approved"
            ? "Approved by host"
            : payload.status === "rejected"
              ? "Rejected by host"
              : "Status updated";
        const visitLabel = payload.visit_id ? `Visit #${payload.visit_id}` : "Visit update";
        pushToast({
          title: statusLabel,
          description: `${visitLabel} · Receptionist notification`,
          variant: payload.status === "approved" ? "success" : payload.status === "rejected" ? "error" : "info",
        });
      } catch {
        // ignore malformed events
      }
    };
    source.onerror = () => {
      source.close();
    };
    return () => {
      source.close();
    };
  }, [pushToast, user]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/login");
  };

  const handleToggleNavigation = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileNavOpen((prev) => !prev);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname, searchParams]);

  const currentRoute = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div className="flex min-h-screen text-[var(--text-1)]">
      {isMobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "lg:w-64" : "lg:w-20"} fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-[var(--border-1)] bg-[var(--surface-1)] backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        <div className="flex h-16 items-center gap-3 overflow-hidden border-b border-[var(--border-1)] px-5 lg:px-6">
          <Image src="/arc-logo.svg" alt="Logo" width={32} height={32} className="shrink-0" />
          {(isSidebarOpen || isMobileNavOpen) && (
            <span className="font-bold text-lg text-[var(--text-1)] whitespace-nowrap">ArcCRM</span>
          )}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileNavOpen(false)}
            className="ml-auto rounded-lg p-2 text-[var(--text-2)] hover:bg-[var(--nav-hover-bg)] lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {modules.map((module) => {
            const isBasePathModule = module.path === pathname && !module.path.includes("?");
            const isFilteredEmployeeVisitorsRoute = pathname === "/employee/visitors" && searchParams.has("view");
            const isActive =
              currentRoute === module.path ||
              (isBasePathModule && !(module.path === "/employee/visitors" && isFilteredEmployeeVisitorsRoute));
            return (
              <Link
                key={module.id}
                href={module.path}
                title={!isSidebarOpen && !isMobileNavOpen ? module.label : undefined}
                className={`flex items-center ${(isSidebarOpen || isMobileNavOpen) ? "justify-between px-3" : "justify-center px-1"} py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? "bg-[var(--nav-active-bg)] text-[var(--accent)]"
                    : "text-[var(--text-2)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-1)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getModuleIcon(module.id, isActive)}
                  {(isSidebarOpen || isMobileNavOpen) && (
                    <span className="text-sm font-medium whitespace-nowrap">{module.label}</span>
                  )}
                </div>
                
                {isActive && (isSidebarOpen || isMobileNavOpen) && (
                  <svg className="w-4 h-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-1)]">
          <div className={`flex items-center gap-3 ${(isSidebarOpen || isMobileNavOpen) ? "px-3" : "justify-center"} py-2 rounded-lg bg-[var(--surface-2)] mb-2 overflow-hidden`}>
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {(isSidebarOpen || isMobileNavOpen) && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-1)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--text-3)] capitalize">{user.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={!isSidebarOpen && !isMobileNavOpen ? "Logout" : undefined}
            className={`flex items-center ${(isSidebarOpen || isMobileNavOpen) ? "gap-3 px-3" : "justify-center"} w-full py-2 rounded-lg text-[var(--text-2)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-1)] transition-all group`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {(isSidebarOpen || isMobileNavOpen) && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-1)] bg-[var(--surface-1)] px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={handleToggleNavigation}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--nav-hover-bg)] text-[var(--text-2)]"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] sm:block">
              {user.role} workspace
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
