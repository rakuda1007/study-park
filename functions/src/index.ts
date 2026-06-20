import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import {
  issueAdminAccessGateToken,
  verifyAdminAccessGateCredentials,
} from "./admin/access-gate";
import {
  formatAdminLoginLockMessage,
  getAdminLoginLockState,
  recordAdminLoginFailure,
  recordAdminLoginSuccess,
} from "./admin/login-lock";
import {
  runBillingPurgeExpiredTrials,
  runBillingReconcile,
  runBillingTrialNotifications,
} from "./billing/scheduled";
import { runStudyPlanMaintenance } from "./study/scheduled";
import { createStarterCheckoutSession } from "./billing/checkout";
import {
  createSubscriptionCheckoutSession,
  resolveSubscriptionPriceId,
} from "./billing/checkout";
import { verifyFirebaseIdToken } from "./billing/auth";
import { billingHttpErrorStatus, parseJsonBody } from "./billing/http";
import { handleStripeWebhook } from "./billing/webhook";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const adminGatePassword = defineSecret("ADMIN_GATE_PASSWORD");
const adminGateUsername = defineString("ADMIN_GATE_USERNAME", {
  default: "study-park-admin",
});

const billingHttpOptions = {
  region: "asia-northeast1" as const,
  secrets: [stripeSecretKey],
  invoker: "public" as const,
  cors: true,
};

export const createStarterCheckout = onRequest(billingHttpOptions, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const { uid, email } = await verifyFirebaseIdToken(req.headers.authorization ?? null);
    const body = parseJsonBody(req);
    const workspaceId = String(body.workspaceId ?? "").trim();
    if (!workspaceId) {
      res.status(400).json({ error: "workspaceId が必要です。" });
      return;
    }
    const url = await createStarterCheckoutSession({ uid, email, workspaceId });
    res.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    res.status(billingHttpErrorStatus(message)).json({ error: message });
  }
});

export const createSubscriptionCheckout = onRequest(billingHttpOptions, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const { uid, email } = await verifyFirebaseIdToken(req.headers.authorization ?? null);
    const body = parseJsonBody(req);
    const workspaceId = String(body.workspaceId ?? "").trim();
    const tierId = String(body.tierId ?? "").trim();
    if (!workspaceId || !tierId) {
      res.status(400).json({ error: "workspaceId と tierId が必要です。" });
      return;
    }
    if (tierId !== "s" && tierId !== "m" && tierId !== "l") {
      res.status(400).json({ error: "tierId は s / m / l のいずれかです。" });
      return;
    }
    const priceId = await resolveSubscriptionPriceId(tierId);
    const url = await createSubscriptionCheckoutSession({
      uid,
      email,
      workspaceId,
      tierId,
      priceId,
    });
    res.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    res.status(billingHttpErrorStatus(message)).json({ error: message });
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

/** 毎日 5:00 JST — 学習計画の自動アーカイブと Firestore 利用メトリクス出力 */
export const studyPlanMaintenance = onSchedule(
  { schedule: "0 5 * * *", ...scheduleRegion },
  async () => {
    const result = await runStudyPlanMaintenance();
    console.info("[studyPlanMaintenance]", result);
  },
);

export const adminLoginLock = onRequest(
  {
    region: "asia-northeast1",
    invoker: "public",
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }
    try {
      const body =
        typeof req.body === "object" && req.body !== null
          ? (req.body as { email?: string; action?: string })
          : {};
      const email = String(body.email ?? "").trim();
      const action = String(body.action ?? "").trim();
      if (!email) {
        res.status(400).json({ error: "email が必要です。" });
        return;
      }
      if (action === "check") {
        res.json(await getAdminLoginLockState(email));
        return;
      }
      if (action === "failure") {
        const state = await recordAdminLoginFailure(email);
        res.json({
          ...state,
          message: state.locked ? formatAdminLoginLockMessage(state) : undefined,
        });
        return;
      }
      if (action === "success") {
        await recordAdminLoginSuccess(email);
        res.json({ locked: false, failCount: 0, remainingAttempts: 10, lockedUntil: null });
        return;
      }
      res.status(400).json({ error: "action が不正です。" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "ログイン制限の処理に失敗しました。";
      res.status(500).json({ error: message });
    }
  },
);

export const verifyAdminAccessGate = onRequest(
  {
    region: "asia-northeast1",
    secrets: [adminGatePassword],
    invoker: "public",
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }
    try {
      process.env.ADMIN_GATE_USERNAME = adminGateUsername.value();
      process.env.ADMIN_GATE_PASSWORD = adminGatePassword.value();
      const body =
        typeof req.body === "object" && req.body !== null
          ? (req.body as { username?: string; password?: string })
          : {};
      const username = String(body.username ?? "");
      const password = String(body.password ?? "");
      if (!username || !password) {
        res.status(400).json({ error: "ユーザー名とパスワードが必要です。" });
        return;
      }
      if (!verifyAdminAccessGateCredentials(username, password)) {
        res.status(401).json({ error: "ユーザー名またはパスワードが正しくありません。" });
        return;
      }
      res.json(issueAdminAccessGateToken());
    } catch (e) {
      const message = e instanceof Error ? e.message : "認証に失敗しました。";
      res.status(503).json({ error: message });
    }
  },
);

export const stripeWebhook = onRequest(
  {
    region: "asia-northeast1",
    secrets: [stripeSecretKey, stripeWebhookSecret],
    invoker: "public",
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
