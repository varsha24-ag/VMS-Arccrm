"use client";

interface QuickActionsProps {
  onCheckIn: () => void;
  onCheckOut: () => void;
  disabled?: boolean;
}

export default function QuickActions({ onCheckIn, onCheckOut, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onCheckIn}
        disabled={disabled}
        className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        Quick Check-in
      </button>
      <button
        type="button"
        onClick={onCheckOut}
        disabled={disabled}
        className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-60"
      >
        Quick Check-out
      </button>
    </div>
  );
}
