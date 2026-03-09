"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";
import { getModulesForRole } from "@/lib/modules";

export default function AdminDashboard() {
  const router = useRouter();
  const modules = getModulesForRole("admin");

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Loaded modules for role: admin</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {modules.map((module) => (
          <section key={module} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-slate-800">{module}</h2>
          </section>
        ))}
      </div>
    </main>
  );
}
