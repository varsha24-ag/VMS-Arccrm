"use client";

interface EntryDeskHeaderProps {
  title: string;
  subtitle: string;
}

export default function EntryDeskHeader({ title, subtitle }: EntryDeskHeaderProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Entry Desk</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </div>
  );
}
