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
  const configured = Boolean(clientId && slotId);

  useEffect(() => {
    if (!configured || pushed.current) return;
    const timer = window.setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        /* ignore */
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [configured, clientId, slotId]);

  return (
    <>
      {configured ? (
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
      <aside className={`adsense-unit ${className ?? ""}`} aria-label="広告">
        <p className="adsense-unit-label">広告</p>
        {configured ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: 90 }}
            data-ad-client={clientId!}
            data-ad-slot={slotId!}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <p className="adsense-unit-placeholder">
            広告枠（AdSense のクライアント ID / スロット ID が未設定です）
          </p>
        )}
      </aside>
    </>
  );
}
