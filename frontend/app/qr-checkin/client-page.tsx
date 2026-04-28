"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PublicQrCheckinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      router.replace(`/guard/qr-visitor?code=${encodeURIComponent(code)}`);
      return;
    }
    router.replace("/guard/qr-visitor");
  }, [router, searchParams]);

  return null;
}

export default function PublicQrCheckinPage() {
  return (
    <Suspense fallback={null}>
      <PublicQrCheckinContent />
    </Suspense>
  );
}
