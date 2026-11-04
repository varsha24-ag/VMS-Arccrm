"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/api";

export default function SelfRegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [purpose, setPurpose] = useState("Interview");
  const [customPurpose, setCustomPurpose] = useState("");
  const [interviewHostName, setInterviewHostName] = useState("Manish Joshi");
  
  // Photo states
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Camera WebRTC states
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status & submission states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    id: number;
    visitor_name: string;
    checkin_time: string;
    purpose: string;
    host_name?: string | null;
  } | null>(null);

  // Fetch dynamic interview host configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/visitor/self-register/config`);
        if (res.ok) {
          const data = await res.json();
          if (data?.interview_host?.name) {
            setInterviewHostName(data.interview_host.name);
          }
        }
      } catch {
        // Fall back to default
      }
    }
    loadConfig();
  }, []);

  // Clean camera stream on unmount or mode change
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseLiveCamera(false);
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setIsCameraStarting(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported on this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setUseLiveCamera(true);
      setIsCameraStarting(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setIsCameraStarting(false);
      setCameraError("Could not access live camera. Please use the camera file button below.");
      setUseLiveCamera(false);
      // Fallback: trigger file input with native mobile camera
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setPhotoBlob(blob);
            setPhotoPreview(URL.createObjectURL(blob));
            stopCameraStream();
          }
        },
        "image/jpeg",
        0.85
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoBlob(file);
      setPhotoPreview(URL.createObjectURL(file));
      setCameraError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!photoBlob) {
      setErrorMessage("Visitor selfie photo is mandatory. Please open the camera or choose a photo before submitting.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (purpose === "Others" && !customPurpose.trim()) {
      setErrorMessage("Please specify your custom purpose.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", cleanPhone);
      formData.append("purpose", purpose);
      if (purpose === "Others" && customPurpose.trim()) {
        formData.append("custom_purpose", customPurpose.trim());
      }
      if (email.trim()) formData.append("email", email.trim());
      if (company.trim()) formData.append("company", company.trim());
      if (photoBlob) {
        formData.append("file", photoBlob, "selfie.jpg");
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/visitor/self-register`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to submit registration. Please try again.");
      }

      const result = await res.json();
      const finalPurpose = purpose === "Others" ? customPurpose.trim() : purpose;
      setSubmittedData({
        id: result.id,
        visitor_name: name.trim(),
        checkin_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        purpose: finalPurpose,
        host_name: result.host_name || (purpose === "Interview" ? interviewHostName : null),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setPurpose("Interview");
    setCustomPurpose("");
    setPhotoBlob(null);
    setPhotoPreview(null);
    setSubmittedData(null);
    setErrorMessage(null);
    stopCameraStream();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <div className="max-w-md w-full mx-auto my-auto bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header Section with Arcgate Logo */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800/90 p-6 text-center border-b border-slate-700/60">
          <div className="inline-flex items-center justify-center bg-slate-950/60 p-3 rounded-2xl border border-slate-700/50 mb-3 shadow-inner">
            <Image
              src="/arc-logo.svg"
              alt="Arcgate Logo"
              width={56}
              height={56}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Arcgate Visitor Registration
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Walk-in Self Registration Portal
          </p>

          {/* Badge Info */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Fast &amp; Secure Check-in
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {submittedData ? (
            /* Success State */
            <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Check-in Successful!</h2>
                <p className="text-sm text-slate-300">
                  Welcome, <span className="font-semibold text-emerald-400">{submittedData.visitor_name}</span>!
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 font-mono">
                    Time: {submittedData.checkin_time}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                    Purpose: {submittedData.purpose}
                  </span>
                  {submittedData.host_name && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                      Host: {submittedData.host_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 text-left text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Next Steps:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Please proceed to the reception waiting area.</li>
                  {submittedData.purpose.toLowerCase() === "interview" ? (
                    <li>Our team will call your name for the interview shortly.</li>
                  ) : (
                    <li>Our reception desk will verify and assign your host shortly.</li>
                  )}
                  <li>Please show this confirmation to the security desk.</li>
                </ul>
              </div>

              <button
                onClick={resetForm}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition duration-200"
              >
                Register Another Visitor
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Universal Photo / Selfie Capture */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Selfie Photo <span className="text-rose-400">*</span>
                  </label>
                  {photoBlob ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Photo Captured
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Mandatory
                    </span>
                  )}
                </div>

                {/* Hidden native input with universal camera capture attribute */}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className={`relative rounded-2xl bg-slate-900 border-2 border-dashed ${
                    !photoBlob && errorMessage && errorMessage.includes("photo")
                      ? "border-rose-500/80 bg-rose-500/5 ring-2 ring-rose-500/20"
                      : photoBlob
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-slate-700 hover:border-slate-500"
                  } transition p-4 text-center overflow-hidden`}
                >
                  {photoPreview ? (
                    <div className="relative group">
                      {/* eslint-disable-next-html-next-image */}
                      <img
                        src={photoPreview}
                        alt="Selfie preview"
                        className="w-36 h-36 object-cover rounded-full mx-auto border-4 border-slate-700 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoBlob(null);
                          setPhotoPreview(null);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 hover:bg-rose-500/30 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake Selfie
                      </button>
                    </div>
                  ) : useLiveCamera ? (
                    <div className="space-y-3">
                      <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-emerald-500/50 bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                      </div>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={capturePhotoFromStream}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                          Snap Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCameraStream}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-3">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">Take a quick selfie photo</p>
                        <p className="text-[11px] text-slate-400">Supported on all Android & iPhone cameras</p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isCameraStarting}
                          onClick={startLiveCamera}
                          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
                        >
                          {isCameraStarting ? (
                            "Opening Camera..."
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Open Selfie Camera
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Choose / Capture
                        </button>
                      </div>

                      {cameraError && (
                        <p className="text-[11px] text-amber-400 mt-2 font-medium">{cameraError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose of Visit */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Purpose of Visit <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={purpose}
                    onChange={(e) => {
                      setPurpose(e.target.value);
                      if (e.target.value !== "Others") {
                        setCustomPurpose("");
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition appearance-none cursor-pointer"
                  >
                    <option value="Interview" className="bg-slate-900 text-white">Interview</option>
                    <option value="Meeting" className="bg-slate-900 text-white">Meeting</option>
                    <option value="Delivery" className="bg-slate-900 text-white">Delivery</option>
                    <option value="Maintenance" className="bg-slate-900 text-white">Maintenance</option>
                    <option value="Vendor" className="bg-slate-900 text-white">Vendor</option>
                    <option value="Others" className="bg-slate-900 text-white">Others (Specify)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* If Interview: Show Host */}
                {purpose === "Interview" && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>
                      Host: <strong className="text-white font-semibold">{interviewHostName}</strong>
                    </span>
                  </div>
                )}

                {/* If Others: Show Custom Purpose text input */}
                {purpose === "Others" && (
                  <div className="pt-2 space-y-1">
                    <label className="block text-[11px] font-medium text-slate-400">
                      Specify Custom Purpose <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Document Verification / Personal"
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white font-mono tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                />
              </div>

              {/* College / Current Company */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  College / Current Company <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan University"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-600/25 transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting Check-in...
                  </>
                ) : (
                  <>
                    Submit & Check In
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/60 p-4 text-center border-t border-slate-800 text-[11px] text-slate-500 font-medium">
          Powered by Arcgate Visitor Management System
        </div>
      </div>
    </div>
  );
}
