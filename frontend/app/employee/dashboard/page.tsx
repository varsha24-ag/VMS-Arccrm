"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel, SimpleTable, StatGrid, TextList } from "@/components/dashboard/panels";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

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

interface AccessPassPayload {
  visitor_name: string;
  phone?: string;
  email?: string;
  company?: string;
  host_employee_id?: number | null;
  valid_from: string;
  valid_to: string;
  max_visits: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passPayload, setPassPayload] = useState<AccessPassPayload>({
    visitor_name: "",
    phone: "",
    email: "",
    company: "",
    host_employee_id: null,
    valid_from: "",
    valid_to: "",
    max_visits: 10,
  });

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "employee") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  async function handleCreatePass(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await apiFetch("/access-pass/create", {
        method: "POST",
        body: JSON.stringify({
          ...passPayload,
          host_employee_id: passPayload.host_employee_id ? Number(passPayload.host_employee_id) : null,
          max_visits: Number(passPayload.max_visits),
        }),
      });
      setMessage("Access pass created.");
      setPassPayload({
        visitor_name: "",
        phone: "",
        email: "",
        company: "",
        host_employee_id: null,
        valid_from: "",
        valid_to: "",
        max_visits: 10,
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create pass");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Employee Dashboard"
      subtitle="Track your visitor approvals, scheduled meetings, and daily access tasks."
      modules={["My Requests", "Approvals", "History", "Notifications", "Profile"]}
    >
      <StatGrid items={stats} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Pending Visitor Approvals">
          <SimpleTable headers={approvalTable.headers} rows={approvalTable.rows} />
        </Panel>

        <Panel title="Generate Visitor Access Pass">
          <form className="grid gap-3" onSubmit={handleCreatePass}>
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Visitor name"
              value={passPayload.visitor_name}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, visitor_name: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Phone"
              value={passPayload.phone}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Email"
              value={passPayload.email}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Company"
              value={passPayload.company}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, company: e.target.value }))}
            />
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Host employee ID"
              value={passPayload.host_employee_id ?? ""}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, host_employee_id: Number(e.target.value) || null }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={passPayload.valid_from}
                onChange={(e) => setPassPayload((prev) => ({ ...prev, valid_from: e.target.value }))}
                required
              />
              <input
                type="date"
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={passPayload.valid_to}
                onChange={(e) => setPassPayload((prev) => ({ ...prev, valid_to: e.target.value }))}
                required
              />
            </div>
            <input
              type="number"
              min={1}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Max visits"
              value={passPayload.max_visits}
              onChange={(e) => setPassPayload((prev) => ({ ...prev, max_visits: Number(e.target.value) }))}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Pass"}
            </button>
            {message ? <p className="text-xs text-[#ffc5aa]">{message}</p> : null}
          </form>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Today Timeline">
          <TextList items={timelineItems} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
