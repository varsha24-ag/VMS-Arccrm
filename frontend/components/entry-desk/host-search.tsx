"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

interface HostEmployee {
  id: number;
  name: string;
  department: string;
  email?: string | null;
}

interface HostSearchProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function HostSearch({ value, onChange }: HostSearchProps) {
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

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-200">Host Employee</label>
      <input
        className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
        placeholder="Search host by name or department"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border border-white/10 bg-black/20 p-2">
        {loading ? <div className="px-2 py-1 text-xs text-slate-400">Loading hosts...</div> : null}
        {error ? <div className="px-2 py-1 text-xs text-red-300">{error}</div> : null}
        {filtered.map((host) => (
          <button
            key={host.id}
            type="button"
            onClick={() => onChange(host.id)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
              host.id === value ? "bg-[#ff7a45]/20 text-[#ffc5aa]" : "bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <span>{host.name}</span>
            <span className="text-xs text-slate-400">{host.department}</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-slate-400">
        Selected: {selected ? `${selected.name} (ID ${selected.id})` : "None"}
      </div>
    </div>
  );
}
