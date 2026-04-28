"use client";

import { useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

type QrScannerProps = {
  onScan: (value: string) => void;
  onError: (message: string) => void;
  onReady: () => void;
};

export default function QrScanner({ onScan, onError, onReady }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    readerRef.current = codeReader;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let controls: any;
    const currentVideo = videoRef.current;

    async function startScanner() {
      try {
        if (!videoRef.current) return;
        
        // Use the same basic constraints as your working Photo Capture
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            console.warn("Autoplay was prevented, waiting for user interaction.");
          }
          onReady();
        }

        // Start looking for QR codes
        controls = await codeReader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            const text = result.getText().trim();
            if (text) {
              // Once scanned, we stop to prevent double scanning
              if (controls) controls.stop();
              onScan(text);
            }
          }
        });
      } catch (err) {
        onError(err instanceof Error ? err.message : "Unable to access camera for scanning.");
      }
    }

    void startScanner();

    return () => {
      if (controls) controls.stop();
      if (currentVideo?.srcObject) {
          const stream = currentVideo.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan, onError, onReady]);

  return (
    <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video 
            ref={videoRef} 
            className="h-full w-full object-cover"
            playsInline
            muted
        />
        {/* Decorative scanning line */}
        <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500/50 animate-pulse pointer-events-none" />
    </div>
  );
}
