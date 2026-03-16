"use client";

import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import FilterBar from "@/components/ui/filter-bar";
import Pagination from "@/components/ui/pagination";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface VisitHistoryItem {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  company?: string;
  photo_url?: string;
  host_employee_id?: number | null;
  purpose?: string;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
}

export default function ReceptionHistoryPage() {
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    if (!user) return;
    void loadHistory();
  }, [user]);

  async function loadHistory() {
    try {
      const data = await apiFetch<VisitHistoryItem[]>("/visit/history");
      setHistory(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load history");
    }
  }

  const historyWithPhotos = useMemo(() => {
    return history.map((item) => ({
      ...item,
      photo: item.photo_url
        ? item.photo_url.startsWith("http")
          ? item.photo_url
          : `${baseUrl}${item.photo_url}`
        : null,
    }));
  }, [history, baseUrl]);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return historyWithPhotos;
    return historyWithPhotos.filter((item) => {
      const haystack = [
        item.visitor_name,
        item.visitor_id,
        item.visit_id,
        item.visitor_email,
        item.visitor_phone,
        item.company,
        item.purpose,
        item.status,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [historyWithPhotos, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const pagedHistory = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Visit History" subtitle="Review recent visits with timestamps and photos." />
      <div className="space-y-6">
        <EntryDeskHeader
          title="Visit History"
          subtitle="Track check-ins and check-outs with captured photos."
        />

        <Panel title="History (Photo)">
          <div className="mb-4">
            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search visitor, purpose, status..."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--text-3)]">
                  <th className="pb-3 pr-3">Photo</th>
                  <th className="pb-3 pr-3">Visitor</th>
                  <th className="pb-3 pr-3">Purpose</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Check-in</th>
                  <th className="pb-3">Check-out</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-1)]">
                {pagedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-[var(--text-3)]">
                      {message ? message : "No visit history found."}
                    </td>
                  </tr>
                ) : (
                  pagedHistory.map((item) => (
                    <tr key={item.visit_id} className="border-t border-[var(--border-1)]">
                      <td className="py-3 pr-3">
                        {item.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(item.photo ?? null)}
                            className="group h-10 w-10 overflow-hidden rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]"
                          >
                            <img
                              src={item.photo}
                              alt={item.visitor_name}
                              className="h-10 w-10 object-cover transition group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="h-10 w-10 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]" />
                        )}
                      </td>
                      <td className="py-3 pr-3">{item.visitor_name}</td>
                      <td className="py-3 pr-3">{item.purpose ?? "-"}</td>
                      <td className="py-3 pr-3">{item.status}</td>
                      <td className="py-3 pr-3">
                        {item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}
                      </td>
                      <td className="py-3">
                        {item.checkout_time ? new Date(item.checkout_time).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination
              page={page}
              totalItems={filteredHistory.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </Panel>
      </div>
      {previewPhoto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute right-4 top-4 rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] p-2 text-[var(--text-2)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="p-6">
              <img src={previewPhoto} alt="Visitor" className="h-full w-full rounded-xl object-cover" />
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
