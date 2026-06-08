import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/billing/stripe-server/auth";
import { createStarterCheckoutSession } from "@/lib/billing/stripe-server/checkout";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyFirebaseIdToken(req.headers.get("authorization"));
    const body = (await req.json()) as { workspaceId?: string };
    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId が必要です。" }, { status: 400 });
    }
    const url = await createStarterCheckoutSession({ uid, email, workspaceId });
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    const status = message.includes("認証") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
