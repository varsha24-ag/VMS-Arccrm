"use client";

import Link from "next/link";
import { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string;
  delta: string;
  href?: string;
}

export interface StatusItem {
  title: string;
  subtitle: string;
  status: string;
  image?: string | null;
  visit_id?: number;
  visitor_id?: number;
}

interface StatGridProps {
  items: StatItem[];
}

interface PanelProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}

interface SimpleTableProps {
  headers: string[];
  rows: string[][];
}

interface StatusListProps {
  items: StatusItem[];
  onItemClick?: (item: StatusItem) => void;
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
          className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 sm:p-5"
        >
          {item.href ? (
            <Link href={item.href} className="block">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-3)]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-1)] sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-sm text-[var(--accent)]">{item.delta}</p>
            </Link>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-3)]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-1)] sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-sm text-[var(--accent)]">{item.delta}</p>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

export function Panel({ title, children, action, className, contentClassName }: PanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-1)] ${className ?? ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-[var(--text-1)] sm:text-lg">{title}</h2>
        {action}
      </div>
      <div className={`mt-3 ${contentClassName ?? ""}`}>{children}</div>
    </section>
  );
}

export function SimpleTable({ headers, rows }: SimpleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="text-[var(--text-3)]">
            {headers.map((header) => (
              <th key={header} className="pb-3 pr-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[var(--text-1)]">
          {rows.map((row, idx) => (
            <tr
              key={`${row[0]}-${idx}`}
              className="border-t border-[var(--border-1)] transition hover:bg-[var(--surface-2)]"
            >
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

export function StatusList({ items, onItemClick }: StatusListProps) {
  return (
    <div className="space-y-3 text-sm text-[var(--text-1)]">
      {items.map((item) => (
        <article
          key={item.title}
          className="flex flex-col gap-3 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-3 transition hover:-translate-y-0.5 hover:bg-[var(--surface-3)] sm:flex-row sm:items-center sm:justify-between"
          role={onItemClick ? "button" : undefined}
          tabIndex={onItemClick ? 0 : undefined}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
          onKeyDown={
            onItemClick
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onItemClick(item);
                  }
                }
              : undefined
          }
        >
          <div className="flex min-w-0 items-center gap-3">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.title}
                className="h-10 w-10 rounded-full border border-[var(--border-1)] object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-3)] text-xs font-semibold text-[var(--text-1)]">
                {item.title
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--text-1)]">{item.title}</p>
              <p className="truncate text-xs text-[var(--text-3)]">{item.subtitle}</p>
            </div>
          </div>
          <div className="min-w-0">
            <span
              className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap capitalize ${
                item.status === "approved" || item.status.toLowerCase().includes("approved")
                  ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-400"
                  : item.status === "pending" || item.status.toLowerCase().includes("pending")
                    ? "border-amber-300/60 bg-amber-500/15 text-amber-400"
                    : item.status === "rejected" || item.status.toLowerCase().includes("rejected")
                      ? "border-red-300/60 bg-red-500/15 text-red-400"
                      : item.status === "checked_in" || item.status.toLowerCase().includes("checked in")
                        ? "border-orange-300/60 bg-orange-500/15 text-orange-400"
                        : "border-slate-300/60 bg-slate-500/15 text-slate-400"
              }`}
            >
              <span className="truncate">{item.status.replace(/_/g, " ")}</span>
            </span>
          </div>
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
          className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text-2)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
        >
          {action}
        </button>
      ))}
    </div>
  );
}

export function TextList({ items }: TextListProps) {
  return (
    <ul className="space-y-3 text-sm text-[var(--text-2)]">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 transition hover:bg-[var(--surface-3)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
