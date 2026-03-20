import { getAccessToken } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8005";
const DEFAULT_TIMEOUT_MS = 15000;

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
