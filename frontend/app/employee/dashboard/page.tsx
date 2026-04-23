"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { Panel, SimpleTable, StatGrid } from "@/components/dashboard/panels";
import { AccessPassForm, AccessPassResult } from "@/components/employee/access-pass-form";
import FilterBar from "@/components/ui/filter-bar";
import { useToast } from "@/components/ui/toast";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useAuthGuard } from "@/lib/use-auth-guard";

type EmployeeVisitorRow = {
  visit_id: number;
  visitor_name: string;
  purpose?: string | null;
  created_at?: string | null;
  status: string;
};

export default function EmployeeDashboard() {
  const user = useAuthGuard({ allowedRoles: ["employee"] });
  const [approvalQuery, setApprovalQuery] = useState("");
  const [visitorRows, setVisitorRows] = useState<EmployeeVisitorRow[]>([]);
  const { pushToast } = useToast();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    void (async () => {
      try {
        const data = await apiFetch<EmployeeVisitorRow[]>("/employees/me/visitors");
        if (!cancelled) {
          setVisitorRows(data ?? []);
        }
      } catch {
        if (!cancelled) {
          setVisitorRows([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const latestVisitorRows = useMemo(
    () =>
      filteredVisitorRows.slice(0, 5).map((row) => [
        row.visitor_name,
        row.purpose ?? "—",
        row.created_at ? new Date(row.created_at).toLocaleString() : "—",
        row.status.replace(/_/g, " "),
      ]),
    [filteredVisitorRows]
  );

  const stats = useMemo(() => {
    const pendingCount = visitorRows.filter((row) => row.status === "pending").length;
    const approvedCount = visitorRows.filter((row) => row.status === "approved").length;
    const rejectedCount = visitorRows.filter((row) => row.status === "rejected").length;

    return [
      { label: "My Visitors", value: String(visitorRows.length), delta: "Open full list", href: "/employee/visitors" },
      { label: "Pending Approvals", value: String(pendingCount), delta: "Needs action", href: "/employee/visitors?view=pending" },
      { label: "Approved", value: String(approvedCount), delta: "Approved visitors", href: "/employee/visitors?view=approved" },
      { label: "Rejected", value: String(rejectedCount), delta: "Rejected visitors", href: "/employee/visitors?view=rejected" },
    ];
  }, [visitorRows]);

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
        if (payload.type !== "host_qr_checkin") return;
        if (payload.host_employee_id !== user.id) return;
        pushToast({
          title: "Visitor checked in",
          description: `${payload.visitor_name ?? "A visitor"} completed QR check-in.`,
          variant: "success",
          durationMs: 5000,
        });
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
  }, [pushToast, user]);

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
          <SimpleTable headers={["Visitor", "Purpose", "Date & Time", "Status"]} rows={latestVisitorRows} />
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
