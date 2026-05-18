"use client";

import { useEffect } from "react";

/** 静的書き出しでも動くようルートの Service Worker を登録（更新検知付き） */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "/pwa-update.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
