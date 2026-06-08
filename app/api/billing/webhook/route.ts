import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/billing/stripe-server/webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "stripe-signature がありません。" }, { status: 400 });
    }
    const rawBody = Buffer.from(await req.arrayBuffer());
    await handleStripeWebhook(rawBody, signature);
    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook の処理に失敗しました。";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
