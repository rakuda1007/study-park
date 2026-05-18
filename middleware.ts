import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 開発時: 静的 HTML を index.html へ（App Router は index を自動で出さない） */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = request.nextUrl.pathname;

  if (path === "/kuku" || path === "/kuku/") {
    url.pathname = "/kuku/index.html";
    return NextResponse.redirect(url);
  }

  if (path === "/kencho" || path === "/kencho/") {
    url.pathname = "/kencho/index.html";
    return NextResponse.redirect(url);
  }

  if (path === "/tsuki" || path === "/tsuki/") {
    url.pathname = "/tsuki/index.html";
    return NextResponse.redirect(url);
  }

  if (path === "/shokubutsu" || path === "/shokubutsu/") {
    url.pathname = "/shokubutsu/index.html";
    return NextResponse.redirect(url);
  }

  if (path === "/yukichiiki" || path === "/yukichiiki/") {
    url.pathname = "/yukichiiki/index.html";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/kuku",
    "/kuku/",
    "/kencho",
    "/kencho/",
    "/tsuki",
    "/tsuki/",
    "/shokubutsu",
    "/shokubutsu/",
    "/yukichiiki",
    "/yukichiiki/",
  ],
};
