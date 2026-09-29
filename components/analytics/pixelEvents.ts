"use client";

export type FBQ = (...args: unknown[]) => void;

export function getFbq(): FBQ | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { fbq?: FBQ }).fbq;
}

export function trackPageView() {
  const q = getFbq();
  if (q) q("track", "PageView");
}

export function trackViewContent(params: {
  content_name?: string;
  content_ids?: Array<string | number>;
  content_type?: string;
  value?: number;
  currency?: string;
}) {
  const q = getFbq();
  if (q) q("track", "ViewContent", params);
}

export function trackAddToCart(params: {
  content_name?: string;
  content_ids?: Array<string | number>;
  value?: number;
  currency?: string;
  quantity?: number;
}) {
  const q = getFbq();
  if (q) q("track", "AddToCart", params);
}

export function trackInitiateCheckout(params?: {
  value?: number;
  currency?: string;
  num_items?: number;
  content_ids?: Array<string | number>;
}) {
  const q = getFbq();
  if (q) q("track", "InitiateCheckout", params || {});
}

export function trackPurchase(params: { value?: number; currency?: string }) {
  const q = getFbq();
  if (q) q("track", "Purchase", params);
}

export function trackCustom(name: string, params?: Record<string, unknown>) {
  const q = getFbq();
  if (q) q("trackCustom", name, params || {});
}
