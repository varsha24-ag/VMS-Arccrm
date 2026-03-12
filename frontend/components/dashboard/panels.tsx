"use client";

import { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string;
  delta: string;
}

export interface StatusItem {
  title: string;
  subtitle: string;
  status: string;
}

interface StatGridProps {
  items: StatItem[];
}

interface PanelProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

interface SimpleTableProps {
  headers: string[];
  rows: string[][];
}

interface StatusListProps {
  items: StatusItem[];
}

interface ActionListProps {
  items: string[];
}

interface TextListProps {
  items: string[];
}

export function StatGrid({ items }: StatGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-[#1e3a5f] bg-[#112240] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-slate-300">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
          <p className="mt-1 text-sm text-[#f97316]">{item.delta}</p>
        </article>
      ))}
    </div>
  );
}

export function Panel({ title, children, action }: PanelProps) {
  return (
    <section className="rounded-2xl border border-[#1e3a5f] bg-[#112240] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action ?? <span className="h-2 w-2 rounded-full bg-[#f97316]" />}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SimpleTable({ headers, rows }: SimpleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="text-slate-300">
            {headers.map((header) => (
              <th key={header} className="pb-3 pr-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-100">
          {rows.map((row, idx) => (
            <tr key={`${row[0]}-${idx}`} className="border-t border-white/10 transition hover:bg-white/5">
              {row.map((cell, cellIdx) => (
                <td key={`${cell}-${cellIdx}`} className="py-3 pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusList({ items }: StatusListProps) {
  return (
    <div className="space-y-3 text-sm text-slate-100">
      {items.map((item) => (
        <article
          key={item.title}
          className="flex items-center justify-between rounded-xl border border-[#1e3a5f] bg-[#0d1b2a] px-4 py-3 transition hover:border-[#f97316]"
        >
          <div>
            <p className="font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-300">{item.subtitle}</p>
          </div>
          <span className="rounded-full bg-[#f97316]/20 px-3 py-1 text-xs text-[#f97316]">{item.status}</span>
        </article>
      ))}
    </div>
  );
}

export function ActionList({ items }: ActionListProps) {
  return (
    <div className="space-y-3 text-sm">
      {items.map((action) => (
        <button
          key={action}
          type="button"
          className="w-full rounded-xl border border-[#1e3a5f] bg-[#0d1b2a] px-3 py-2 text-left text-slate-200 transition hover:border-[#f97316]"
        >
          {action}
        </button>
      ))}
    </div>
  );
}

export function TextList({ items }: TextListProps) {
  return (
    <ul className="space-y-3 text-sm text-slate-200">
      {items.map((item) => (
        <li key={item} className="rounded-xl border border-[#1e3a5f] bg-[#0d1b2a] px-3 py-2 transition hover:border-[#f97316]">
          {item}
        </li>
      ))}
    </ul>
  );
}
