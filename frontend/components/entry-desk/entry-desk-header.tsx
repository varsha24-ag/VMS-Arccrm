"use client";

interface EntryDeskHeaderProps {
  title: string;
  subtitle: string;
}

export default function EntryDeskHeader({ title, subtitle }: EntryDeskHeaderProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-3 shadow-[var(--shadow-1)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">Entry Desk</p>
      <h2 className="mt-1 text-xl font-semibold text-[var(--text-1)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--text-2)]">{subtitle}</p>
    </div>
  );
}
