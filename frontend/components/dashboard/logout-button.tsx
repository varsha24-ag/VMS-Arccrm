"use client";

import { useRouter } from "next/navigation";

import { clearAuthSession } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const confirmed = window.confirm("Are you sure you want to log out?");
        if (!confirmed) return;
        clearAuthSession();
        router.replace("/auth/login");
      }}
      className="w-full rounded-lg border border-[#1e3a5f] bg-[#112240] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-200 transition hover:border-[#f97316] hover:text-white"
    >
      Logout
    </button>
  );
}
