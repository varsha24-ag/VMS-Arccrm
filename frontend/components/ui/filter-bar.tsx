"use client";

import { ReactNode } from "react";

type SelectOption = {
  value: string;
  label: string;
};

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selectValue?: string;
  onSelectChange?: (value: string) => void;
  selectOptions?: SelectOption[];
  className?: string;
  children?: ReactNode;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  selectValue,
  onSelectChange,
  selectOptions,
  className,
  children,
}: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-sm ${className ?? ""}`}>
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>
      {selectOptions && onSelectChange ? (
        <select
          value={selectValue ?? ""}
          onChange={(event) => onSelectChange(event.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:outline-none"
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {children}
    </div>
  );
}
