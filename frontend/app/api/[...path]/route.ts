import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://127.0.0.1:8005";

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).join("/");
  const targetUrl = `${BACKEND_URL}/${path}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  try {
    let body: ArrayBuffer | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await res.arrayBuffer();
    const responseHeaders = new Headers(res.headers);

    return new NextResponse(data, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to backend server.";
    return NextResponse.json(
      { detail: message },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
