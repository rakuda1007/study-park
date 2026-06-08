import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/billing/stripe-server/auth";
import {
  createSubscriptionCheckoutSession,
  resolveSubscriptionPriceId,
} from "@/lib/billing/stripe-server/checkout";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyFirebaseIdToken(req.headers.get("authorization"));
    const body = (await req.json()) as { workspaceId?: string; tierId?: string };
    const workspaceId = body.workspaceId?.trim();
    const tierId = body.tierId?.trim();
    if (!workspaceId || !tierId) {
      return NextResponse.json({ error: "workspaceId と tierId が必要です。" }, { status: 400 });
    }
    if (tierId !== "s" && tierId !== "m" && tierId !== "l") {
      return NextResponse.json({ error: "tierId は s / m / l のいずれかです。" }, { status: 400 });
    }
    const priceId = await resolveSubscriptionPriceId(tierId);
    const url = await createSubscriptionCheckoutSession({
      uid,
      email,
      workspaceId,
      tierId,
      priceId,
    });
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    const status = message.includes("認証") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
