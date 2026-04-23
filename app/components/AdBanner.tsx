"use client";

import { useEffect } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
}: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-expect-error - adsbygoogle is loaded via script tag
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // silently fail in dev
    }
  }, []);

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
