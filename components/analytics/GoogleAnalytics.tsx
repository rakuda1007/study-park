"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? "";
const MEASUREMENT_ID_OK = /^G-[A-Z0-9]+$/.test(MEASUREMENT_ID);

/** サブドメイン共通の測定では、Cookie を親ドメインに置く（gtag の既定）。 */
function linkerDomain(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const host = new URL(raw).hostname;
    if (host === "localhost" || host.endsWith(".localhost")) return undefined;
    const parts = host.split(".").filter(Boolean);
    if (parts.length < 2) return undefined;
    const domain = parts.slice(-2).join(".");
    return /^[a-z0-9.-]+$/i.test(domain) ? domain : undefined;
  } catch {
    return undefined;
  }
}

const LINKER_DOMAIN = linkerDomain();

function bootstrapScript(): string {
  const linker = LINKER_DOMAIN ? `linker:{domains:['${LINKER_DOMAIN}']},` : "";
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${MEASUREMENT_ID}', { ${linker} send_page_view: false });
  `;
}

/** 画面遷移のたびに page_view を送る。初回もここから送り、config 側の自動送信とは重ねない。 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!MEASUREMENT_ID_OK) return;
    const pagePath = search ? `${pathname}?${search}` : pathname || "/";
    if (lastPath.current === pagePath) return;

    let cancelled = false;
    let attempts = 0;
    const send = (force: boolean) => {
      if (cancelled || typeof window.gtag !== "function") return false;
      // 画面遷移直後は document.title がまだ空のことがある。
      if (!force && !document.title) return false;
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
      lastPath.current = pagePath;
      return true;
    };

    const timer = window.setInterval(() => {
      attempts += 1;
      if (send(attempts >= 20)) window.clearInterval(timer);
    }, 50);
    const stop = window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [pathname, search]);

  if (!MEASUREMENT_ID_OK) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {bootstrapScript()}
      </Script>
    </>
  );
}
