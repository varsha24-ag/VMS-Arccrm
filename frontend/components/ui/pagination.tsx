"use client";

import { useMemo } from "react";

type PageItem = number | "ellipsis";

function buildPageItems(totalPages: number, currentPage: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  const items: PageItem[] = [1];
  if (windowStart > 2) items.push("ellipsis");
  for (let page = windowStart; page <= windowEnd; page++) items.push(page);
  if (windowEnd < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

interface PaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  className?: string;
}

export default function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  showPageSize = true,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);

  const pageItems = useMemo(() => buildPageItems(totalPages, safePage), [totalPages, safePage]);

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Showing {start}-{end} of {totalItems}
          </span>
          {showPageSize && onPageSizeChange ? (
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Rows per page</span>
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size} className="bg-slate-900 text-slate-100">
                    {size}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="First page"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Previous page"
          >
            ‹
          </button>
          {pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                  item === safePage
                    ? "border-transparent bg-[#f97316] text-white shadow-[0_10px_20px_rgba(249,115,22,0.35)]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Next page"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
