"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { Panel, SimpleTable, StatGrid, type StatItem } from "@/components/dashboard/panels";
import { AccessPassForm, AccessPassResult } from "@/components/employee/access-pass-form";
import FilterBar from "@/components/ui/filter-bar";
import { useToast } from "@/components/ui/toast";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useAuthGuard } from "@/lib/use-auth-guard";

type EmployeeVisitorRow = {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  purpose?: string | null;
  created_at?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
};

export default function EmployeeDashboard() {
  const user = useAuthGuard({ allowedRoles: ["employee"] });
  const [approvalQuery, setApprovalQuery] = useState("");
  const [visitorRows, setVisitorRows] = useState<EmployeeVisitorRow[]>([]);
  const { pushToast } = useToast();

  const isToday = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const loadData = useCallback(async () => {
    try {
      const data = await apiFetch<EmployeeVisitorRow[]>("/employees/me/visitors");
      setVisitorRows(data ?? []);
    } catch {
      setVisitorRows([]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [loadData, user]);

  const handleAction = async (visitId: number, action: "approve" | "reject") => {
    try {
      await apiFetch(`/employees/me/visitors/${visitId}/${action}`, { method: "POST" });
      pushToast({
        title: `Visitor ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `Successfully ${action === "approve" ? "approved" : "rejected"} the visitor request.`,
        variant: action === "approve" ? "success" : "info",
      });
      void loadData();
    } catch (err) {
      pushToast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Unable to update status",
        variant: "error",
      });
    }
  };

  const filteredVisitorRows = useMemo(() => {
    const query = approvalQuery.trim().toLowerCase();
    const sortedRows = [...visitorRows].sort((a, b) => {
      const left = new Date(a.created_at ?? 0).getTime();
      const right = new Date(b.created_at ?? 0).getTime();
      return right - left;
    });
    if (!query) return sortedRows;
    return sortedRows.filter((row) =>
      [row.visitor_name, row.purpose, row.status, row.created_at]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ")
        .includes(query)
    );
  }, [approvalQuery, visitorRows]);

  const stats = useMemo<StatItem[]>(() => {
    const pendingCount = visitorRows.filter((row) => row.status === "pending").length;
    const approvedCount = visitorRows.filter((row) => row.status === "approved").length;
    const rejectedCount = visitorRows.filter((row) => row.status === "rejected").length;

    return [
      { label: "My Visitors", value: String(visitorRows.length), delta: "Open full list", href: "/employee/visitors" },
      { label: "Pending Approvals", value: String(pendingCount), delta: "Needs action", href: "/employee/visitors?view=pending", color: "amber" },
      { label: "Approved", value: String(approvedCount), delta: "Approved visitors", href: "/employee/visitors?view=approved", color: "emerald" },
      { label: "Rejected", value: String(rejectedCount), delta: "Rejected visitors", href: "/employee/visitors?view=rejected", color: "sky" },
    ];
  }, [visitorRows]);

  useEffect(() => {
    const handleStatusUpdate = () => {
      void loadData();
    };
    window.addEventListener("visitor-status-updated", handleStatusUpdate);
    return () => {
      window.removeEventListener("visitor-status-updated", handleStatusUpdate);
    };
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;

    const source = new EventSource(`${API_BASE_URL}/events/visits?token=${encodeURIComponent(token)}`);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          host_employee_id?: number;
          visitor_name?: string;
        };
        if (payload.type === "host_qr_checkin" && payload.host_employee_id === user.id) {
          pushToast({
            title: "Visitor checked in",
            description: `${payload.visitor_name ?? "A visitor"} completed QR check-in.`,
            variant: "success",
            durationMs: 5000,
          });
        }
        void loadData();
      } catch {
        // Ignore malformed realtime events.
      }
    };
    source.onerror = () => {
      source.close();
    };
    return () => {
      source.close();
    };
  }, [pushToast, user, loadData]);

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Employee Dashboard"
        subtitle="Track your visitor approvals, scheduled meetings, and daily access tasks."
      />
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Visitors Details"
          action={
            <Link
              href="/employee/visitors"
              className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)]"
            >
              See all
            </Link>
          }
        >
          <div className="mb-4">
            <FilterBar
              searchValue={approvalQuery}
              onSearchChange={setApprovalQuery}
              searchPlaceholder="Search latest visitor, purpose, or status..."
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--text-3)] border-b border-[var(--border-1)]">
                  <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]">Visitor</th>
                  <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]">Purpose</th>
                  <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]">Time</th>
                  <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-1)]">
                {filteredVisitorRows.slice(0, 10).map((row) => (
                  <tr key={row.visit_id} className="border-t border-[var(--border-1)] transition hover:bg-[var(--surface-2)]/50">
                    <td className="py-4 pr-4 font-medium">{row.visitor_name}</td>
                    <td className="py-4 pr-4 text-[var(--text-2)]">{row.purpose ?? "—"}</td>
                    <td className="py-4 pr-4 text-[var(--text-3)] text-xs">
                      {row.created_at ? new Date(row.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "—"}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        row.status === "approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                        row.status === "pending" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
                        row.status === "rejected" ? "bg-red-600 text-white border-red-700 shadow-sm" :
                        "border-[var(--border-1)] bg-[var(--surface-3)] text-[var(--text-2)]"
                      }`}>
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {row.status === "pending" && isToday(row.created_at) && !row.checkin_time && !row.checkout_time ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(row.visit_id, "approve")}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-600 active:scale-95"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(row.visit_id, "reject")}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-red-700 active:scale-95 shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-3)] font-medium">
                          {row.status === "pending" && !isToday(row.created_at) ? "Expired" : "Done"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredVisitorRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--text-3)] italic">
                      No visitor requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Generate Visitor Pass">
          <AccessPassForm
            onSuccess={(created: AccessPassResult) => {
              const description =
                created.email_sent === false
                  ? created.email_error ?? "Access pass created, but email was not sent."
                  : "Access pass created successfully. QR has been sent to the visitor email.";
              pushToast({
                title: created.email_sent === false ? "Pass created" : "Access pass created",
                description,
                variant: created.email_sent === false ? "info" : "success",
                durationMs: 5000,
              });
            }}
            onError={(err) => {
              pushToast({
                title: "Failed to create pass",
                description: err.message,
                variant: "error",
                durationMs: 5000,
              });
            }}
          />
        </Panel>
      </div>
    </DashboardLayout>
  );
}
