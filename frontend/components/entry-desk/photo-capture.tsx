"use client";

import { useEffect, useRef, useState } from "react";

import { API_BASE_URL, uploadVisitorPhoto } from "@/lib/api";

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
      const fullUrl = result.photo_url.startsWith("http") ? result.photo_url : `${API_BASE_URL}${result.photo_url}`;
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
      <label className="text-sm text-[var(--text-2)]">Visitor Photo</label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)]"
        >
          {cameraActive ? "Close Camera" : "Open Camera"}
        </button>

        <button
          type="button"
          onClick={captureFrame}
          disabled={!cameraActive || loading}
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-fg)] shadow-sm transition hover:brightness-95 disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Capture Photo"}
        </button>

        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[var(--text-2)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--accent-fg)]"
        />

        {preview ? (
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-md border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)]"
          >
            Retake
          </button>
        ) : null}
      </div>

      {cameraActive && !hasCaptured ? (
        <div className="flex items-center gap-3">
          <div className="flex h-28 w-36 items-center justify-center overflow-hidden rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)]">
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
          <p className="text-xs text-[var(--text-2)]">Keep your face centered in the preview.</p>
        </div>
      ) : null}

      {preview ? (
        <div className="flex items-center gap-3">
          <div className="flex h-28 w-36 items-center justify-center overflow-hidden rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Captured visitor" className="h-full w-full object-cover" />
          </div>
          <p className="text-xs text-[var(--text-2)]">Photo saved. You can retake if needed.</p>
        </div>
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] text-xs text-[var(--text-3)]">
          {loading ? "Uploading..." : "No photo"}
        </div>
      )}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
