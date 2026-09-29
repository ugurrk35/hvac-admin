"use client";

import { useEffect } from "react";
import { getFbq } from "@/components/analytics/pixelEvents";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const valueRaw = searchParams.get("value");
    const currency = searchParams.get("currency") || "TRY";
    const value = valueRaw ? Number(valueRaw) : undefined;
    try {
      const q = getFbq();
      if (q) {
        q("track", "Purchase", {
          ...(value !== undefined ? { value } : {}),
          currency,
        });
      }
    } catch {}
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-xl py-16 px-6 text-center space-y-3">
      <h1 className="text-2xl font-semibold">Ödeme Başarılı</h1>
      <p className="text-gray-600">Siparişiniz alınmıştır. Teşekkür ederiz.</p>
    </div>
  );
}
