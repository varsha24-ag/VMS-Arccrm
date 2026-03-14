"use client";

import { useEffect, useRef, useState } from "react";

import { uploadVisitorPhoto } from "@/lib/api";

interface PhotoCaptureProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasCaptured, setHasCaptured] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    setPreview(value);
    setHasCaptured(Boolean(value));
  }, [value]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [cameraActive]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function startCamera() {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API not available in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Some browsers require metadata before playback.
          videoRef.current.onloadedmetadata = () => {
            void videoRef.current?.play();
          };
        }
      }
      setCameraActive(true);
    } catch {
      setError("Unable to access camera. Please check permissions or upload a file instead.");
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const result = await uploadVisitorPhoto(file);
      const fullUrl = result.photo_url.startsWith("http") ? result.photo_url : `${baseUrl}${result.photo_url}`;
      setPreview(fullUrl);
      onChange(fullUrl);
      setHasCaptured(true);
      stopCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setLoading(false);
    }
  }

  function captureFrame() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `visitor-${Date.now()}.jpg`, { type: "image/jpeg" });
        void handleFile(file);
      },
      "image/jpeg",
      0.9
    );
  }

  function handleRetake() {
    setHasCaptured(false);
    setPreview(undefined);
    onChange("");
    void startCamera();
  }

  return (
    <div className="space-y-3">
      <label className="text-sm text-slate-200">Visitor Photo</label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white"
        >
          {cameraActive ? "Close Camera" : "Open Camera"}
        </button>

        <button
          type="button"
          onClick={captureFrame}
          disabled={!cameraActive || loading}
          className="rounded-md bg-[#ff7a45] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Capture Photo"}
        </button>

        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#ff7a45] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />

        {preview ? (
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-md border border-[#ff7a45]/40 bg-[#ff7a45]/10 px-3 py-2 text-xs font-semibold text-[#ffb08a]"
          >
            Retake
          </button>
        ) : null}
      </div>

      {cameraActive && !hasCaptured ? (
        <div className="flex items-center gap-3">
          <div className="flex h-28 w-36 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/60">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
              width={144}
              height={112}
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <p className="text-xs text-slate-300">Keep your face centered in the preview.</p>
        </div>
      ) : null}

      {preview ? (
        <div className="flex items-center gap-3">
          <div className="flex h-28 w-36 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Captured visitor" className="h-full w-full object-cover" />
          </div>
          <p className="text-xs text-slate-300">Photo saved. You can retake if needed.</p>
        </div>
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs text-slate-400">
          {loading ? "Uploading..." : "No photo"}
        </div>
      )}

      {error ? <p className="text-xs text-[#ffc5aa]">{error}</p> : null}
    </div>
  );
}
