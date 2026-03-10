"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import HostSearch from "@/components/entry-desk/host-search";
import PhotoCapture from "@/components/entry-desk/photo-capture";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

interface VisitorCreatePayload {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  visitor_type?: string;
  host_employee?: number | null;
  purpose?: string;
  photo_url?: string;
}

interface VisitorOut {
  id: number;
}

export default function ReceptionRegisterPage() {
  const router = useRouter();
  const [register, setRegister] = useState<VisitorCreatePayload>({
    name: "",
    phone: "",
    email: "",
    company: "",
    visitor_type: "",
    host_employee: null,
    purpose: "",
    photo_url: "",
  });
  const [purposeOption, setPurposeOption] = useState("Meeting");
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  const { pushToast } = useToast();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist") {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [router]);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setFormError("");

    if (!register.name.trim()) {
      setFormError("Visitor name is required.");
      return;
    }
    if (register.email && !emailRegex.test(register.email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (register.phone && !phoneRegex.test(register.phone.trim())) {
      setFormError("Enter a valid phone number.");
      return;
    }
    if (!register.purpose?.trim()) {
      setFormError("Purpose is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...register,
        host_employee: register.host_employee ? Number(register.host_employee) : null,
      };
      const created = await apiFetch<VisitorOut>("/visitor/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (autoCheckin) {
        await apiFetch("/visit/checkin", {
          method: "POST",
          body: JSON.stringify({
            visitor_id: created.id,
            host_employee_id: payload.host_employee ?? null,
            purpose: payload.purpose ?? null,
            policy_accepted: policyAccepted,
          }),
        });
      }

      setMessage(autoCheckin ? "Visitor registered and checked in." : "Visitor registered successfully.");
      pushToast({
        title: "Visitor registered",
        description: autoCheckin ? "Check-in completed successfully." : "Registration saved.",
        variant: "success",
      });
      setRegister({
        name: "",
        phone: "",
        email: "",
        company: "",
        visitor_type: "",
        host_employee: null,
        purpose: "",
        photo_url: "",
      });
      setPurposeOption("Meeting");
      setPolicyAccepted(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setMessage(errorMessage);
      pushToast({
        title: "Registration failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Register Visitor"
      subtitle="Capture visitor details, select a host, and save the visit in one flow."
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "QR Check-in", href: "/reception/qr-checkin" },
        { label: "History", href: "/reception/history" },
      ]}
    >
      <div className="space-y-6">
        <EntryDeskHeader
          title="Visitor Registration"
          subtitle="Fill in the form, capture a photo, and submit."
        />

        <Panel title="Visitor Info">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleRegister}>
            <label className="text-sm text-slate-200">
              Visitor Name
              <input
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={register.name}
                onChange={(e) => setRegister((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
            <label className="text-sm text-slate-200">
              Phone
              <input
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={register.phone}
                onChange={(e) => setRegister((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Email
              <input
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={register.email}
                onChange={(e) => setRegister((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Company
              <input
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={register.company}
                onChange={(e) => setRegister((prev) => ({ ...prev, company: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Visitor Type
              <input
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={register.visitor_type}
                onChange={(e) => setRegister((prev) => ({ ...prev, visitor_type: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Purpose
              <select
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                value={purposeOption}
                onChange={(e) => {
                  const value = e.target.value;
                  setPurposeOption(value);
                  if (value !== "Custom") {
                    setRegister((prev) => ({ ...prev, purpose: value }));
                  } else {
                    setRegister((prev) => ({ ...prev, purpose: "" }));
                  }
                }}
              >
                {["Meeting", "Interview", "Delivery", "Maintenance", "Vendor", "Custom"].map((option) => (
                  <option key={option} value={option} className="bg-[#0f1e2f] text-white">
                    {option}
                  </option>
                ))}
              </select>
            </label>
            {purposeOption === "Custom" ? (
              <label className="text-sm text-slate-200">
                Custom Purpose
                <input
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  value={register.purpose}
                  onChange={(e) => setRegister((prev) => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Enter purpose"
                  required
                />
              </label>
            ) : null}

            <div className="md:col-span-2">
              <HostSearch
                value={register.host_employee ?? null}
                onChange={(value) => setRegister((prev) => ({ ...prev, host_employee: value }))}
              />
            </div>

            <div className="md:col-span-2">
              <PhotoCapture
                value={register.photo_url}
                onChange={(value) => setRegister((prev) => ({ ...prev, photo_url: value }))}
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={autoCheckin}
                  onChange={(e) => setAutoCheckin(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#ff7a45]"
                />
                Auto check-in after registration
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#ff7a45]"
                />
                Policy agreement accepted
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Saving..." : "Register Visitor"}
              </button>
            </div>

            {formError ? (
              <div className="md:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {formError}
              </div>
            ) : null}
            {message ? (
              <div className="md:col-span-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                {message}
              </div>
            ) : null}
          </form>
        </Panel>
      </div>
    </DashboardShell>
  );
}
