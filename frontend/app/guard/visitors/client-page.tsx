"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import AppDataGrid, {
  GridColDef,
  type GridRenderCellParams,
} from "@/components/ui/app-data-grid";
import { apiFetch, resolveApiAssetUrl } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useToast } from "@/components/ui/toast";

type VisitHistoryItem = {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  id_number?: string | null;
  visitor_phone?: string | null;
  visitor_email?: string | null;
  company?: string | null;
  photo_url?: string | null;
  host_employee_id?: number | null;
  purpose?: string | null;
  created_at?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
};

type HistoryRow = VisitHistoryItem & {
  host_name: string;
  status_label: string;
  photo: string | null;
};

type ColumnOption = {
  key: string;
  label: string;
};

const defaultVisitorVisibleColumns = [
  "sr_no",
  "visitor_name",
  "host_name",
  "status",
  "created_at",
  "purpose",
];

type TableColumnToggleProps = {
  columns: ColumnOption[];
  visibleColumns: string[];
  defaultVisibleColumns: string[];
  onToggle: (field: string) => void;
};

function Loader2() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function TableColumnToggle({ columns, visibleColumns, defaultVisibleColumns, onToggle }: TableColumnToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const hasCustomSelection =
    visibleColumns.length !== defaultVisibleColumns.length ||
    defaultVisibleColumns.some((column) => !visibleColumns.includes(column));
  const isActive = open || hasCustomSelection;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`min-h-[42px] rounded-full border px-4 py-2 text-xs font-semibold transition ${
          isActive
            ? "border-[var(--accent)] bg-[var(--nav-active-bg)] text-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]"
            : "border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
        }`}
        onClick={() => setOpen((current) => !current)}
      >
        Columns
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]/100 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.42)] backdrop-blur-xl">
          <div className="mb-2 px-2 pt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">
            Visible columns
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {columns.map((column) => {
              const isVisible = visibleColumns.includes(column.key);
              return (
              <label
                key={column.key}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--surface-2)]"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggle(column.key)}
                  className={`h-4 w-4 rounded border accent-[var(--accent)] ${
                    isVisible ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20" : "border-[var(--border-1)]"
                  }`}
                />
                <span>{column.label}</span>
              </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReceptionVisitorsContent() {
  const user = useAuthGuard({ allowedRoles: ["guard", "admin", "superadmin"] });
  const { pushToast } = useToast();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [checkoutConfirmRow, setCheckoutConfirmRow] = useState<HistoryRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisitorVisibleColumns);
  const [hostMap, setHostMap] = useState<Record<number, string>>({});
  const [allHostsList, setAllHostsList] = useState<Array<{ id: number; name: string; department?: string }>>([]);
  const [assigningHostId, setAssigningHostId] = useState<string>("");
  const [hostSearchQuery, setHostSearchQuery] = useState<string>("");
  const [isAssigningHost, setIsAssigningHost] = useState(false);
  const [isEditingHost, setIsEditingHost] = useState(false);

  const [availableCards, setAvailableCards] = useState<Array<{ id: number; id_number: string }>>([]);
  const [selectedIdCard, setSelectedIdCard] = useState<string>("");
  const [customIdCard, setCustomIdCard] = useState<string>("");
  const [isAssigningCard, setIsAssigningCard] = useState(false);
  const [isEditingIdCard, setIsEditingIdCard] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const visitIdParam = searchParams.get("visitId");
  const visitorIdParam = searchParams.get("visitorId");

  useEffect(() => {
    setIsEditingHost(false);
    setAssigningHostId("");
    setHostSearchQuery("");
    setIsEditingIdCard(false);
    setSelectedIdCard("");
    setCustomIdCard("");
  }, [selectedVisitId]);

  useEffect(() => {
    if (!visitIdParam) return;
    const parsed = Number(visitIdParam);
    if (!Number.isNaN(parsed)) {
      setSelectedVisitId(parsed);
      setDetailsOpen(true);
    }
  }, [visitIdParam]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "border-emerald-300/60 bg-emerald-500/15 text-emerald-400";
      case "pending":
        return "border-amber-300/60 bg-amber-500/15 text-amber-400";
      case "rejected":
        return "border-red-300/60 bg-red-500/15 text-red-400";
      case "IN":
        return "border-orange-500/50 bg-orange-500/20 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.15)]";
      case "OUT":
        return "border-sky-500/50 bg-sky-500/20 text-sky-400 font-bold shadow-[0_0_10px_rgba(14,165,233,0.15)]";
      case "Auto-out":
      case "auto_checked_out":
        return "border-violet-500/50 bg-violet-500/20 text-violet-400 font-bold shadow-[0_0_10px_rgba(139,92,246,0.15)]";
      default:
        if (status.toLowerCase().startsWith("auto")) {
          return "border-violet-500/50 bg-violet-500/20 text-violet-400 font-bold shadow-[0_0_10px_rgba(139,92,246,0.15)]";
        }
        return "border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)]";
    }
  };

  const statusLabel = useCallback((status: string) => {
    if (status === "checked_in" || status === "IN") return "IN";
    if (status === "checked_out" || status === "OUT") return "OUT";
    if (status === "auto_checked_out" || status === "Auto-out" || status.toLowerCase().startsWith("auto")) return "Auto-OUT";
    return status.replace(/_/g, " ");
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [historyData, hostData, cardsData] = await Promise.all([
        apiFetch<VisitHistoryItem[]>("/visit/history"),
        apiFetch<Array<{ id: number; name: string; department?: string }>>("/employees/hosts"),
        apiFetch<Array<{ id: number; id_number: string }>>("/id-cards/available").catch(() => []),
      ]);

      setAllHostsList(hostData ?? []);
      setAvailableCards(cardsData ?? []);

      const nextHostMap: Record<number, string> = {};
      (hostData ?? []).forEach((host) => {
        nextHostMap[host.id] = host.name;
      });
      setHostMap(nextHostMap);

      const enrichedRows = [...(historyData ?? [])]
        .sort((a, b) => b.visit_id - a.visit_id)
        .map((item) => ({
          ...item,
          status: item.status === "checked_in" ? "IN" : item.status === "checked_out" ? "OUT" : item.status,
          host_name: item.host_employee_id ? nextHostMap[item.host_employee_id] ?? "Unknown" : "Unassigned",
          status_label: statusLabel(item.status === "checked_in" ? "IN" : item.status === "checked_out" ? "OUT" : item.status),
          photo: resolveApiAssetUrl(item.photo_url),
        }));

      setRows(enrichedRows);

      if (visitorIdParam) {
        const parsed = Number(visitorIdParam);
        if (!Number.isNaN(parsed)) {
          const latestForVisitor = enrichedRows.find((item) => item.visitor_id === parsed);
          if (latestForVisitor) {
            setSelectedVisitId(latestForVisitor.visit_id);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusLabel, user, visitorIdParam]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleStatusUpdate = () => {
      void fetchData();
    };

    window.addEventListener("visitor-status-updated", handleStatusUpdate);
    return () => {
      window.removeEventListener("visitor-status-updated", handleStatusUpdate);
    };
  }, [fetchData]);

  const handleAssignHost = async (visitId: number) => {
    if (!visitId || !assigningHostId) return;
    setIsAssigningHost(true);
    try {
      const res = await apiFetch<{ status: string; host_name: string; host_employee_id: number }>(
        `/visits/${visitId}/assign-host`,
        {
          method: "POST",
          body: JSON.stringify({ host_employee_id: Number(assigningHostId) }),
        }
      );
      setRows((prev) =>
        prev.map((r) =>
          r.visit_id === visitId
            ? { ...r, host_employee_id: res.host_employee_id, host_name: res.host_name }
            : r
        )
      );
      setHostMap((prev) => ({ ...prev, [res.host_employee_id]: res.host_name }));
      setAssigningHostId("");
      setHostSearchQuery("");
      pushToast({
        title: "Host Assigned",
        description: `${res.host_name} assigned as host.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to assign host:", err);
      pushToast({
        title: "Host Assignment Failed",
        description: err instanceof Error ? err.message : "Failed to assign host.",
        variant: "error",
      });
    } finally {
      setIsAssigningHost(false);
    }
  };

  const handleAssignIdCard = async (visitId: number, idCardValue: string) => {
    setIsAssigningCard(true);
    try {
      const res = await apiFetch<{ status: string; id_number: string | null }>(
        `/visits/${visitId}/assign-id-card`,
        {
          method: "POST",
          body: JSON.stringify({ id_number: idCardValue }),
        }
      );
      setRows((prev) =>
        prev.map((r) =>
          r.visit_id === visitId ? { ...r, id_number: res.id_number } : r
        )
      );
      setIsEditingIdCard(false);
      setSelectedIdCard("");
      setCustomIdCard("");
      const freshCards = await apiFetch<Array<{ id: number; id_number: string }>>("/id-cards/available").catch(() => []);
      setAvailableCards(freshCards ?? []);
      pushToast({
        title: idCardValue ? "ID Card Assigned" : "ID Card Removed",
        description: idCardValue
          ? `ID Card ${idCardValue} assigned successfully.`
          : "ID Card removed from visitor.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to assign ID card:", err);
      pushToast({
        title: "ID Card Update Failed",
        description: err instanceof Error ? err.message : "Failed to update ID card.",
        variant: "error",
      });
    } finally {
      setIsAssigningCard(false);
    }
  };

  const executeCheckoutVisit = async (visit: HistoryRow) => {
    setIsCheckingOut(true);
    try {
      const res = await apiFetch<{ status: string; checkout_time?: string }>(
        `/visits/${visit.visit_id}/checkout`,
        { method: "POST" }
      );
      setRows((prev) =>
        prev.map((r) =>
          r.visit_id === visit.visit_id
            ? {
                ...r,
                status: "OUT",
                status_label: "OUT",
                checkout_time: res.checkout_time || new Date().toISOString(),
                id_number: null,
              }
            : r
        )
      );
      setIsEditingIdCard(false);
      pushToast({
        title: "Visitor Checked OUT",
        description: `${visit.visitor_name} checked out successfully.`,
        variant: "success",
      });
      void fetchData();
    } catch (err) {
      console.error("Failed to check out visit:", err);
      pushToast({
        title: "Checkout Failed",
        description: err instanceof Error ? err.message : "Failed to check out visitor.",
        variant: "error",
      });
    } finally {
      setIsCheckingOut(false);
      setCheckoutConfirmRow(null);
    }
  };

  const selectedRow = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.find((item) => item.visit_id === selectedVisitId) ?? rows[0];
  }, [rows, selectedVisitId]);

  const filteredHosts = useMemo(() => {
    const q = hostSearchQuery.trim().toLowerCase();
    if (!q) return allHostsList;
    return allHostsList.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.department && h.department.toLowerCase().includes(q))
    );
  }, [allHostsList, hostSearchQuery]);

  const allColumnOptions = useMemo<ColumnOption[]>(
    () => [
      { key: "sr_no", label: "Sr. No." },
      { key: "visitor_name", label: "Visitor" },
      { key: "host_name", label: "Host" },
      { key: "id_number", label: "ID Card" },
      { key: "status", label: "Status" },
      { key: "checkin_time", label: "IN" },
      { key: "created_at", label: "Created" },
      { key: "company", label: "Company" },
      { key: "visitor_email", label: "Email" },
      { key: "visitor_phone", label: "Phone" },
      { key: "purpose", label: "Purpose" },
    ],
    []
  );

  const visibleColumnModel = useMemo(
    () =>
      Object.fromEntries(allColumnOptions.map((column) => [column.key, visibleColumns.includes(column.key)])),
    [allColumnOptions, visibleColumns]
  );

  type HistoryValueGetterParams = {
    row: HistoryRow;
    api?: { getRowIndexRelativeToVisibleRows: (id: unknown) => number };
    id?: unknown;
  };

  const listColumns: GridColDef<HistoryRow>[] = useMemo(
    () => [
      {
        field: "sr_no",
        headerName: "Sr. No.",
        width: 90,
        filterable: false,
        valueGetter: ((params: HistoryValueGetterParams) => {
          if (!params?.api) return "";
          return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
        }),
        renderCell: (params: GridRenderCellParams<HistoryRow>) => {
          if (!params?.api) return "";
          return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
        },
      },
      {
        field: "visitor_name",
        headerName: "Visitor",
        flex: 1,
        minWidth: 210,
        filterable: true,
      },
      {
        field: "host_name",
        headerName: "Host",
        flex: 1,
        minWidth: 190,
        filterable: true,
        valueGetter: ((params: HistoryValueGetterParams) =>
          String(params?.row?.host_name ?? "").trim().toLowerCase()),
        renderCell: (params: GridRenderCellParams<HistoryRow>) => <span>{params.row.host_name}</span>,
      },
      {
        field: "id_number",
        headerName: "ID Card",
        flex: 0.8,
        minWidth: 140,
        filterable: false,
      },
      {
        field: "status",
        headerName: "Status",
        type: "singleSelect",
        valueOptions: ["approved", "pending", "rejected", "IN", "OUT", "auto_checked_out"],
        width: 180,
        minWidth: 180,
        filterable: true,
        valueFormatter: (value) => statusLabel(String(value ?? "")),
        renderCell: (params: GridRenderCellParams<HistoryRow>) => (
          <div className="min-w-0">
            <span
              className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${statusBadgeClass(
                String(params.row.status ?? "")
              )}`}
            >
              <span className="truncate">
                {statusLabel(String(params.row.status ?? ""))}
              </span>
            </span>
          </div>
        ),
      },
      {
        field: "checkin_time",
        headerName: "IN",
        flex: 1,
        minWidth: 180,
        filterable: false,
        valueGetter: (params: HistoryValueGetterParams) => params?.row?.checkin_time ?? null,
        valueFormatter: (value) => (value ? new Date(value as string).toLocaleString() : "-"),
        renderCell: (params: GridRenderCellParams<HistoryRow>) => (
          <span>{params.row.checkin_time ? new Date(params.row.checkin_time).toLocaleString() : "-"}</span>
        ),
      },
      {
        field: "created_at",
        headerName: "Created",
        flex: 0.9,
        minWidth: 165,
        filterable: true,
        valueGetter: (params: HistoryValueGetterParams) => params?.row?.created_at ?? null,
        valueFormatter: (value) => (value ? new Date(value as string).toLocaleDateString() : "-"),
        renderCell: (params: GridRenderCellParams<HistoryRow>) => (
          <span>{params.row.created_at ? new Date(params.row.created_at).toLocaleDateString() : "-"}</span>
        ),
      },
      {
        field: "company",
        headerName: "Company",
        flex: 1,
        minWidth: 160,
        filterable: false,
      },
      {
        field: "visitor_email",
        headerName: "Email",
        flex: 1,
        minWidth: 200,
        filterable: false,
      },
      {
        field: "visitor_phone",
        headerName: "Phone",
        flex: 0.8,
        minWidth: 140,
        filterable: false,
      },
      {
        field: "purpose",
        headerName: "Purpose",
        flex: 1,
        minWidth: 180,
        filterable: true,
        valueGetter: ((params: HistoryValueGetterParams) =>
          String(params?.row?.purpose ?? "").trim().toLowerCase()),
        renderCell: (params: GridRenderCellParams<HistoryRow>) => <span>{String(params.row.purpose ?? "").trim() || "-"}</span>,
      },
    ],
    [statusLabel]
  );

  const handleToggleColumn = useCallback((field: string) => {
    setVisibleColumns((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
    );
  }, []);

  const detailPanel = selectedRow ? (
    <>
      <div className="flex h-[61px] items-center justify-between border-b border-white/10 px-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-1)]">Visitor Details</p>
        </div>
        <button
          type="button"
          onClick={() => setDetailsOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-1)] text-[var(--text-2)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
          aria-label="Close visitor details"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="h-full overflow-y-auto p-4">
        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-center gap-4">
            {selectedRow.photo ? (
              <button
                type="button"
                onClick={() => setPreviewPhoto(selectedRow.photo)}
                className="group h-12 w-12 overflow-hidden rounded-full border border-[var(--border-1)] bg-[var(--surface-2)]"
              >
                <img
                  src={selectedRow.photo}
                  alt={selectedRow.visitor_name}
                  className="h-12 w-12 object-cover transition group-hover:scale-105"
                />
              </button>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--surface-3)] text-sm font-semibold text-[var(--text-1)]">
                {selectedRow.visitor_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-[180px]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-3)]">Visitor</p>
              <p className="text-xl font-semibold tracking-tight text-[var(--text-1)]">{selectedRow.visitor_name}</p>
              <p className="truncate text-sm text-[var(--text-2)]">{selectedRow.visitor_email ?? "—"}</p>
            </div>
            <span className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(selectedRow.status)}`}>
              {statusLabel(selectedRow.status)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Phone</p>
              <p className="text-base text-[var(--text-1)]">{selectedRow.visitor_phone ?? "—"}</p>
            </div>
            <div className={`space-y-1 ${isEditingIdCard ? "rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]/60 p-2.5 box-border w-full overflow-hidden" : ""}`}>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">ID Card</p>
                {selectedRow.status === "IN" && !isEditingIdCard && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentId = selectedRow.id_number || "";
                      const isKnown = availableCards.some((c) => c.id_number === currentId);
                      if (currentId && !isKnown) {
                        setSelectedIdCard("__custom__");
                        setCustomIdCard(currentId);
                      } else {
                        setSelectedIdCard(currentId);
                        setCustomIdCard("");
                      }
                      setIsEditingIdCard(true);
                    }}
                    className="px-2.5 py-0.5 rounded-lg border border-orange-500/40 bg-orange-500/15 text-orange-400 text-xs font-semibold hover:bg-orange-500/25 active:scale-95 transition shadow-2xs shrink-0 cursor-pointer"
                  >
                    {selectedRow.id_number ? "Change" : "+ Assign"}
                  </button>
                )}
                {isEditingIdCard && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingIdCard(false);
                      setSelectedIdCard("");
                      setCustomIdCard("");
                    }}
                    className="h-5 w-5 rounded-md border border-[var(--border-1)] bg-[var(--surface-1)] text-xs text-[var(--text-3)] hover:text-[var(--text-1)] flex items-center justify-center transition cursor-pointer shrink-0"
                    title="Cancel"
                  >
                    ✕
                  </button>
                )}
              </div>
              {!isEditingIdCard ? (
                <p className={`text-base font-medium ${!selectedRow.id_number ? "text-[var(--text-3)] italic text-sm" : "text-[var(--text-1)]"}`}>
                  {selectedRow.id_number || "— (No ID Card)"}
                </p>
              ) : (
                <div className="space-y-2 pt-1 w-full box-border">
                  <select
                    value={selectedIdCard}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedIdCard(val);
                      if (val !== "__custom__") {
                        setCustomIdCard("");
                      }
                    }}
                    className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs text-[var(--text-1)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] box-border"
                  >
                    <option value="">Select ID Card...</option>
                    {availableCards.map((c) => (
                      <option key={c.id} value={c.id_number}>
                        {c.id_number}
                      </option>
                    ))}
                    <option value="__custom__">Custom</option>
                  </select>

                  {selectedIdCard === "__custom__" && (
                    <input
                      type="text"
                      value={customIdCard}
                      onChange={(e) => setCustomIdCard(e.target.value)}
                      placeholder="Enter ID card number"
                      className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] box-border"
                      autoFocus
                    />
                  )}

                  <div className="flex items-center gap-1.5 pt-0.5 w-full">
                    <button
                      type="button"
                      disabled={
                        isAssigningCard ||
                        (!selectedIdCard || (selectedIdCard === "__custom__" && !customIdCard.trim()))
                      }
                      onClick={() => {
                        const finalCard = selectedIdCard === "__custom__" ? customIdCard.trim() : selectedIdCard;
                        if (finalCard) {
                          void handleAssignIdCard(selectedRow.visit_id, finalCard);
                        }
                      }}
                      className="flex-1 rounded-lg bg-[var(--accent)] py-1.5 px-3 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-xs text-center"
                    >
                      {isAssigningCard ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingIdCard(false);
                        setSelectedIdCard("");
                        setCustomIdCard("");
                      }}
                      className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] py-1.5 px-2.5 text-xs font-semibold text-[var(--text-3)] hover:text-[var(--text-1)] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {selectedRow.id_number && (
                    <button
                      type="button"
                      disabled={isAssigningCard}
                      onClick={() => void handleAssignIdCard(selectedRow.visit_id, "")}
                      className="text-[10px] text-rose-400 hover:underline block pt-0.5 cursor-pointer"
                    >
                      Remove ID Card
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Purpose</p>
              <p className="text-base text-[var(--text-1)]">{selectedRow.purpose ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Company</p>
              <p className="text-base text-[var(--text-1)]">{selectedRow.company ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">IN Time</p>
              <p className="text-base text-[var(--text-1)]">
                {selectedRow.checkin_time ? new Date(selectedRow.checkin_time).toLocaleString() : "—"}
              </p>
            </div>
            {selectedRow.checkout_time ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">OUT Time</p>
                <p className="text-base text-rose-400 font-semibold">
                  {new Date(selectedRow.checkout_time).toLocaleString()}
                </p>
              </div>
            ) : null}
          </div>

          {/* Quick Manual Checkout Action */}
          {selectedRow.status === "IN" && (
            <div className="mt-4 p-3.5 rounded-2xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Visitor Currently IN</p>
                </div>
                <p className="text-[11px] text-[var(--text-3)] truncate">
                  Manual checkout available anytime with or without an ID card.
                </p>
              </div>
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => setCheckoutConfirmRow(selectedRow)}
                className="shrink-0 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Check Out (OUT)</span>
              </button>
            </div>
          )}

          {/* Host Assignment Section */}
          {!selectedRow.host_employee_id || isEditingHost ? (
            <div className="mt-5 space-y-3 rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/10 p-4 w-full box-border overflow-hidden shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-400 truncate">
                    Host Assignment {selectedRow.host_employee_id ? "(Change Host)" : "(Unassigned)"}
                  </p>
                </div>
                {selectedRow.host_employee_id && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingHost(false);
                      setAssigningHostId("");
                      setHostSearchQuery("");
                    }}
                    className="text-[11px] font-medium text-[var(--text-3)] hover:text-[var(--text-1)] shrink-0 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                {selectedRow.host_employee_id
                  ? "Search and select a new host employee for this visit:"
                  : "This visitor self-registered without a host. Search and select a host to assign:"}
              </p>

              {/* Host Name Search Bar */}
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-3)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={hostSearchQuery}
                  onChange={(e) => setHostSearchQuery(e.target.value)}
                  placeholder="Search host by name or department..."
                  className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] pl-9 pr-8 py-2 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                />
                {hostSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHostSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-3)] hover:text-[var(--text-1)]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Scrollable Hosts Selection List */}
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-1.5 w-full">
                {filteredHosts.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--text-3)]">No matching host found.</p>
                ) : (
                  filteredHosts.map((h) => {
                    const isSelected = String(h.id) === assigningHostId;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setAssigningHostId(String(h.id))}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                            : "text-[var(--text-1)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="truncate block font-medium">{h.name}</span>
                          {h.department && (
                            <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-[var(--text-3)]"}`}>
                              {h.department}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Host Indicator */}
              {assigningHostId && (
                <div className="rounded-xl bg-[var(--surface-1)] px-3 py-2 border border-[var(--border-1)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-3)] text-[11px]">Selected:</span>
                  <span className="font-semibold text-[var(--accent)] truncate ml-2">
                    {allHostsList.find((h) => String(h.id) === assigningHostId)?.name}
                  </span>
                </div>
              )}

              {/* Assign Button - 100% width, strictly contained */}
              <button
                type="button"
                disabled={!assigningHostId || isAssigningHost}
                onClick={async () => {
                  await handleAssignHost(selectedRow.visit_id);
                  setIsEditingHost(false);
                  setHostSearchQuery("");
                }}
                className="w-full rounded-xl bg-[var(--accent)] py-2.5 px-4 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isAssigningHost ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Assigning Host...</span>
                  </>
                ) : (
                  <span>Assign Host</span>
                )}
              </button>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)]/60 p-4 flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">Host</p>
                <p className="text-base font-semibold text-[var(--text-1)] truncate">
                  {hostMap[selectedRow.host_employee_id] ?? "Unknown"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssigningHostId(String(selectedRow.host_employee_id));
                  setHostSearchQuery("");
                  setIsEditingHost(true);
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] text-xs font-semibold text-[var(--accent)] hover:bg-[var(--surface-3)] transition shadow-xs"
              >
                Change Host
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="Visitor List" subtitle="Front desk queue and full visitor history." />
      <section className="overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-1)] sm:p-5">
        <div className="relative">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--surface-1)]/70 text-[var(--text-1)] backdrop-blur-sm">
              <Loader2 />
            </div>
          ) : null}
          <AppDataGrid
            headerAction={
              <TableColumnToggle
                columns={allColumnOptions}
                visibleColumns={visibleColumns}
                defaultVisibleColumns={defaultVisitorVisibleColumns}
                onToggle={handleToggleColumn}
              />
            }
            rows={rows}
            columns={listColumns}
            getRowId={(row) => row.visit_id}
            loading={false}
            searchPlaceholder="Search visitor, host, status..."
            showSearch={true}
            showColumns={false}
            showFilters={true}
            showExport={false}
            showPagination={true}
            onFiltersOpenChange={(open) => {
              if (open) setDetailsOpen(false);
            }}
            onFilterToggle={(open) => {
              if (open) setDetailsOpen(false);
            }}
            sidePanelOpen={detailsOpen}
            sidePanelContent={detailPanel}
            sidePanelWidth={400}
            columnVisibilityModel={visibleColumnModel}
            rowSelection
            disableRowSelectionOnClick={false}
            rowSelectionModel={selectedVisitId ? [selectedVisitId] : []}
            onRowSelectionModelChange={(model) => {
              const nextId = model[0] ? Number(model[0]) : null;
              if (nextId && nextId === selectedVisitId && detailsOpen) {
                setDetailsOpen(false);
                return;
              }
              setSelectedVisitId(nextId);
              if (nextId) {
                setDetailsOpen(true);
              }
            }}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 5,
                },
              },
            }}
            localeText={{
              noRowsLabel: isLoading ? "Loading visitors..." : "No visitors found.",
            }}
          />
        </div>
      </section>

      {previewPhoto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--modal-overlay)] p-4 backdrop-blur-sm">
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

      {checkoutConfirmRow ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              <h2 className="text-lg font-bold text-[var(--text-1)]">Confirm Visitor OUT</h2>
            </div>
            <p className="mt-3 text-sm text-[var(--text-2)] leading-relaxed">
              Are you sure you want to check out{" "}
              <strong className="text-[var(--text-1)] font-semibold">{checkoutConfirmRow.visitor_name}</strong>?
            </p>
            <div className="mt-2 p-3 rounded-xl bg-[var(--surface-2)] text-xs text-[var(--text-3)] flex items-center justify-between">
              <span>ID Card:</span>
              <span className="font-semibold text-[var(--text-1)]">
                {checkoutConfirmRow.id_number || "None (Checked in via QR code)"}
              </span>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutConfirmRow(null)}
                disabled={isCheckingOut}
                className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] transition disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeCheckoutVisit(checkoutConfirmRow)}
                disabled={isCheckingOut}
                className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-orange-500 disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {isCheckingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm OUT</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default function ReceptionVisitorListPage() {
  return (
    <Suspense fallback={null}>
      <ReceptionVisitorsContent />
    </Suspense>
  );
}
