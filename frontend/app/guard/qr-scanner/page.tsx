"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/dashboard/panels";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

const QrScanner = dynamic(() => import("@/components/entry-desk/qr-scanner"), { ssr: false });

type VisitStatusResult = {
  visit_id: number;
  visitor_name: string;
};

type QrVisitorDetail = {
  visit_id?: number | null;
  valid_from?: string | null;
  qr_expiry?: string | null;
  is_currently_valid?: boolean;
  validity_error?: string | null;
};

type ScanResolution =
  | { kind: "visit"; visitId: number; visitorName: string }
  | { kind: "code"; code: string };

function normalizeQrInput(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return value;
  if (!value.includes("?code=")) return value;
  try {
    const url = new URL(value, window.location.origin);
    return url.searchParams.get("code") ?? value;
  } catch {
    return value;
  }
}

export default function ReceptionQrScannerPage() {
  const user = useAuthGuard({ allowedRoles: ["guard", "admin", "superadmin"] });
  const router = useRouter();
  const { pushToast } = useToast();

  const [scannerReady, setScannerReady] = useState(false);
  const [processingScan, setProcessingScan] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const lastSuccessCodeRef = useRef("");
  const lastSuccessAtRef = useRef(0);

  const beep = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const audio = new AudioContextCtor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 920;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.12);
    oscillator.onended = () => {
      void audio.close();
    };
  }, []);

  const resolveScan = useCallback(async (code: string): Promise<ScanResolution> => {
    try {
      const status = await apiFetch<VisitStatusResult>(`/visits/status?code=${encodeURIComponent(code)}`, { timeoutMs: 0 });
      const detail = await apiFetch<QrVisitorDetail>(`/qr-visitor/details?code=${encodeURIComponent(code)}`, { timeoutMs: 0 });
      if (detail.is_currently_valid === false) {
        throw new Error(detail.validity_error || "QR timing is not valid for today.");
      }
      pushToast({
        title: "QR detected",
        description: `${status.visitor_name} scanned successfully.`,
        variant: "success",
      });
      return { kind: "visit", visitId: status.visit_id, visitorName: status.visitor_name };
    } catch (firstError) {
      try {
        const detail = await apiFetch<QrVisitorDetail>(`/qr-visitor/details?code=${encodeURIComponent(code)}`, { timeoutMs: 0 });
        if (detail.is_currently_valid === false) {
          throw new Error(detail.validity_error || "QR timing is not valid for today.");
        }
        pushToast({
          title: "QR detected",
          description: "Visitor QR validated successfully.",
          variant: "success",
        });
        if (detail.visit_id) {
          return { kind: "visit", visitId: detail.visit_id, visitorName: "Visitor" };
        }
        return { kind: "code", code };
      } catch (fallbackError) {
        if (fallbackError instanceof Error) {
          throw fallbackError;
        }
        if (firstError instanceof Error) {
          throw firstError;
        }
        throw new Error("Invalid QR");
      }
    }
  }, [pushToast]);

  const handleScan = useCallback(
    async (rawCode: string) => {
      const code = normalizeQrInput(rawCode);
      if (!code || processingScan) return;

      const now = Date.now();
      if (lastSuccessCodeRef.current === code && now - lastSuccessAtRef.current < 3000) return;

      setProcessingScan(true);
      setScannerError("");

      try {
        const resolution = await resolveScan(code);
        beep();
        lastSuccessCodeRef.current = code;
        lastSuccessAtRef.current = Date.now();
        window.setTimeout(() => {
          if (resolution.kind === "visit") {
            router.push(`/guard/qr-visitor?visit_id=${resolution.visitId}`);
            return;
          }
          router.push(`/guard/qr-visitor?code=${encodeURIComponent(resolution.code)}`);
        }, 1200);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid QR";
        setScannerError(message);
        pushToast({ title: message.includes("tim") ? "Invalid timing" : "Invalid QR", description: message, variant: "error" });
      } finally {
        window.setTimeout(() => {
          setProcessingScan(false);
        }, 1600);
      }
    },
    [beep, processingScan, resolveScan, pushToast, router]
  );

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <DashboardPageHeader title="QR Scanner" subtitle="Use the laptop webcam to scan visitor QR codes and open the QR visitor flow." />
      <div className="space-y-6">
        <Panel title="Live Scanner">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--border-1)] bg-black">
            <div className="aspect-[16/9] min-h-[420px] w-full">
              <QrScanner
                onReady={() => {
                  setScannerReady(true);
                  setScannerError("");
                }}
                onError={(message) => {
                  setScannerReady(false);
                  setScannerError(message);
                }}
                onScan={handleScan}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-64 w-64 rounded-[32px] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.48)]">
                <div className="absolute -left-1 -top-1 h-10 w-10 rounded-tl-[28px] border-l-4 border-t-4 border-[var(--accent)]" />
                <div className="absolute -right-1 -top-1 h-10 w-10 rounded-tr-[28px] border-r-4 border-t-4 border-[var(--accent)]" />
                <div className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-[28px] border-b-4 border-l-4 border-[var(--accent)]" />
                <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-[28px] border-b-4 border-r-4 border-[var(--accent)]" />
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-transparent px-6 pb-6 pt-20 text-sm text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Scanner Status</p>
                <p className="mt-2 text-lg font-semibold">
                  {processingScan ? "QR detected. Opening visitor..." : scannerReady ? "Place QR inside frame" : "Waiting for camera permission"}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {scannerError || "Scanning continues without page reload. Camera works on localhost or HTTPS."}
                </p>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${processingScan ? "border-amber-300/50 bg-amber-500/15 text-amber-200" : scannerReady ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-200" : "border-slate-400/40 bg-slate-500/15 text-slate-200"}`}>
                {processingScan ? "Processing" : scannerReady ? "Live" : "Idle"}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
