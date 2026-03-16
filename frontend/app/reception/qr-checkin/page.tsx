"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

type VisitStatusRow = {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  host_name?: string;
  status: string;
  approval_email_sent?: boolean | null;
  approval_email_error?: string | null;
};

type VisitStatusResult = VisitStatusRow;

type AvailableIdCard = { id: number; id_number: string };

function areVisitStatusListsEqual(a: VisitStatusRow[], b: VisitStatusRow[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.visit_id !== right.visit_id ||
      left.visitor_id !== right.visitor_id ||
      left.visitor_name !== right.visitor_name ||
      left.host_name !== right.host_name ||
      left.status !== right.status ||
      left.approval_email_sent !== right.approval_email_sent ||
      left.approval_email_error !== right.approval_email_error
    ) {
      return false;
    }
  }
  return true;
}

function areAvailableCardsEqual(a: AvailableIdCard[], b: AvailableIdCard[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (left.id !== right.id || left.id_number !== right.id_number) return false;
  }
  return true;
}

export default function ReceptionQrCheckinPage() {
  const { pushToast } = useToast();
  const user = useAuthGuard({ allowedRoles: ["receptionist", "admin"] });

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

  const [visitList, setVisitList] = useState<VisitStatusRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [idCardLoading, setIdCardLoading] = useState(false);
  const [availableCards, setAvailableCards] = useState<AvailableIdCard[]>([]);
  const [resendLoading, setResendLoading] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const cardFetchInFlightRef = useRef(false);
  const cardsLoadedRef = useRef(false);
  const skipStatusResetRef = useRef(false);

  const fetchVisitList = useCallback(
    async (options: { showToast?: boolean; showLoading?: boolean } = {}) => {
      const showToast = options.showToast ?? false;
      const showLoading = options.showLoading ?? false;
      if (showLoading) setListLoading(true);
      try {
        const data = await apiFetch<VisitStatusRow[]>("/visits/list");
        const next = data ?? [];
        setVisitList((prev) => (areVisitStatusListsEqual(prev, next) ? prev : next));
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
        if (showLoading) setListLoading(false);
      }
    },
    [pushToast]
  );

  const fetchAvailableCards = useCallback(
    async (options: { showToast?: boolean; showLoading?: boolean; force?: boolean } = {}) => {
      const showToast = options.showToast ?? false;
      const showLoading = options.showLoading ?? showToast;
      const force = options.force ?? false;

      if (cardFetchInFlightRef.current) return;
      if (!force && cardsLoadedRef.current && !showToast && !showLoading) return;

      cardFetchInFlightRef.current = true;
      if (showLoading) setIdCardLoading(true);
      try {
        const data = await apiFetch<AvailableIdCard[]>("/id-cards/available");
        const next = data ?? [];
        setAvailableCards((prev) => (areAvailableCardsEqual(prev, next) ? prev : next));
        cardsLoadedRef.current = true;

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
        cardFetchInFlightRef.current = false;
        if (showLoading) setIdCardLoading(false);
      }
    },
    [pushToast]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchVisitList({ showToast: true, showLoading: true }),
      fetchAvailableCards({ showLoading: true, force: true }),
    ]);
  }, [fetchAvailableCards, fetchVisitList]);

  const handleResendApprovalEmail = useCallback(
    async (visitId: number) => {
      setResendLoading((prev) => (prev[visitId] ? prev : { ...prev, [visitId]: true }));
      try {
        const result = await apiFetch<{ sent: boolean }>("/visitor/resend-approval", {
          method: "POST",
          body: JSON.stringify({ visit_id: visitId }),
        });

        if (result?.sent) {
          pushToast({
            title: "Email sent",
            description: "Approval email resent to the host.",
            variant: "success",
          });
          await fetchVisitList();
          return;
        }

        pushToast({
          title: "Email not sent",
          description: "Approval email could not be resent.",
          variant: "error",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to resend approval email";
        pushToast({ title: "Email not sent", description: errorMessage, variant: "error" });
      } finally {
        setResendLoading((prev) => {
          if (!prev[visitId]) return prev;
          const next = { ...prev };
          delete next[visitId];
          return next;
        });
      }
    },
    [fetchVisitList, pushToast]
  );

  const handleLoadVisit = useCallback((visit: VisitStatusRow) => {
    skipStatusResetRef.current = true;
    setQrCode(String(visit.visitor_id));
    setMessage("");
    setResolvedVisitorId(visit.visitor_id);
    setVisitorStatus(visit.status ?? "");
    setVisitorDetail({
      name: visit.visitor_name,
      phone: undefined,
      company: visit.host_name,
      status: visit.status,
    });
  }, []);

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

      void fetchAvailableCards();
      void fetchVisitList();
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

  const handleStatusCheck = useCallback(
    async (options: { showToast?: boolean; showLoading?: boolean } = {}) => {
      const showToast = options.showToast ?? true;
      const showLoading = options.showLoading ?? showToast;
      if (!qrCode) return;
      if (showToast) setMessage("");
      if (showLoading) setLoading(true);
      try {
        const data = await apiFetch<VisitStatusResult>(`/visits/status?code=${encodeURIComponent(qrCode)}`);
        setVisitorDetail((prev) => {
          const next = {
            name: data.visitor_name,
            phone: undefined,
            company: data.host_name,
            status: data.status,
          };
          if (!prev) return next;
          return prev.name === next.name && prev.company === next.company && prev.status === next.status ? prev : next;
        });
        setVisitorStatus((prev) => (prev === (data.status ?? "") ? prev : data.status ?? ""));
        setResolvedVisitorId((prev) => (prev === data.visitor_id ? prev : data.visitor_id));
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
        if (showToast) {
          setMessage(errorMessage);
          setVisitorDetail(null);
          setVisitorStatus("");
          pushToast({ title: "Status check failed", description: errorMessage, variant: "error" });
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [pushToast, qrCode]
  );

  useEffect(() => {
    void fetchVisitList({ showLoading: true });
    void fetchAvailableCards({ showLoading: true });
  }, [fetchAvailableCards, fetchVisitList]);

  useEffect(() => {
    if (!qrCode) return;
    if (skipStatusResetRef.current) {
      skipStatusResetRef.current = false;
      return;
    }
    setVisitorDetail(null);
    setVisitorStatus("");
    setResolvedVisitorId(null);
  }, [qrCode]);

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Check-in" subtitle="Scan or paste a QR code to complete a check-in." />
      <div className="space-y-6">
        <EntryDeskHeader title="QR Fast Check-in" subtitle="Use QR codes for returning visitors and access passes." />

        <Panel title="QR Code">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleQrCheckin}>
            <input
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              placeholder="Visitor ID / phone / email / QR code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              required
            />
            <select
              className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
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
              <option value="" className="bg-[var(--surface-1)] text-[var(--text-1)]">
                {idCardLoading ? "Loading ID cards..." : "Select ID card"}
              </option>
              {availableCards.map((card) => (
                <option key={card.id} value={card.id_number} className="bg-[var(--surface-1)] text-[var(--text-1)]">
                  {card.id_number}
                </option>
              ))}
              <option value="__custom__" className="bg-[var(--surface-1)] text-[var(--text-1)]">
                Custom
              </option>
            </select>
            {idCardSelection === "__custom__" ? (
              <input
                className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
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
              onClick={() => handleStatusCheck({ showToast: true, showLoading: true })}
              disabled={loading}
              className="whitespace-nowrap rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)] disabled:opacity-60"
            >
              Check Status
            </button>
            <button
              type="submit"
              disabled={loading || visitorStatus !== "approved"}
              className="whitespace-nowrap rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Checking in..." : "Check-in"}
            </button>
          </form>

          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={policyAccepted}
              onChange={(e) => setPolicyAccepted(e.target.checked)}
              className="h-4 w-4 rounded border border-[var(--border-1)] bg-[var(--surface-2)] accent-[var(--accent)]"
            />
            Policy agreement accepted
          </label>

          {visitorDetail ? (
            <div className="mt-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-2)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">Host Response</p>
                  <p className="mt-1 text-base font-semibold text-[var(--text-1)]">{visitorDetail.name}</p>
                  <p className="text-xs text-[var(--text-3)]">Host: {visitorDetail.company ?? "Unknown"}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    visitorStatus === "approved"
                      ? "border-[var(--nav-active-bg)] bg-[var(--nav-active-bg)] text-[var(--accent)]"
                      : visitorStatus === "rejected"
                      ? "border-rose-200/60 bg-rose-500/15 text-rose-400"
                      : "border-amber-200/60 bg-amber-500/15 text-amber-500"
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
                <p className="mt-3 text-xs text-red-300">This visit has been rejected by the host.</p>
              ) : null}
            </div>
          ) : null}
          {message ? <p className="mt-3 text-sm text-[var(--text-2)]">{message}</p> : null}
        </Panel>

        <Panel
          title="Visitor Approval Status"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={listLoading || idCardLoading}
                className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)] disabled:opacity-60"
              >
                {listLoading || idCardLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">
                <tr>
                  <th className="px-3 py-2">Visitor</th>
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                {visitList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-sm text-[var(--text-3)]">
                      No visitor records available.
                    </td>
                  </tr>
                ) : (
                  visitList.map((visit) => {
                    const emailSent = visit.approval_email_sent === true;
                    const emailNotSent = visit.approval_email_sent === false || Boolean(visit.approval_email_error);
                    const canResend = visit.status === "pending" && !emailSent;
                    const resendBusy = Boolean(resendLoading[visit.visit_id]);
                    const statusLabel =
                      visit.status === "approved"
                        ? "Approved"
                        : visit.status === "rejected"
                        ? "Rejected"
                        : visit.status === "pending"
                        ? "Pending"
                        : visit.status === "checked_in"
                        ? "Checked in"
                        : visit.status === "checked_out"
                        ? "Checked out"
                        : visit.status;

                    return (
                      <tr key={visit.visit_id} className="text-[var(--text-2)]">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[var(--text-1)]">{visit.visitor_name}</p>
                      </td>
                        <td className="px-3 py-3 text-sm">{visit.host_name ?? "Unknown"}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              visit.status === "approved" ||
                              visit.status === "pending" ||
                              visit.status === "checked_in" ||
                              visit.status === "checked_out"
                                ? "border-[var(--nav-active-bg)] bg-[var(--nav-active-bg)] text-[var(--accent)]"
                                : visit.status === "rejected"
                                ? "border-rose-200/60 bg-rose-500/15 text-rose-400"
                                : "border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)]"
                            }`}
                          >
                            {statusLabel}
                          </span>
                          {visit.status === "checked_in" || visit.status === "checked_out" ? null : (
                            <p className="mt-2 text-xs text-[var(--text-3)]">
                              {emailSent ? (
                                "Email sent"
                              ) : emailNotSent ? (
                                <>Email not sent{visit.approval_email_error ? `: ${visit.approval_email_error}` : ""}</>
                              ) : (
                                "Email pending"
                              )}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadVisit(visit)}
                              disabled={visit.status === "checked_in"}
                              className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)] disabled:opacity-60"
                            >
                              Load
                            </button>
                            {canResend ? (
                              <button
                                type="button"
                                onClick={() => handleResendApprovalEmail(visit.visit_id)}
                                disabled={resendBusy}
                                className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)] disabled:opacity-60"
                              >
                                {resendBusy ? "Sending..." : "Resend Email"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--text-3)]">Check-in is enabled only when status is approved.</p>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
