"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import type { MarketingSettings } from "@/lib/types";

type FBQ = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: FBQ;
  callMethod?: (...args: unknown[]) => void;
};

type WindowWithFbq = Window & { fbq?: FBQ; _fbq?: FBQ };

function injectPixelBase(pixelId: string) {
  if (typeof window === "undefined") return;
  const w = window as WindowWithFbq;
  if (w.fbq) return; // already injected

  const n: FBQ = (function (...args: unknown[]) {
    if (n.callMethod) {
      n.callMethod(...args);
    } else {
      (n.queue ||= []).push(args);
    }
  }) as FBQ;

  w.fbq = n;
  if (!w._fbq) w._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";

  const t = document.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  const s = document.getElementsByTagName("script")[0];
  s?.parentNode?.insertBefore(t, s);

  if (w.fbq) w.fbq("init", pixelId);
}

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enabledRef = useRef(false);

  // Fetch settings once and inject/init pixel
  useEffect(() => {
    // Skip on auth pages to avoid redirect loops when unauthenticated
    const isAuthPage =
      typeof window !== "undefined" && window.location.pathname.startsWith("/login");
    if (isAuthPage) return;
    let mounted = true;
    (async () => {
      try {
        const s = await fetchApi<MarketingSettings>("/marketing/settings");
        const id = s.facebookPixelId?.trim();
        const enabled = Boolean(s.isFacebookEnabled && id);
        if (mounted && enabled && id) {
          injectPixelBase(id);
          enabledRef.current = true;
          const w = window as WindowWithFbq;
          if (w.fbq) w.fbq("track", "PageView");
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Track route changes as additional PageView events
  useEffect(() => {
    if (!enabledRef.current) return;
    if (pathname && pathname.startsWith("/login")) return;
    const w = window as WindowWithFbq;
    if (w.fbq) w.fbq("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}
