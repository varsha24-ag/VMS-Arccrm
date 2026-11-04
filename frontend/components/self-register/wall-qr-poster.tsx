"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

export default function WallQrPoster() {
  const router = useRouter();
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
    downloadLink.download = "Arcgate-Wall-QR-Visitor-Registration.png";
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
      <div className="print:hidden p-4 sm:p-5 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="px-3.5 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-600 transition flex items-center gap-2 shadow-sm"
              title="Go back to previous page"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>

            <div>
              <h2 className="text-base font-bold text-white">Wall QR Code Poster</h2>
              <p className="text-xs text-slate-400">
                Display or print this A4 poster at the reception/entrance for walk-in visitor self check-in.
              </p>
            </div>
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

      {/* Printable Poster Container */}
      <div className="flex justify-center py-2">
        <div className="w-full max-w-[640px] bg-white text-slate-900 rounded-[28px] border-4 border-[#0f172a] shadow-2xl p-6 sm:p-7 flex flex-col justify-between print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0">
          
          {/* Header Branding */}
          <div className="text-center border-b-2 border-slate-200 pb-3">
            <div className="inline-flex items-center justify-center bg-[#0f172a] w-14 h-14 rounded-[16px] mb-2 shadow-sm">
              <svg width="42" height="44" viewBox="0 0 436 455" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M73 455H0L191.5 0H243.5L436 455H359L218 126L73 455Z" fill="#E9774B" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-black tracking-wide text-[#0f172a] uppercase leading-tight">
              Arcgate Visitor Registration
            </h1>
            <p className="text-[13px] sm:text-[14px] font-extrabold tracking-[2.5px] text-[#ea580c] uppercase mt-1">
              Visitor Self Check-in
            </p>
          </div>

          {/* QR Code Section (Enlarged QR Code in Length, Breadth & Height) */}
          <div className="text-center flex flex-col items-center py-3.5">
            <div className="bg-[#f8fafc] border-2 border-slate-300 rounded-[26px] p-4 sm:p-5 inline-block shadow-md">
              {targetUrl ? (
                <div className="relative flex items-center justify-center">
                  {/* High-res SVG scaled prominently */}
                  <QRCodeSVG
                    value={targetUrl}
                    size={330}
                    level="H"
                    includeMargin={true}
                    className="w-[270px] h-[270px] xs:w-[300px] xs:h-[300px] sm:w-[330px] sm:h-[330px] mx-auto block aspect-square"
                  />

                  {/* Hidden Canvas for High-Res PNG download (1024x1024) */}
                  <div ref={canvasRef} className="hidden">
                    <QRCodeCanvas value={targetUrl} size={1024} level="H" includeMargin={true} />
                  </div>
                </div>
              ) : (
                <div className="w-[270px] h-[270px] sm:w-[330px] sm:h-[330px] bg-slate-200 animate-pulse rounded-2xl" />
              )}
            </div>

            <div className="inline-flex items-center gap-2 bg-[#0f172a] text-white text-[12px] font-extrabold tracking-[1.5px] uppercase px-5 py-2.5 rounded-full mt-3.5 shadow-sm">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan with Smartphone Camera
            </div>
          </div>

          {/* Instructions Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-[12px] font-extrabold text-slate-500 uppercase tracking-[2px] before:flex-1 before:h-[1.5px] before:bg-slate-200 after:flex-1 after:h-[1.5px] after:bg-slate-200">
              Instructions for Visitor Check-In
            </div>

            {/* Step 1: Wi-Fi Card (Full Width) */}
            <div className="bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-[16px] p-3.5 text-left flex items-start gap-3.5 shadow-xs">
              <div className="bg-[#2563eb] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-extrabold text-[#0f172a] leading-tight">
                  Connect to Arcgate Visitor Wi-Fi
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a8a] text-[11.5px] font-semibold px-3 py-1 rounded-[6px] inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      <line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                    <span>Wi-Fi Name: <strong className="text-[#1d4ed8] font-bold">Arcgate Visitor</strong></span>
                  </span>
                  <span className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a8a] text-[11.5px] font-semibold px-3 py-1 rounded-[6px] inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Password: <strong className="text-[#1d4ed8] font-bold">Arcgate@12345</strong></span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              
              {/* Step 2: Scan QR Code */}
              <div className="bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
                <div className="bg-[#ea580c] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-extrabold text-[#0f172a] leading-tight">
                    Scan QR Code
                  </div>
                  <p className="text-[12px] text-[#475569] font-medium mt-1 leading-snug">
                    Scan the QR code above from your smartphone camera.
                  </p>
                </div>
              </div>

              {/* Step 3: Open Selfie Camera */}
              <div className="bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
                <div className="bg-[#ea580c] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-extrabold text-[#0f172a] leading-tight">
                    Open Selfie Camera
                  </div>
                  <p className="text-[12px] text-[#475569] font-medium mt-1 leading-snug">
                    Open selfie camera on your mobile browser.
                  </p>
                </div>
              </div>

              {/* Step 4: Select Visit Purpose (Meeting / Interview / etc.) */}
              <div className="bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
                <div className="bg-[#ea580c] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-extrabold text-[#0f172a] leading-tight">
                    Select Visit Purpose
                  </div>
                  <p className="text-[12px] text-[#475569] font-medium mt-1 leading-snug">
                    Choose your visit purpose:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • MEETING
                    </span>
                    <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • INTERVIEW
                    </span>
                    <span className="bg-slate-200 text-[#0f172a] border border-slate-300 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • OTHER
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 5: Fill Details & Photo */}
              <div className="bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
                <div className="bg-[#ea580c] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  5
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-extrabold text-[#0f172a] leading-tight">
                    Click &ldquo;Allow&rdquo; &amp; Fill Details
                  </div>
                  <p className="text-[12px] text-[#475569] font-medium mt-1 leading-snug">
                    Snap photo and enter visitor details:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="bg-slate-200 text-[#0f172a] border border-slate-300 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • FULL NAME
                    </span>
                    <span className="bg-slate-200 text-[#0f172a] border border-slate-300 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • MOBILE
                    </span>
                    <span className="bg-slate-200 text-[#0f172a] border border-slate-300 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • EMAIL
                    </span>
                    <span className="bg-slate-200 text-[#0f172a] border border-slate-300 text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                      • COMPANY / UNIVERSITY
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 6: Submit & Check In */}
              <div className="bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
                <div className="bg-[#ea580c] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  6
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-extrabold text-[#0f172a] leading-tight">
                    Submit &amp; Check In
                  </div>
                  <p className="text-[12px] text-[#475569] font-medium mt-1 leading-snug">
                    Review your details and tap <strong>Submit &amp; Check In</strong>.
                  </p>
                </div>
              </div>

              {/* Step 7: Security Office Verification */}
              <div className="bg-[#f0fdf4] border-[1.5px] border-[#86efac] rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
                <div className="bg-[#059669] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  7
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-extrabold text-[#14532d] leading-tight">
                    Security Office Verification
                  </div>
                  <p className="text-[12px] text-[#166534] font-semibold mt-1 leading-snug">
                    Show <strong>&ldquo;Check-in Successful!&rdquo;</strong> to our security office.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
