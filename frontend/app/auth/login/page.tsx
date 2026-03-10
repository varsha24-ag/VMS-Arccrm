"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { loginApi } from "@/lib/api";
import { getRoleRedirectPath, normalizeRole, setAuthSession } from "@/lib/auth";

const USE_MOCK_LOGIN = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{10,15}$/;

interface FormState {
  identifier: string;
  password: string;
  staySignedIn: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    identifier: "",
    password: "",
    staySignedIn: false
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function validateForm(values: FormState): string | null {
    if (!values.identifier.trim()) return "Email or phone number is required";
    if (!emailRegex.test(values.identifier.trim()) && !phoneRegex.test(values.identifier.trim())) {
      return "Enter a valid email or phone number";
    }
    if (!values.password) return "Password is required";
    if (values.password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (USE_MOCK_LOGIN) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockUser = { id: 1, name: "Mock User", role: "employee" as const };
        setAuthSession("mock-jwt-token", mockUser);
        router.push(getRoleRedirectPath(mockUser.role));
        return;
      }

      const response = await loginApi({
        identifier: form.identifier.trim(),
        password: form.password
      });

      const role = normalizeRole(response.user.role);
      if (!role) {
        throw new Error("Unauthorized access");
      }

      const user = { ...response.user, role };
      setAuthSession(response.access_token, user);
      router.push(getRoleRedirectPath(user.role));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Login timed out. Check API connectivity.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "linear-gradient(rgba(15,27,43,0.5), rgba(15,27,43,0.7)), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), linear-gradient(120deg, #30495f 0%, #4d6472 45%, #2e3f4a 100%)"
      }}
    >
      <section className="relative z-10 w-full max-w-6xl overflow-hidden rounded-xl bg-white/95 shadow-[0_25px_70px_rgba(0,0,0,0.45)]">
        <div className="grid min-h-[620px] md:grid-cols-[1fr_1fr]">
          <aside className="relative hidden overflow-hidden bg-[#102540] text-white md:block">
            <div className="absolute inset-0 bg-gradient-to-b from-[#142f50]/95 via-[#122843]/95 to-[#0d1e32]/95" />
            <div className="absolute left-0 right-0 top-[34%] h-16 bg-white/10" />
            <div className="absolute left-0 right-0 top-[56%] h-14 bg-white/10" />

            <div className="relative flex h-full flex-col justify-between p-12">
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Argate Complete Resource Management</p>
                <div className="flex items-center gap-4">
                  <Image
                    src="/arc-logo.svg"
                    alt="ARC logo"
                    width={90}
                    height={95}
                    className="h-auto w-16 drop-shadow-[0_12px_28px_rgba(233,119,75,0.45)]"
                    priority
                  />
                  <h1 className="text-6xl font-semibold leading-none tracking-tight text-white">ARCCRM</h1>
                </div>
              </div>

              <p className="max-w-md text-sm leading-7 text-slate-300">
                Secure visitor access with role-driven controls for Admin, Receptionist, and Employee workflows.
              </p>
            </div>
          </aside>

          <div className="bg-[#f3f3f3] p-7 text-[#1d2939] sm:p-12">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <Image src="/arc-logo.svg" alt="ARC logo" width={40} height={42} className="h-auto w-9" priority />
              <span className="text-xl font-semibold tracking-wide text-[#0f2a45]">ARCCRM</span>
            </div>

            <h2 className="text-3xl font-semibold text-[#0f2a45]">Sign In</h2>
            <p className="mt-2 text-sm text-[#475467]">Enter your credentials to continue.</p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-[#122b45]">
                  User Name
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={form.identifier}
                  onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
                  className="w-full rounded-md border border-[#cfd4dc] bg-[#e9edf5] px-4 py-3 text-base text-[#101828] outline-none transition focus:border-[#ff7a45] focus:ring-2 focus:ring-[#ff7a45]/20"
                  placeholder="name@company.com or +919876543210"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#122b45]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-md border border-[#cfd4dc] bg-[#e9edf5] px-4 py-3 text-base text-[#101828] outline-none transition focus:border-[#ff7a45] focus:ring-2 focus:ring-[#ff7a45]/20"
                  placeholder="********"
                  required
                  minLength={8}
                />
              </div>

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#ff7a45] px-6 py-3 text-lg font-semibold text-white transition hover:bg-[#f46a34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#263546]">
                <input
                  type="checkbox"
                  checked={form.staySignedIn}
                  onChange={(e) => setForm((prev) => ({ ...prev, staySignedIn: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#b9c1cc] text-[#ff7a45] focus:ring-[#ff7a45]/30"
                />
                Stay signed in
              </label>

              <button type="button" className="text-left text-sm text-[#1f3f66] underline-offset-4 hover:underline">
                Forgot your password?
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
