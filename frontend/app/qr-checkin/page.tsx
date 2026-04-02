"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PublicQrCheckinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      router.replace(`/reception/qr-visitor?code=${encodeURIComponent(code)}`);
      return;
    }
    router.replace("/reception/qr-visitor");
  }, [router, searchParams]);

  return null;
}
