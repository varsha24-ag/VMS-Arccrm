"use client";

import type { ReactNode } from "react";

type AppTableShellProps = {
  panelOpen: boolean;
  panel?: ReactNode;
  panelWidth?: number;
  table: ReactNode;
};

export default function AppTableShell({
  panelOpen,
  panel,
  panelWidth = 300,
  table,
}: AppTableShellProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]">
      <div className="flex h-full w-full items-stretch">
        <div className="min-w-0 flex-1 transition-all duration-300 ease-in-out">
          {table}
        </div>

        <div
          aria-hidden={!panelOpen}
          className={`shrink-0 overflow-hidden border-l transition-[width,opacity] duration-300 ease-in-out ${
            panelOpen
              ? "border-white/10 opacity-100"
              : "w-0 border-transparent opacity-0"
          }`}
          style={panelOpen ? { width: `${panelWidth}px` } : undefined}
        >
          <div
            className="h-full bg-[var(--surface-2)] text-[var(--text-1)] shadow-[-10px_0_24px_rgba(15,23,42,0.12)]"
            style={{ width: `${panelWidth}px` }}
          >
            {panel}
          </div>
        </div>
      </div>
    </div>
  );
}
