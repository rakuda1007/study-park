"use client";

import Link from "next/link";
import { useShellSession } from "@/components/shell/useShellSession";

export function HomeGuestCta() {
  const { ready, session } = useShellSession();

  if (!ready || session) return null;

  return (
    <div className="home-hero__cta-wrap">
      <Link href="/signup" className="home-hero__cta">
        今すぐ Study Park をはじめる（無料）
      </Link>
    </div>
  );
}
