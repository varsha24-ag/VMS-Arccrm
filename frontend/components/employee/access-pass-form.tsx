"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

const passPurposeOptions = [
  "Meeting",
  "Interview",
  "Delivery",
  "Maintenance",
  "Vendor Visit",
  "Site Visit",
];

export interface AccessPassPayload {
  visitor_name: string;
  phone?: string;
  email?: string;
  company?: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
}

export interface AccessPassResult {
  email_sent?: boolean | null;
  email_error?: string | null;
}

export const initialAccessPassPayload: AccessPassPayload = {
  visitor_name: "",
  phone: "",
  email: "",
  company: "",
  purpose: "",
  valid_from: "",
  valid_to: "",
};

interface AccessPassFormProps {
  initialValues?: AccessPassPayload;
  submitLabel?: string;
  loadingLabel?: string;
  className?: string;
  onSuccess?: (result: AccessPassResult, payload: AccessPassPayload) => void;
  onError?: (error: Error) => void;
}

export function AccessPassForm({
  initialValues,
  submitLabel = "Create Pass",
  loadingLabel = "Creating...",
  className,
  onSuccess,
  onError,
}: AccessPassFormProps) {
  const [loading, setLoading] = useState(false);
  const [passPayload, setPassPayload] = useState<AccessPassPayload>(initialValues ?? initialAccessPassPayload);

  const mergedInitialValues = useMemo(
    () => ({ ...initialAccessPassPayload, ...(initialValues ?? {}) }),
    [initialValues]
  );

  useEffect(() => {
    setPassPayload(mergedInitialValues);
  }, [mergedInitialValues]);

  function normalizeOptionalField(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  function toIsoDateTime(value: string) {
    return new Date(value).toISOString();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await apiFetch<AccessPassResult>("/access-pass/create", {
        method: "POST",
        timeoutMs: 0,
        body: JSON.stringify({
          visitor_name: passPayload.visitor_name.trim(),
          phone: normalizeOptionalField(passPayload.phone),
          email: normalizeOptionalField(passPayload.email),
          company: normalizeOptionalField(passPayload.company),
          purpose: normalizeOptionalField(passPayload.purpose),
          valid_from: toIsoDateTime(passPayload.valid_from),
          valid_to: toIsoDateTime(passPayload.valid_to),
          max_visits: 10,
        }),
      });
      onSuccess?.(created, passPayload);
      setPassPayload(initialAccessPassPayload);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Failed to create pass"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={`grid gap-3 ${className ?? ""}`} onSubmit={handleSubmit}>
      <input
        className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
        placeholder="Visitor name"
        value={passPayload.visitor_name}
        onChange={(e) => setPassPayload((prev) => ({ ...prev, visitor_name: e.target.value }))}
        required
      />
      <input
        className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
        placeholder="Phone"
        value={passPayload.phone}
        onChange={(e) => setPassPayload((prev) => ({ ...prev, phone: e.target.value }))}
      />
      <input
        className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
        placeholder="Email"
        value={passPayload.email}
        onChange={(e) => setPassPayload((prev) => ({ ...prev, email: e.target.value }))}
      />
      <input
        className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
        placeholder="Company"
        value={passPayload.company}
        onChange={(e) => setPassPayload((prev) => ({ ...prev, company: e.target.value }))}
      />
      <select
        className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
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
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-xs text-[var(--text-2)]">
          Valid From
          <input
            type="datetime-local"
            className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
            value={passPayload.valid_from}
            onChange={(e) => setPassPayload((prev) => ({ ...prev, valid_from: e.target.value }))}
            required
          />
        </label>
        <label className="grid gap-2 text-xs text-[var(--text-2)]">
          Valid To
          <input
            type="datetime-local"
            className="min-h-[44px] w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
            value={passPayload.valid_to}
            onChange={(e) => setPassPayload((prev) => ({ ...prev, valid_to: e.target.value }))}
            required
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="min-h-[44px] rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {loading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}
