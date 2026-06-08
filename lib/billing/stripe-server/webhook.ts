import type Stripe from "stripe";
import { applyStarterPurchase, applySubscriptionTier } from "./apply";
import { getAdminFirestore } from "./firestore-admin";
import { getStripe } from "./stripe";
import { getStripeWebhookSecret } from "./config";

export async function handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  const db = getAdminFirestore();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      const uid = meta.uid || session.client_reference_id || "";
      const workspaceId = meta.workspaceId || "";
      if (!uid || !workspaceId) break;

      if (session.mode === "payment" && meta.type === "starter") {
        await applyStarterPurchase(db, uid, workspaceId, session.id);
      }
      if (session.mode === "subscription" && meta.type === "subscription") {
        const tierId = meta.tierId as "s" | "m" | "l";
        if (tierId === "s" || tierId === "m" || tierId === "l") {
          await applySubscriptionTier(db, workspaceId, tierId, {
            subscriptionId: session.subscription ? String(session.subscription) : undefined,
            customerId: session.customer ? String(session.customer) : undefined,
            status: "active",
          });
        }
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const meta = sub.metadata ?? {};
      const workspaceId = meta.workspaceId || "";
      const tierId = meta.tierId as "s" | "m" | "l";
      if (!workspaceId || !tierId) break;

      if (sub.status === "active" || sub.status === "trialing") {
        await applySubscriptionTier(db, workspaceId, tierId, {
          subscriptionId: sub.id,
          customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          status: "active",
        });
      } else if (sub.status === "past_due" || sub.status === "unpaid") {
        await db.collection("workspaces").doc(workspaceId).update({
          subscriptionStatus: "past_due",
          updatedAt: new Date(),
        });
      } else if (sub.status === "canceled") {
        await applySubscriptionTier(db, workspaceId, tierId, {
          subscriptionId: sub.id,
          status: "canceled",
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId || "";
      const tierId = (sub.metadata?.tierId || "s") as "s" | "m" | "l";
      if (workspaceId) {
        await applySubscriptionTier(db, workspaceId, tierId, { status: "canceled" });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;
      const subId = subRef ? String(subRef) : "";
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      const workspaceId = sub.metadata?.workspaceId || "";
      if (workspaceId) {
        await db.collection("workspaces").doc(workspaceId).update({
          subscriptionStatus: "past_due",
          updatedAt: new Date(),
        });
      }
      break;
    }
    default:
      break;
  }
}
