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
    if (!user || !["guard", "admin"].includes(user.role)) return;
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? "bg-[var(--nav-active-bg)] text-[var(--accent)]"
                    : "text-[var(--text-2)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-1)]"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-[var(--accent)]" : "bg-transparent"
                  } shrink-0`}
                />
                {(isSidebarOpen || isMobileNavOpen) && <span className="text-sm font-medium whitespace-nowrap">{module.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-1)]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--surface-2)] mb-2 overflow-hidden">
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
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[var(--text-2)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-1)] transition-all group"
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
