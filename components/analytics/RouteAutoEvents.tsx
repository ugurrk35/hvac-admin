"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackInitiateCheckout, trackViewContent } from "@/components/analytics/pixelEvents";

export default function RouteAutoEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firedRef = useRef<string>("");

  useEffect(() => {
    const path = pathname || "";
    const key = path + "?" + searchParams.toString();
    if (key === firedRef.current) return;
    firedRef.current = key;

    // Heuristic: product detail pages
    const productMatch = path.match(/^\/(?:product|products|p)\/(.+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const name = searchParams.get("name") || undefined;
      const price = searchParams.get("price");
      const currency = searchParams.get("currency") || undefined;
      trackViewContent({
        content_name: name,
        content_ids: [id],
        value: price ? Number(price) : undefined,
        currency,
        content_type: "product",
      });
      return;
    }

    // Heuristic: starting checkout (exclude success/failure pages)
    if (path.startsWith("/checkout") && !/\/checkout\/(success|failure)/.test(path)) {
      const value = searchParams.get("value");
      const currency = searchParams.get("currency") || undefined;
      const count = searchParams.get("num_items");
      trackInitiateCheckout({
        value: value ? Number(value) : undefined,
        currency,
        num_items: count ? Number(count) : undefined,
      });
      return;
    }
  }, [pathname, searchParams]);

  return null;
}

