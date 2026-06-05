"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import type { AdSenseSlotKey } from "@/lib/ads/config";
import { getAdSenseClientId, getAdSenseSlot } from "@/lib/ads/config";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type Props = {
  slotKey: AdSenseSlotKey;
  className?: string;
};

export function AdSenseUnit({ slotKey, className }: Props) {
  const clientId = getAdSenseClientId();
  const slotId = getAdSenseSlot(slotKey);
  const pushed = useRef(false);

  useEffect(() => {
    if (!clientId || !slotId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* ignore */
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) return null;

  return (
    <>
      <Script
        id="adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <aside className={`adsense-unit ${className ?? ""}`} aria-label="広告">
        <p className="adsense-unit-label">広告</p>
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: 90 }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    </>
  );
}
