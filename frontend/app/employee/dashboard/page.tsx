"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { Panel, SimpleTable, StatGrid, TextList } from "@/components/dashboard/panels";
import FilterBar from "@/components/ui/filter-bar";
import Pagination from "@/components/ui/pagination";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

const stats = [
  { label: "My Visitors", value: "14", delta: "This month" },
  { label: "Pending Approvals", value: "4", delta: "Needs action" },
  { label: "Approved", value: "22", delta: "+6" },
  { label: "Missed", value: "1", delta: "Today" }
];

const approvalTable = {
  headers: ["Visitor", "Purpose", "Time", "Action"],
  rows: [
    ["Ananya Shah", "Project Discussion", "11:00 AM", "Approve"],
    ["Ravi Desai", "Vendor Demo", "1:30 PM", "Approve"],
    ["Suresh Naik", "Audit Review", "3:15 PM", "Approve"]
  ]
};

const timelineItems = [
  "09:30 AM - Daily standup",
  "11:00 AM - Visitor approval",
  "02:00 PM - Client walkthrough",
  "04:30 PM - Security sign-off"
];

const passPurposeOptions = [
  "Meeting",
  "Interview",
  "Delivery",
  "Maintenance",
  "Vendor Visit",
  "Site Visit",
];

const initialPassPayload: AccessPassPayload = {
  visitor_name: "",
  phone: "",
  email: "",
  company: "",
  purpose: "",
  valid_from: "",
  valid_to: "",
};

interface AccessPassPayload {
  visitor_name: string;
  phone?: string;
  email?: string;
  company?: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
}

interface AccessPassResult {
  email_sent?: boolean | null;
  email_error?: string | null;
}

export default function EmployeeDashboard() {
  const user = useAuthGuard({ allowedRoles: ["employee"] });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalQuery, setApprovalQuery] = useState("");
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalPageSize, setApprovalPageSize] = useState(5);
  const [passPayload, setPassPayload] = useState<AccessPassPayload>(initialPassPayload);

  const filteredApprovalRows = useMemo(() => {
    const query = approvalQuery.trim().toLowerCase();
    if (!query) return approvalTable.rows;
    return approvalTable.rows.filter((row) =>
      row
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ")
        .includes(query)
    );
  }, [approvalQuery]);

  const approvalTotalPages = Math.max(1, Math.ceil(filteredApprovalRows.length / approvalPageSize));
  const pagedApprovalRows = useMemo(() => {
    const start = (approvalPage - 1) * approvalPageSize;
    return filteredApprovalRows.slice(start, start + approvalPageSize);
  }, [filteredApprovalRows, approvalPage, approvalPageSize]);

  useEffect(() => {
    setApprovalPage(1);
  }, [approvalQuery, approvalPageSize]);

  useEffect(() => {
    if (approvalPage > approvalTotalPages) {
      setApprovalPage(approvalTotalPages);
    }
  }, [approvalPage, approvalTotalPages]);

  async function handleCreatePass(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const created = await apiFetch<AccessPassResult>("/access-pass/create", {
        method: "POST",
        timeoutMs: 0,
        body: JSON.stringify({
          ...passPayload,
          max_visits: 10,
        }),
      });
      setMessage(
        created.email_sent === false
          ? created.email_error ?? "Access pass created, but email was not sent."
          : "Access pass created successfully. QR has been sent to the visitor email."
      );
      setPassPayload(initialPassPayload);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create pass");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader
        title="Employee Dashboard"
        subtitle="Track your visitor approvals, scheduled meetings, and daily access tasks."
      />
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Pending Visitor Approvals">
          <div className="mb-4">
            <FilterBar
              searchValue={approvalQuery}
              onSearchChange={setApprovalQuery}
              searchPlaceholder="Search visitor or purpose..."
            />
          </div>
          <SimpleTable headers={approvalTable.headers} rows={pagedApprovalRows} />
          <div className="mt-4">
            <Pagination
              page={approvalPage}
              totalItems={filteredApprovalRows.length}
              pageSize={approvalPageSize}
              onPageChange={setApprovalPage}
              onPageSizeChange={setApprovalPageSize}
              pageSizeOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        </Panel>

        <Panel title="Generate Visitor Access Pass">
          <form className="grid gap-3" onSubmit={handleCreatePass}>
            <input
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              placeholder="Visitor name"
              value={passPayload.visitor_name}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, visitor_name: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              placeholder="Phone"
              value={passPayload.phone}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              placeholder="Email"
              value={passPayload.email}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              placeholder="Company"
              value={passPayload.company}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, company: e.target.value }))}
            />
            <select
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
              value={passPayload.purpose}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, purpose: e.target.value }))}
              required
            >
              <option value="" className="bg-[var(--surface-1)] text-[var(--text-1)]">
                Select purpose
              </option>
              {passPurposeOptions.map((option) => (
                <option key={option} value={option} className="bg-[var(--surface-1)] text-[var(--text-1)]">
                  {option}
                </option>
              ))}
            </select>
            <label className="grid gap-2 text-sm text-[var(--text-2)]">
              Valid From
              <input
                type="datetime-local"
                className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
                value={passPayload.valid_from}
                onChange={(e) => setPassPayload((prev) => ({ ...prev, valid_from: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--text-2)]">
              Valid To
              <input
                type="datetime-local"
                className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
                value={passPayload.valid_to}
                onChange={(e) => setPassPayload((prev) => ({ ...prev, valid_to: e.target.value }))}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Pass"}
            </button>
            {message ? <p className="text-xs text-[var(--text-2)]">{message}</p> : null}
          </form>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Today Timeline">
          <TextList items={timelineItems} />
        </Panel>
      </div>
    </DashboardLayout>
  );
}
