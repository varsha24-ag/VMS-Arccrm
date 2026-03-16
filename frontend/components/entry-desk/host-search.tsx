"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

export interface HostEmployee {
  id: number;
  name: string;
  department: string;
  email?: string | null;
}

interface HostSearchProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onSelectHost?: (host: HostEmployee | null) => void;
}

export default function HostSearch({ value, onChange, onSelectHost }: HostSearchProps) {
  const [query, setQuery] = useState("");
  const [hosts, setHosts] = useState<HostEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadHosts() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<HostEmployee[]>("/employees/hosts");
        if (mounted) setHosts(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load hosts");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadHosts();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return hosts;
    return hosts.filter(
      (host) => host.name.toLowerCase().includes(lower) || host.department.toLowerCase().includes(lower)
    );
  }, [query, hosts]);

  const selected = hosts.find((host) => host.id === value);

  useEffect(() => {
    if (onSelectHost) {
      onSelectHost(selected ?? null);
    }
  }, [onSelectHost, selected]);

  return (
    <div className="space-y-2">
      <label className="text-sm text-[var(--text-2)]">Host Employee</label>
      <input
        className="w-full rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
        placeholder="Search host by name or department"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border border-[var(--border-1)] bg-[var(--surface-1)] p-2">
        {loading ? <div className="px-2 py-1 text-xs text-[var(--text-3)]">Loading hosts...</div> : null}
        {error ? <div className="px-2 py-1 text-xs text-rose-300">{error}</div> : null}
        {filtered.map((host) => (
          <button
            key={host.id}
            type="button"
            onClick={() => {
              onChange(host.id);
              onSelectHost?.(host);
            }}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
              host.id === value
                ? "bg-[var(--nav-active-bg)] text-[var(--accent)]"
                : "bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
            }`}
          >
            <span>{host.name}</span>
            <span className="text-xs text-[var(--text-3)]">{host.department}</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-[var(--text-3)]">
        Selected: {selected ? `${selected.name}` : "None"}
      </div>
    </div>
  );
}
