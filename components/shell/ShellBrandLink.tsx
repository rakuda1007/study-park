"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { homePathForSession, type AuthSessionKind } from "@/lib/firebase/auth-client";

export function shellBrandHref(pathname: string, session: AuthSessionKind | null): string {
  if (pathname === "/" || !session) return "/";
  return homePathForSession(session);
}

export function ShellBrandLink({ session }: { session: AuthSessionKind | null }) {
  const pathname = usePathname();
  const href = shellBrandHref(pathname, session);

  return (
    <Link href={href} className="shell-brand-link">
      Study Park
    </Link>
  );
}
