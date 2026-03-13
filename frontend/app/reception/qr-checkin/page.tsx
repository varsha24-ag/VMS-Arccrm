"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import Pagination from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

export default function ReceptionQrCheckinPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idCardSelection, setIdCardSelection] = useState("");
  const [customIdNumber, setCustomIdNumber] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [visitorStatus, setVisitorStatus] = useState<string>("");
  const [resolvedVisitorId, setResolvedVisitorId] = useState<number | null>(null);
  const [visitorDetail, setVisitorDetail] = useState<{
    name: string;
    phone?: string;
    company?: string;
    status?: string;
  } | null>(null);
  const [visitList, setVisitList] = useState<
    Array<{
      visit_id: number;
      visitor_id: number;
      visitor_name: string;
      host_name?: string;
      status: string;
    }>
  >([]);
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalPageSize, setApprovalPageSize] = useState(5);
  const [listLoading, setListLoading] = useState(false);
  const [idCardLoading, setIdCardLoading] = useState(false);
  const [availableCards, setAvailableCards] = useState<Array<{ id: number; id_number: string }>>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);
  const listPollRef = useRef<number | null>(null);
  const lastStatusRef = useRef<string>("");
  const listStatusRef = useRef<Record<number, string>>({});
  const { pushToast } = useToast();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist" && user.role !== "admin") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  async function fetchVisitList(showToast = false) {
    setListLoading(true);
    try {
      const data = await apiFetch<
        Array<{
          visit_id: number;
          visitor_id: number;
          visitor_name: string;
          host_name?: string;
          status: string;
        }>
      >("/visits/list");
      const nextList = data ?? [];
      setVisitList(nextList);
      if (!showToast) {
        const previous = listStatusRef.current;
        const nextMap: Record<number, string> = {};
        nextList.forEach((visit) => {
          nextMap[visit.visit_id] = visit.status;
          const prevStatus = previous[visit.visit_id];
          if (prevStatus && prevStatus !== visit.status) {
            if (visit.status === "approved") {
              pushToast({
                title: "Host approved",
                description: `${visit.visitor_name} is approved.`,
                variant: "success",
              });
            } else if (visit.status === "rejected") {
              pushToast({
                title: "Host rejected",
                description: `${visit.visitor_name} was rejected.`,
                variant: "error",
              });
            }
          }
        });
        listStatusRef.current = nextMap;
      }
      if (showToast) {
        pushToast({
          title: "Status refreshed",
          description: "Visitor approval statuses updated.",
          variant: "success",
        });
      }
    } catch (err) {
      if (showToast) {
        const errorMessage =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to load visitors";
        pushToast({ title: "Failed to refresh", description: errorMessage, variant: "error" });
      }
    } finally {
      setListLoading(false);
    }
  }

  async function fetchAvailableCards(showToast = false) {
    setIdCardLoading(true);
    try {
      const data = await apiFetch<Array<{ id: number; id_number: string }>>("/id-cards/available");
      setAvailableCards(data ?? []);
      if (showToast) {
        pushToast({
          title: "ID cards updated",
          description: "Available ID cards refreshed.",
          variant: "success",
        });
      }
    } catch (err) {
      if (showToast) {
        const errorMessage =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to load ID cards";
        pushToast({ title: "Failed to refresh", description: errorMessage, variant: "error" });
      }
    } finally {
      setIdCardLoading(false);
    }
  }

  async function handleQrCheckin(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!idNumber.trim()) {
      const msg = "Select an ID card number.";
      setMessage(msg);
      pushToast({ title: "ID card required", description: msg, variant: "error" });
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/visit/checkin", {
        method: "POST",
        body: JSON.stringify({
          visitor_id: resolvedVisitorId ?? Number(qrCode),
          id_number: idNumber,
          policy_accepted: policyAccepted,
        }),
      });
      setMessage("QR check-in completed.");
      pushToast({
        title: "Check-in completed",
        description: "QR check-in successful.",
        variant: "success",
      });
      setQrCode("");
      setIdNumber("");
      setIdCardSelection("");
      setCustomIdNumber("");
      setVisitorDetail(null);
      setVisitorStatus("");
      setResolvedVisitorId(null);
      void fetchAvailableCards(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "QR check-in failed";
      setMessage(errorMessage);
      pushToast({
        title: "Check-in failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusCheck(showToast = true) {
    if (!qrCode) return;
    setMessage("");
    setLoading(true);
    try {
      const data = await apiFetch<{
        visit_id: number;
        visitor_id: number;
        visitor_name: string;
        host_name?: string;
        status: string;
      }>(`/visits/status?code=${encodeURIComponent(qrCode)}`);
      setVisitorDetail({
        name: data.visitor_name,
        phone: undefined,
        company: data.host_name,
        status: data.status,
      });
      const nextStatus = data.status ?? "";
      if (!showToast && lastStatusRef.current && lastStatusRef.current !== nextStatus) {
        if (nextStatus === "approved") {
          pushToast({ title: "Approved by host", description: "You can check-in this visitor.", variant: "success" });
        } else if (nextStatus === "rejected") {
          pushToast({ title: "Rejected by host", description: "Do not proceed with check-in.", variant: "error" });
        } else {
          pushToast({ title: "Pending approval", description: "Wait for host response.", variant: "info" });
        }
      }
      lastStatusRef.current = nextStatus;
      setVisitorStatus(nextStatus);
      setResolvedVisitorId(data.visitor_id);
      if (showToast) {
        if (data.status === "approved") {
          pushToast({ title: "Approved by host", description: "You can check-in this visitor.", variant: "success" });
        } else if (data.status === "rejected") {
          pushToast({ title: "Rejected by host", description: "Do not proceed with check-in.", variant: "error" });
        } else {
          pushToast({ title: "Pending approval", description: "Wait for host response.", variant: "info" });
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to fetch status";
      setMessage(errorMessage);
      setVisitorDetail(null);
      setVisitorStatus("");
      pushToast({ title: "Status check failed", description: errorMessage, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchVisitList(false);
    void fetchAvailableCards(false);
    if (!listPollRef.current) {
      listPollRef.current = window.setInterval(() => {
        void fetchVisitList(false);
      }, 10000);
    }
    return () => {
      if (listPollRef.current) {
        window.clearInterval(listPollRef.current);
        listPollRef.current = null;
      }
    };
  }, []);

  const approvalTotalPages = Math.max(1, Math.ceil(visitList.length / approvalPageSize));
  const pagedVisitList = useMemo(() => {
    const start = (approvalPage - 1) * approvalPageSize;
    return visitList.slice(start, start + approvalPageSize);
  }, [visitList, approvalPage, approvalPageSize]);

  useEffect(() => {
    setApprovalPage(1);
  }, [approvalPageSize]);

  useEffect(() => {
    if (approvalPage > approvalTotalPages) {
      setApprovalPage(approvalTotalPages);
    }
  }, [approvalPage, approvalTotalPages]);

  useEffect(() => {
    if (!qrCode) {
      lastStatusRef.current = "";
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    void handleStatusCheck(false);
    if (!pollRef.current) {
      pollRef.current = window.setInterval(() => {
        void handleStatusCheck(false);
      }, 5000);
    }
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [qrCode]);

  return (
    <DashboardShell
      title="Check-in"
      subtitle="Scan or paste a QR code to complete a check-in."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Visitors", href: "/reception/visitors" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "Check-in", href: "/reception/qr-checkin" },
        { label: "History", href: "/reception/history" },
        { label: "Checkout", href: "/reception/manual-checkout" },
      ]}
    >
      <div className="space-y-6">
        <EntryDeskHeader
          title="QR Fast Check-in"
          subtitle="Use QR codes for returning visitors and access passes."
        />

        <Panel title="QR Code">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleQrCheckin}>
            <input
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Visitor ID / phone / email / QR code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              required
            />
            <select
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              value={idCardSelection}
              onChange={(e) => {
                const value = e.target.value;
                setIdCardSelection(value);
                if (value === "__custom__") {
                  setIdNumber("");
                  setCustomIdNumber("");
                } else {
                  setCustomIdNumber("");
                  setIdNumber(value);
                }
              }}
              required
            >
              <option value="" className="bg-[#0f1e2f] text-white">
                {idCardLoading ? "Loading ID cards..." : "Select ID card"}
              </option>
              {availableCards.map((card) => (
                <option key={card.id} value={card.id_number} className="bg-[#0f1e2f] text-white">
                  {card.id_number}
                </option>
              ))}
              <option value="__custom__" className="bg-[#0f1e2f] text-white">
                Custom
              </option>
            </select>
            {idCardSelection === "__custom__" ? (
              <input
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Enter ID card number"
                value={customIdNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomIdNumber(value);
                  setIdNumber(value);
                }}
                required
              />
            ) : null}
            <button
              type="button"
              onClick={() => handleStatusCheck(true)}
              disabled={loading}
              className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-60"
            >
              Check Status
            </button>
            <button
              type="submit"
              disabled={loading || visitorStatus !== "approved"}
              className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Checking in..." : "Check-in"}
            </button>
          </form>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={policyAccepted}
              onChange={(e) => setPolicyAccepted(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#ff7a45]"
            />
            Policy agreement accepted
          </label>
          {visitorDetail ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Host Response</p>
                  <p className="mt-1 text-base font-semibold text-white">{visitorDetail.name}</p>
                  <p className="text-xs text-slate-400">Host: {visitorDetail.company ?? "Unknown"}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    visitorStatus === "approved"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : visitorStatus === "rejected"
                      ? "bg-red-500/20 text-red-200"
                      : "bg-yellow-500/20 text-yellow-200"
                  }`}
                >
                  {visitorStatus === "approved"
                    ? "Approved by Host"
                    : visitorStatus === "rejected"
                    ? "Rejected by Host"
                    : "Pending Host Response"}
                </span>
              </div>
              {visitorStatus === "rejected" ? (
                <p className="mt-3 text-xs text-red-300">
                  This visit has been rejected by the host.
                </p>
              ) : null}
            </div>
          ) : null}
          {message ? <p className="mt-3 text-sm text-[#ffc5aa]">{message}</p> : null}
        </Panel>

        <Panel
          title="Visitor Approval Status"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchAvailableCards(true)}
                disabled={idCardLoading}
                className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-60"
              >
                {idCardLoading ? "Cards..." : "Refresh Cards"}
              </button>
              <button
                type="button"
                onClick={() => fetchVisitList(true)}
                disabled={listLoading}
                className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-60"
              >
                {listLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Visitor</th>
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visitList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-sm text-slate-300">
                      No visitor records available.
                    </td>
                  </tr>
                ) : (
                  pagedVisitList.map((visit) => (
                    <tr key={visit.visit_id} className="text-slate-200">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-white">{visit.visitor_name}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">{visit.host_name ?? "Unknown"}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            visit.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : visit.status === "rejected"
                              ? "bg-red-500/20 text-red-200"
                              : "bg-yellow-500/20 text-yellow-200"
                          }`}
                        >
                          {visit.status === "approved"
                            ? "Approved"
                            : visit.status === "rejected"
                            ? "Rejected"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setQrCode(String(visit.visitor_id));
                            setMessage("");
                          }}
                          className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200"
                        >
                          Prep Check-in
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination
              page={approvalPage}
              totalItems={visitList.length}
              pageSize={approvalPageSize}
              onPageChange={setApprovalPage}
              onPageSizeChange={setApprovalPageSize}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Check-in is enabled only when status is approved.
          </p>
        </Panel>
      </div>
    </DashboardShell>
  );
}
