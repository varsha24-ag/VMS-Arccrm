"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

export default function WallQrPoster() {
  const [baseUrl, setBaseUrl] = useState<string>("");
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const targetUrl = baseUrl ? `${baseUrl.replace(/\/+$/, "")}/self-register` : "";

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "Arcgate-Wall-QR-Interview-Registration.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Control Bar (Hidden during print) */}
      <div className="print:hidden space-y-4 p-5 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Wall QR Code Poster</h2>
            <p className="text-xs text-slate-400">
              Print and place this QR code poster at the reception/entrance for interview candidates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPng}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold border border-slate-600 transition flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PNG
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Poster
            </button>
          </div>
        </div>
      </div>

      {/* Printable Poster Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl border-4 border-slate-900 shadow-2xl p-8 sm:p-10 text-center space-y-6 print:border-none print:shadow-none print:max-w-none print:p-0">
          
          {/* Header Branding */}
          <div className="space-y-3 border-b-2 border-slate-200 pb-6">
            <div className="inline-block bg-slate-900 p-3 rounded-2xl">
              <Image
                src="/arc-logo.svg"
                alt="Arcgate Logo"
                width={64}
                height={64}
                className="h-12 w-auto mx-auto"
                priority
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
              Arcgate Interview Registration
            </h1>
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
              Walk-in Candidate Self Check-in
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
            {targetUrl ? (
              <div className="relative">
                {/* SVG view for high-res printing */}
                <QRCodeSVG
                  value={targetUrl}
                  size={240}
                  level="H"
                  includeMargin={true}
                  className="mx-auto"
                />

                {/* Hidden Canvas for PNG download */}
                <div ref={canvasRef} className="hidden">
                  <QRCodeCanvas value={targetUrl} size={600} level="H" includeMargin={true} />
                </div>
              </div>
            ) : (
              <div className="w-60 h-60 bg-slate-200 animate-pulse rounded-xl" />
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-4 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan with Smartphone Camera
            </div>

            <div className="grid grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full inline-flex items-center justify-center text-xs font-bold">1</span>
                <p className="text-[11px] font-bold text-slate-800">Scan QR Code</p>
                <p className="text-[10px] text-slate-500">Open link on phone</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full inline-flex items-center justify-center text-xs font-bold">2</span>
                <p className="text-[11px] font-bold text-slate-800">Take Selfie</p>
                <p className="text-[10px] text-slate-500">Enter name & phone</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full inline-flex items-center justify-center text-xs font-bold">3</span>
                <p className="text-[11px] font-bold text-slate-800">Check In</p>
                <p className="text-[10px] text-slate-500">Proceed to waiting area</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t-2 border-slate-200 pt-4 text-xs font-semibold text-slate-500">
            Host: <span className="text-slate-900 font-bold">Manish Joshi</span> | Purpose: <span className="text-slate-900 font-bold">Interview</span>
          </div>
        </div>
      </div>
    </div>
  );
}
