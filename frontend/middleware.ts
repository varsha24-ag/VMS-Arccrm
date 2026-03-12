import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/reception", "/employee"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  // If later you move token storage to httpOnly cookies, validate presence here.
  return NextResponse.next();
}

export const config = {
  matcher: ["/reception/:path*", "/employee/:path*"]
};
