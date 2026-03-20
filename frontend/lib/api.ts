import { getAccessToken } from "./auth";

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8005";
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 15000;

export function resolveApiAssetUrl(value?: string | null): string | null {
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      if (url.pathname.startsWith("/uploads/")) {
        return `${API_BASE_URL}${url.pathname}`;
      }
    } catch {
      // Ignore malformed absolute URLs; use raw value.
    }
    return value;
  }

  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: {
    id: number;
    name: string;
    role: string;
  };
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? `Login failed (${response.status})`);
  }

  return response.json();
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function uploadVisitorPhoto(file: File): Promise<{ photo_url: string }> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(`${API_BASE_URL}/visitor/photo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? `Photo upload failed (${response.status})`);
  }

  return response.json();
}
