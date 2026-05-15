import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 開発時: /kuku → public/kuku/index.html（App Router は index を自動で出さない） */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/kuku/index.html";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/kuku", "/kuku/"],
};
