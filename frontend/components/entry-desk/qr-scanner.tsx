"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

type QrScannerProps = {
  onScan: (value: string) => void;
  onError: (message: string) => void;
  onReady: () => void;
};

export default function QrScanner({ onScan, onError, onReady }: QrScannerProps) {
  return (
    <Scanner
      onScan={(codes) => {
        const first = codes?.[0]?.rawValue?.trim();
        if (!first) return;
        onReady();
        onScan(first);
      }}
      onError={(error) => {
        onError(error instanceof Error ? error.message : "Unable to access camera.");
      }}
      constraints={{ facingMode: "environment" }}
      scanDelay={250}
      styles={{
        container: { width: "100%", height: "100%", background: "#020617" },
        video: { width: "100%", height: "100%", objectFit: "cover" },
      }}
    />
  );
}
