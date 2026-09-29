"use client";

import { useEffect } from "react";
import { getFbq } from "@/components/analytics/pixelEvents";
import { useSearchParams } from "next/navigation";

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams.get("reason") || undefined;
    try {
      const q = getFbq();
      if (q) {
        q("trackCustom", "PaymentFailed", {
          ...(reason ? { reason } : {}),
        });
      }
    } catch {}
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-xl py-16 px-6 text-center space-y-3">
      <h1 className="text-2xl font-semibold">Ödeme Başarısız</h1>
      <p className="text-gray-600">Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.</p>
    </div>
  );
}
