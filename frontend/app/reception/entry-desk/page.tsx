"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { Panel, SimpleTable } from "@/components/dashboard/panels";
import EntryDeskHeader from "@/components/entry-desk/entry-desk-header";
import HostSearch from "@/components/entry-desk/host-search";
import PhotoCapture from "@/components/entry-desk/photo-capture";
import QuickActions from "@/components/entry-desk/quick-actions";
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

interface VisitHistoryItem {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  company?: string;
  photo_url?: string;
  host_employee_id?: number | null;
  purpose?: string;
  checkin_time?: string | null;
  checkout_time?: string | null;
  status: string;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-300">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function EntryDeskPage() {
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
  const [qrCode, setQrCode] = useState("");
  const [checkinVisitorId, setCheckinVisitorId] = useState("");
  const [checkinIdNumber, setCheckinIdNumber] = useState("");
  const [checkoutVisitId, setCheckoutVisitId] = useState("");
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9][0-9]{9}$/;
  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "receptionist") {
      router.replace(getRoleRedirectPath(user.role));
    }
    void loadHistory();
  }, [router]);

  async function loadHistory() {
    try {
      const data = await apiFetch<VisitHistoryItem[]>("/visit/history");
      setHistory(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load history");
    }
  }

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
      await loadHistory();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin(visitorId?: number, idNumber?: string) {
    setMessage("");
    setLoading(true);
    try {
      const id = visitorId ?? Number(checkinVisitorId);
      await apiFetch("/visit/checkin", {
        method: "POST",
        body: JSON.stringify({
          visitor_id: id,
          id_number: (idNumber ?? checkinIdNumber) || null,
        }),
      });
      setMessage("Check-in completed.");
      setCheckinVisitorId("");
      setCheckinIdNumber("");
      await loadHistory();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(visitId?: number) {
    setMessage("");
    setLoading(true);
    try {
      const id = visitId ?? Number(checkoutVisitId);
      await apiFetch("/visit/checkout", {
        method: "POST",
        body: JSON.stringify({ visit_id: id }),
      });
      setMessage("Check-out completed.");
      setCheckoutVisitId("");
      await loadHistory();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Check-out failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleQrCheckin(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await apiFetch("/visit/qr-checkin", {
        method: "POST",
        body: JSON.stringify({ qr_code: qrCode, policy_accepted: policyAccepted }),
      });
      setMessage("QR check-in completed.");
      setQrCode("");
      await loadHistory();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "QR check-in failed");
    } finally {
      setLoading(false);
    }
  }

  const todayRows = useMemo(() => {
    const today = new Date();
    const isToday = (value?: string | null) => {
      if (!value) return false;
      const date = new Date(value);
      return date.toDateString() === today.toDateString();
    };

    return history
      .filter((item) => isToday(item.checkin_time))
      .map((item) => [
        item.visit_id.toString(),
        item.visitor_name,
        item.purpose ?? "-",
        item.status,
        item.checkin_time ? new Date(item.checkin_time).toLocaleTimeString() : "-",
      ]);
  }, [history]);

  const historyWithPhotos = useMemo(() => {
    return history.map((item) => ({
      ...item,
      photo: item.photo_url ? (item.photo_url.startsWith("http") ? item.photo_url : `${baseUrl}${item.photo_url}`) : null,
    }));
  }, [history, baseUrl]);

  return (
    <DashboardShell
      title="Entry Desk"
      subtitle="Register visitors, capture photos, and keep arrivals moving with one focused workspace."
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
          title="Reception Workflow"
          subtitle="Capture visitor details, assign a host, and keep check-ins moving."
        />

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div id="register">
              <Panel title="Visitor Info">
              <SectionHeader title="Registration" subtitle="Fill in details and capture a photo before check-in." />
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
                  <div id="host">
                    <HostSearch value={register.host_employee ?? null} onChange={(value) => setRegister((prev) => ({ ...prev, host_employee: value }))} />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div id="photo">
                    <PhotoCapture
                      value={register.photo_url}
                      onChange={(value) => setRegister((prev) => ({ ...prev, photo_url: value }))}
                    />
                  </div>
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
              </form>
              </Panel>
            </div>

            <Panel title="Today’s Visitors">
              <SectionHeader title="Arrivals" subtitle="Visitors checked in today." />
              <SimpleTable
                headers={["Visit ID", "Visitor", "Purpose", "Status", "Check-in"]}
                rows={todayRows}
              />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Reception Controls">
              <SectionHeader title="Quick Actions" subtitle="Fast check-in/out for known IDs." />
              <QuickActions
                onCheckIn={() => handleCheckin()}
                onCheckOut={() => handleCheckout()}
                disabled={loading}
              />
              <p className="mt-3 text-xs text-slate-400">
                Use quick actions for known IDs, or scan a QR code for instant check-in.
              </p>
            </Panel>

            <div id="qr-checkin">
              <Panel title="QR Fast Check-in">
              <SectionHeader title="QR Check-in" subtitle="Scan a QR code for instant check-in." />
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleQrCheckin}>
                <input
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Scan or paste QR code"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Check-in
                </button>
              </form>
              </Panel>
            </div>

            <Panel title="Manual Check-in">
              <SectionHeader title="Manual Check-in" subtitle="Enter a visitor ID." />
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleCheckin();
                }}
              >
                <input
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Visitor ID"
                  value={checkinVisitorId}
                  onChange={(e) => setCheckinVisitorId(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Check-in
                </button>
              </form>
            </Panel>

            <Panel title="Manual Check-out">
              <SectionHeader title="Manual Check-out" subtitle="Enter a visit ID." />
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleCheckout();
                }}
              >
                <input
                  className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Visit ID"
                  value={checkoutVisitId}
                  onChange={(e) => setCheckoutVisitId(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-60"
                >
                  Check-out
                </button>
              </form>
            </Panel>

            {message ? <p className="text-sm text-[#ffc5aa]">{message}</p> : null}
          </div>
        </div>

        <div id="history">
        <Panel title="Manual Check-in / Check-out">
          <div className="grid gap-4 md:grid-cols-2">
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCheckin();
              }}
            >
              <label className="text-sm text-slate-200">
                Visitor ID
                <input
                  className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Enter visitor ID"
                  value={checkinVisitorId}
                  onChange={(e) => setCheckinVisitorId(e.target.value)}
                  required
                />
              </label>
              <label className="text-sm text-slate-200">
                ID Card Number
                <input
                  className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Enter ID card number"
                  value={checkinIdNumber}
                  onChange={(e) => setCheckinIdNumber(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#ff7a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Check-in Visitor
              </button>
            </form>

            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCheckout();
              }}
            >
              <label className="text-sm text-slate-200">
                Visit ID
                <input
                  className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Enter visit ID"
                  value={checkoutVisitId}
                  onChange={(e) => setCheckoutVisitId(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-60"
              >
                Check-out Visitor
              </button>
            </form>
          </div>
          {message ? <p className="mt-3 text-sm text-[#ffc5aa]">{message}</p> : null}
        </Panel>

        <Panel title="Visit History (Photo)">
          <SectionHeader title="History" subtitle="Latest visits with photos and timestamps." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-300">
                  <th className="pb-3 pr-3">Photo</th>
                  <th className="pb-3 pr-3">Visitor</th>
                  <th className="pb-3 pr-3">Purpose</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Check-in</th>
                  <th className="pb-3">Check-out</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                {historyWithPhotos.map((item) => (
                  <tr key={item.visit_id} className="border-t border-white/10">
                    <td className="py-3 pr-3">
                      {item.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photo} alt={item.visitor_name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-white/15 bg-white/5" />
                      )}
                    </td>
                    <td className="py-3 pr-3">{item.visitor_name}</td>
                    <td className="py-3 pr-3">{item.purpose ?? "-"}</td>
                    <td className="py-3 pr-3">{item.status}</td>
                    <td className="py-3 pr-3">{item.checkin_time ? new Date(item.checkin_time).toLocaleString() : "-"}</td>
                    <td className="py-3">{item.checkout_time ? new Date(item.checkout_time).toLocaleString() : "-"}</td>
                    <td className="py-3">
                      {item.status === "checked_in" ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleCheckout(item.visit_id)}
                          className="rounded-md border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-60"
                        >
                          Check-out
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
