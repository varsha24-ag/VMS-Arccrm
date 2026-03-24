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
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 focus-within:border-[var(--focus-accent)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full !border-none bg-transparent text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] !outline-none !ring-0"
        />
      </div>
      {selectOptions && onSelectChange ? (
        <select
          value={selectValue ?? ""}
          onChange={(event) => onSelectChange(event.target.value)}
          className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] focus:outline-none focus:border-[var(--focus-accent)] focus:ring-2 focus:ring-[var(--focus-ring)]"
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[var(--surface-1)] text-[var(--text-1)]">
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {children}
    </div>
  );
}
