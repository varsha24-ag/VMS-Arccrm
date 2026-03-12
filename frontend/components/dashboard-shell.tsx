"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/dashboard/logout-button";

interface DashboardShellProps {
  title: string;
  subtitle: string;
  modules?: string[];
  navItems?: { label: string; href: string }[];
  activeLabel?: string;
  children: ReactNode;
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 8a2 2 0 0 1 2-2h3l1.2-2h3.6l1.2 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 9a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 4v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M9 4h6m-8 2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M9 10h6M9 14h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function getNavIcon(label: string) {
  const key = label.toLowerCase();
  if (key.includes("photo")) return <CameraIcon />;
  if (key.includes("host")) return <UserIcon />;
  if (key.includes("qr")) return <QrIcon />;
  if (key.includes("history")) return <HistoryIcon />;
  if (key.includes("register")) return <ClipboardIcon />;
  return <PanelIcon />;
}

export default function DashboardShell({ title, subtitle, modules, navItems, activeLabel, children }: DashboardShellProps) {
  const pathname = usePathname();
  const items = navItems ?? modules?.map((label) => ({ label, href: "" })) ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b1f35] via-[#122f4f] to-[#0c2740] text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col border-r border-white/10 bg-[#0d2743]/95 px-4 py-6 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-[#0a2239] px-3 py-3">
            <Image src="/arc-logo.svg" alt="ARC logo" width={32} height={34} className="h-auto w-7" priority />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Portal</p>
              <p className="text-sm font-semibold tracking-wide text-white">ARCCRM</p>
            </div>
          </div>

          <div className="mt-8 flex-1 space-y-2">
            {items.map((item) => {
              const isRoute = Boolean(item.href);
              const baseHref = item.href.split("#")[0];
              const isActive =
                (activeLabel && item.label === activeLabel) ||
                (isRoute && baseHref === pathname && !item.href.includes("#"));
              const baseClasses =
                "flex w-full items-center justify-between rounded-lg border-l-2 border-transparent px-3 py-2.5 text-left text-sm transition";
              const activeClasses = isActive
                ? "border border-white/20 border-l-[#f97316] bg-white/10 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                : "text-slate-200 hover:border-white/20 hover:bg-white/10 hover:text-white";

              const content = (
                <>
                  <span className="flex items-center gap-3">
                    {item.label.toLowerCase().includes("dashboard") ? <GridIcon /> : getNavIcon(item.label)}
                    {item.label}
                  </span>
                  <ArrowIcon />
                </>
              );

              if (!isRoute) {
                return (
                  <div key={item.label} className={`${baseClasses} ${activeClasses}`}>
                    {content}
                  </div>
                );
              }

              return (
                <Link key={item.label} href={item.href} className={`${baseClasses} ${activeClasses}`}>
                  {content}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-400">Session</p>
            <LogoutButton />
          </div>
        </aside>

        <section className="p-4 sm:p-6 lg:p-8">
          <header className="rounded-2xl border border-white/15 bg-[#0b2239]/70 px-5 py-4 backdrop-blur-xl sm:px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dashboard Panel</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
                <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-[#e9774b]/40 bg-[#e9774b]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#ffc9b2]">
                  Live
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
