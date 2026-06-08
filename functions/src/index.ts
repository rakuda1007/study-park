import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import {
  runBillingPurgeExpiredTrials,
  runBillingReconcile,
  runBillingTrialNotifications,
} from "./billing/scheduled";
import { createStarterCheckoutSession } from "./billing/checkout";
import {
  createSubscriptionCheckoutSession,
  resolveSubscriptionPriceId,
} from "./billing/checkout";
import { handleStripeWebhook } from "./billing/webhook";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const callableOptions = {
  region: "asia-northeast1",
  secrets: [stripeSecretKey],
};

export const createStarterCheckout = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "ログインが必要です。");
  }
  const workspaceId = String(request.data?.workspaceId ?? "").trim();
  if (!workspaceId) {
    throw new HttpsError("invalid-argument", "workspaceId が必要です。");
  }
  try {
    const url = await createStarterCheckoutSession({
      uid: request.auth.uid,
      email: request.auth.token.email,
      workspaceId,
    });
    return { url };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    throw new HttpsError("failed-precondition", message);
  }
});

export const createSubscriptionCheckout = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "ログインが必要です。");
  }
  const workspaceId = String(request.data?.workspaceId ?? "").trim();
  const tierId = String(request.data?.tierId ?? "").trim();
  if (!workspaceId || !tierId) {
    throw new HttpsError("invalid-argument", "workspaceId と tierId が必要です。");
  }
  if (tierId !== "s" && tierId !== "m" && tierId !== "l") {
    throw new HttpsError("invalid-argument", "tierId は s / m / l のいずれかです。");
  }
  try {
    const priceId = await resolveSubscriptionPriceId(tierId);
    const url = await createSubscriptionCheckoutSession({
      uid: request.auth.uid,
      email: request.auth.token.email,
      workspaceId,
      tierId,
      priceId,
    });
    return { url };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    throw new HttpsError("failed-precondition", message);
  }
});

const scheduleRegion = { region: "asia-northeast1" as const, timeZone: "Asia/Tokyo" as const };

/** 毎日 9:00 JST — お試し満了・削除予定のメール通知 */
export const billingTrialNotifications = onSchedule(
  { schedule: "0 9 * * *", ...scheduleRegion },
  async () => {
    const result = await runBillingTrialNotifications();
    console.info("[billingTrialNotifications]", result);
  },
);

/** 毎日 3:00 JST — 猶予終了 WS の削除 */
export const billingPurgeExpiredTrials = onSchedule(
  { schedule: "0 3 * * *", ...scheduleRegion },
  async () => {
    const result = await runBillingPurgeExpiredTrials();
    console.info("[billingPurgeExpiredTrials]", result);
  },
);

/** 毎日 4:00 JST — 課金状態の整合（購入同期・Stripe・問題数） */
export const billingReconcile = onSchedule(
  {
    schedule: "0 4 * * *",
    ...scheduleRegion,
    secrets: [stripeSecretKey],
  },
  async () => {
    const result = await runBillingReconcile({ recountQuestions: true });
    console.info("[billingReconcile]", result);
  },
);

export const stripeWebhook = onRequest(
  {
    region: "asia-northeast1",
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing stripe-signature");
      return;
    }
    try {
      const rawBody = req.rawBody;
      if (!rawBody?.length) {
        res.status(400).send("Empty body");
        return;
      }
      await handleStripeWebhook(rawBody, signature);
      res.json({ received: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Webhook error";
      console.error("[stripeWebhook]", message);
      res.status(400).send(message);
    }
  },
);
