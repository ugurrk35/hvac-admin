"use client";

import * as React from "react";
import { trackAddToCart } from "@/components/analytics/pixelEvents";

type Props = React.ComponentProps<"button"> & {
  contentName?: string;
  contentId?: string | number;
  value?: number;
  currency?: string;
  quantity?: number;
};

export default function AddToCartButton({
  contentName,
  contentId,
  value,
  currency = "TRY",
  quantity = 1,
  onClick,
  ...rest
}: Props) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      trackAddToCart({
        content_name: contentName,
        content_ids: contentId !== undefined ? [contentId] : undefined,
        value,
        currency,
        quantity,
      });
    } catch {}
    onClick?.(e);
  };

  return <button {...rest} onClick={handleClick} />;
}

