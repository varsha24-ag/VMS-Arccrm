"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";
import { getModulesForRole } from "@/lib/modules";

export default function EmployeeDashboard() {
  const router = useRouter();
  const modules = getModulesForRole("employee");

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "employee") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Employee Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Loaded modules for role: employee</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <section key={module.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#e9774b]/30">
            <h2 className="text-sm font-semibold text-slate-900">{module.label}</h2>
            <p className="mt-1 text-xs text-slate-500">View {module.label.toLowerCase()}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
