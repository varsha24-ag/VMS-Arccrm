"use client";

import { useEffect, useMemo, useState } from "react";
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

const steps = ["Visitor Info", "Photo", "Host", "QR Check-in"];

function StepIndicator({ stepIndex, current }: { stepIndex: number; current: number }) {
  if (stepIndex < current) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a45] text-sm font-semibold text-white">
        ✓
      </div>
    );
  }
  if (stepIndex === current) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a45] text-sm font-semibold text-white">
        {stepIndex + 1}
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-sm text-slate-400">
      {stepIndex + 1}
    </div>
  );
}

export default function ReceptionRegisterPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [step, setStep] = useState(0);
  const [purposeOption, setPurposeOption] = useState("Meeting");
  const [customPurpose, setCustomPurpose] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [register, setRegister] = useState<VisitorCreatePayload>({
    name: "",
    phone: "",
    email: "",
    company: "",
    visitor_type: "",
    host_employee: null,
    purpose: "Meeting",
    photo_url: "",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

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

  function validateStep(targetStep: number) {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 0) {
      if (!register.name?.trim()) nextErrors.name = "Visitor name is required.";
      if (register.email && !emailRegex.test(register.email.trim())) nextErrors.email = "Enter a valid email.";
      if (register.phone && !phoneRegex.test(register.phone.trim())) nextErrors.phone = "Enter a valid 10-digit phone number.";
      if (!register.purpose?.trim()) nextErrors.purpose = "Purpose is required.";
    }
    if (targetStep === 1) {
      if (!register.photo_url) nextErrors.photo_url = "Photo is required.";
    }
    if (targetStep === 2) {
      if (!register.host_employee) nextErrors.host_employee = "Please select a host.";
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function goBack() {
    setFormErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleRegister() {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const payload = {
        ...register,
        host_employee: register.host_employee ? Number(register.host_employee) : null,
      };
      await apiFetch<VisitorOut>("/visitor/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      pushToast({
        title: "Visitor registered",
        description: "Awaiting host approval.",
        variant: "success",
      });
      setRegister({
        name: "",
        phone: "",
        email: "",
        company: "",
        visitor_type: "",
        host_employee: null,
        purpose: "Meeting",
        photo_url: "",
      });
      setPurposeOption("Meeting");
      setCustomPurpose("");
      setQrCode("");
      setStep(0);
      router.push("/reception/qr-checkin");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      pushToast({
        title: "Registration failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const progressWidth = useMemo(() => `${((step + 1) / steps.length) * 100}%`, [step]);

  return (
    <DashboardShell
      title="Register Visitor"
      subtitle="Multi-step registration for reception."
      activeLabel={
        step === 0 ? "Register" : step === 1 ? "Photo" : step === 2 ? "Host" : "QR Check-in"
      }
      navItems={[
        { label: "Dashboard", href: "/reception/dashboard" },
        { label: "Register", href: "/reception/register" },
        { label: "Photo", href: "/reception/photo" },
        { label: "Host", href: "/reception/host" },
        { label: "QR Check-in", href: "/reception/qr-checkin" },
        { label: "History", href: "/reception/history" },
        { label: "Manual Check-out", href: "/reception/manual-checkout" },
      ]}
    >
      <div className="space-y-6">
        <EntryDeskHeader
          title="Visitor Registration"
          subtitle="Complete each step and submit the visitor."
        />

        <Panel title="Registration Wizard">
          <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#ff7a45] transition-all" style={{ width: progressWidth }} />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-3">
                <StepIndicator stepIndex={idx} current={step} />
                <span className={idx === step ? "text-white" : "text-slate-400"}>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-200">
                  Visitor Name
                  <input
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    value={register.name}
                    onChange={(e) => setRegister((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {formErrors.name ? <p className="mt-1 text-xs text-red-400">{formErrors.name}</p> : null}
                </label>
                <label className="text-sm text-slate-200">
                  Phone
                  <input
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    value={register.phone}
                    onChange={(e) => setRegister((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                  {formErrors.phone ? <p className="mt-1 text-xs text-red-400">{formErrors.phone}</p> : null}
                </label>
                <label className="text-sm text-slate-200">
                  Email
                  <input
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    value={register.email}
                    onChange={(e) => setRegister((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  {formErrors.email ? <p className="mt-1 text-xs text-red-400">{formErrors.email}</p> : null}
                </label>
                <label className="text-sm text-slate-200">
                  Company
                  <input
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    value={register.company}
                    onChange={(e) => setRegister((prev) => ({ ...prev, company: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  Visitor Type
                  <input
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Guest / Vendor / Contractor / Interview"
                    value={register.visitor_type}
                    onChange={(e) => setRegister((prev) => ({ ...prev, visitor_type: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  Purpose
                  <select
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    value={purposeOption}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPurposeOption(value);
                      if (value !== "Other") {
                        setCustomPurpose("");
                        setRegister((prev) => ({ ...prev, purpose: value }));
                      } else {
                        setRegister((prev) => ({ ...prev, purpose: "" }));
                      }
                    }}
                  >
                    {["Meeting", "Interview", "Delivery", "Maintenance", "Vendor", "Other"].map((option) => (
                      <option key={option} value={option} className="bg-[#0f1e2f] text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                  {formErrors.purpose ? <p className="mt-1 text-xs text-red-400">{formErrors.purpose}</p> : null}
                </label>
                {purposeOption === "Other" ? (
                  <label className="text-sm text-slate-200 md:col-span-2">
                    Custom Purpose
                    <input
                      className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                      value={customPurpose}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomPurpose(value);
                        setRegister((prev) => ({ ...prev, purpose: value }));
                      }}
                      placeholder="Enter purpose"
                    />
                  </label>
                ) : null}

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-lg bg-[#ff7a45] px-6 py-2 text-sm font-semibold text-white"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <PhotoCapture
                  value={register.photo_url}
                  onChange={(value) => setRegister((prev) => ({ ...prev, photo_url: value }))}
                />
                {formErrors.photo_url ? <p className="text-sm text-red-400">{formErrors.photo_url}</p> : null}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={goBack} className="text-sm text-slate-300 hover:text-white">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-lg bg-[#ff7a45] px-6 py-2 text-sm font-semibold text-white"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <HostSearch
                  value={register.host_employee ?? null}
                  onChange={(value) => setRegister((prev) => ({ ...prev, host_employee: value }))}
                />
                {formErrors.host_employee ? <p className="text-sm text-red-400">{formErrors.host_employee}</p> : null}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={goBack} className="text-sm text-slate-300 hover:text-white">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-lg bg-[#ff7a45] px-6 py-2 text-sm font-semibold text-white"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">QR Check-in (optional)</p>
                  <input
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Enter QR code if available"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Check-in will be available after host approval and ID card assignment.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={goBack} className="text-sm text-slate-300 hover:text-white">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="rounded-lg bg-[#ff7a45] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? "Registering..." : "Register Visitor"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
