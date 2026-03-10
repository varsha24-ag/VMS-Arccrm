"use client";

import { useMemo, useState } from "react";

interface HostEmployee {
  id: number;
  name: string;
  department: string;
}

interface HostSearchProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const DEFAULT_HOSTS: HostEmployee[] = [
  { id: 1, name: "Aman Verma", department: "Admin" },
  { id: 2, name: "Riya Sharma", department: "HR" },
  { id: 3, name: "Arjun Patel", department: "IT" },
  { id: 4, name: "Neha Rao", department: "Finance" },
];

export default function HostSearch({ value, onChange }: HostSearchProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return DEFAULT_HOSTS;
    return DEFAULT_HOSTS.filter(
      (host) => host.name.toLowerCase().includes(lower) || host.department.toLowerCase().includes(lower)
    );
  }, [query]);

  const selected = DEFAULT_HOSTS.find((host) => host.id === value);

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
