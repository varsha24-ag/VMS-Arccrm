import { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-1)] sm:text-2xl lg:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-3)] sm:text-[15px]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div> : null}
    </header>
  );
}
