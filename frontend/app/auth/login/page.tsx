"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { loginApi } from "@/lib/api";
import { getRoleRedirectPath, normalizeRole, setAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

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
    <main className="relative flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 py-12">
      <section className="relative z-10 w-full max-w-[820px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="grid min-h-[550px] md:grid-cols-[1.1fr_1fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,rgb(30,44,72)_0%,rgb(15,23,42)_100%)] p-10 text-white md:flex">
            {/* Decorative background flare */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#e9774b] opacity-[0.07] blur-[80px]" />

            <div className="relative z-10 space-y-9">
              <div>
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <Image
                      src="/arc-logo.svg"
                      alt="ARC logo"
                      width={24}
                      height={24}
                    />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">ArcCRM</span>
                </div>

                <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
                  Visitor Management <br />
                  <span className="text-white/60">System.</span>
                </h2>
                <p className="mt-4 max-w-sm text-sm text-slate-300/80 leading-relaxed">
                  A professional, secure platform for managing visitor access and workspace interactions.
                </p>
              </div>

              <div className="space-y-5">
                <div className="group flex items-center gap-4 transition-transform hover:translate-x-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-[#e9774b]/30">
                    <svg className="h-5 w-5 text-[#e9774b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V22m0-19.056c1.323 0 2.58.26 3.73.73M12 2.944a11.955 11.955 0 00-3.73.73" />
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-white/90">Role-based access control</h4>
                    <p className="text-xs text-slate-400">Granular permissions for every user.</p>
                  </div>
                </div>

                <div className="group flex items-center gap-4 transition-transform hover:translate-x-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-[#e9774b]/30">
                    <svg className="h-5 w-5 text-[#e9774b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-white/90">Real-time visitor tracking</h4>
                    <p className="text-xs text-slate-400">Live monitoring of all workspace entries.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-auto pt-8 select-none opacity-60 transition-all duration-500 hover:opacity-100 hover:scale-[1.02]">
              <div className="absolute -inset-4 rounded-full bg-[#e9774b]/10 blur-2xl" />
              <Image
                src="/vms-illustration.svg"
                alt="VMS Illustration"
                width={360}
                height={270}
                className="relative z-10 h-auto w-full max-w-[250px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              />
            </div>
          </aside>

          <div className="flex flex-col justify-center bg-white p-10 sm:p-12">
            <div className="mb-8 block md:hidden">
              <Image src="/arc-logo.svg" alt="ARC logo" width={32} height={32} className="mb-4 h-8 w-8" priority />
              <h1 className="text-xl font-bold text-[rgb(30,44,72)]">ArcCRM</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-[#101828]">Sign In</h2>
              <p className="mt-2 text-sm text-[#475467]">Welcome back! Please enter your details.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="User Name"
                id="identifier"
                type="text"
                value={form.identifier}
                onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
                placeholder="name@company.com"
                required
              />

              <Input
                label="Password"
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={8}
              />

              {error ? (
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <Checkbox
                  label="Stay signed in"
                  id="stay-signed-in"
                  checked={form.staySignedIn}
                  onChange={(e) => setForm((prev) => ({ ...prev, staySignedIn: e.target.checked }))}
                />
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>

            <p className="mt-10 text-center text-sm text-[#475467]">
              © {new Date().getFullYear()} Argate. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
