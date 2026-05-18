"use client";

import Script from "next/script";

const ASSET_V = "6";

/** 静的書き出しでも動くようルートの Service Worker を登録（更新検知付き） */
export function PwaRegister() {
  return (
    <>
      <Script src={`/study-park-asset-version.js?v=${ASSET_V}`} strategy="afterInteractive" />
      <Script src={`/pwa-update.js?v=${ASSET_V}`} strategy="afterInteractive" />
    </>
  );
}
