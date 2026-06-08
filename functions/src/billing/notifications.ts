import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { DELETION_NOTIFY_DAYS, TRIAL_NOTIFY_DAYS } from "./constants";
import { billingSiteUrl } from "./config";
import { sendBillingMail } from "./mail";
import { getTrialLifecycle, isTrialWorkspace } from "./trial-lifecycle";

export type TrialNotificationType =
  | "trial_90d"
  | "trial_30d"
  | "trial_7d"
  | "trial_expired"
  | "deletion_7d"
  | "deletion_1d";

type NotificationTemplate = {
  subject: string;
  body: (ctx: { workspaceName: string; days: number }) => string;
};

const TEMPLATES: Record<TrialNotificationType, NotificationTemplate> = {
  trial_90d: {
    subject: "【Study Park】お試し期間の残り約90日です",
    body: ({ workspaceName, days }) =>
      `${workspaceName} のお試し期間が残り約 ${days} 日です。\n\nスターター（¥980）に登録すると、200問・100MBまで期限なくご利用いただけます。\n\n${billingSiteUrl("/creator/usage")}`,
  },
  trial_30d: {
    subject: "【Study Park】お試し期間の残り約30日です（重要）",
    body: ({ workspaceName, days }) =>
      `${workspaceName} のお試し期間が残り約 ${days} 日です。\n\n期間終了後は編集・新規追加ができなくなります。スターター（¥980）への登録をご検討ください。\n\n${billingSiteUrl("/creator/usage")}`,
  },
  trial_7d: {
    subject: "【Study Park】お試し期間の残り約7日です",
    body: ({ workspaceName, days }) =>
      `${workspaceName} のお試し期間が残り約 ${days} 日です。\n\nお試し終了後、スターター未登録の場合はデータが削除される可能性があります（事前にお知らせします）。\n\n${billingSiteUrl("/creator/usage")}`,
  },
  trial_expired: {
    subject: "【Study Park】お試し期間が終了しました",
    body: ({ workspaceName }) =>
      `${workspaceName} のお試し期間が終了しました。\n\n現在は閲覧のみ可能です。スターター（¥980）に登録すると、引き続き編集・追加ができます。\n\n${billingSiteUrl("/creator/usage")}`,
  },
  deletion_7d: {
    subject: "【Study Park】データ削除まで残り約7日です",
    body: ({ workspaceName, days }) =>
      `${workspaceName} のデータは、あと約 ${days} 日で削除されます。\n\nスターター（¥980）に登録すると削除を回避できます。\n\n${billingSiteUrl("/creator/usage")}`,
  },
  deletion_1d: {
    subject: "【Study Park】明日、ワークスペースが削除されます",
    body: ({ workspaceName }) =>
      `${workspaceName} は明日削除予定です。\n\nスターター（¥980）に今すぐ登録してください。\n\n${billingSiteUrl("/creator/usage")}`,
  },
};

function notificationRef(db: Firestore, workspaceId: string, type: TrialNotificationType) {
  return db.collection("workspaces").doc(workspaceId).collection("billingNotifications").doc(type);
}

async function wasNotificationSent(
  db: Firestore,
  workspaceId: string,
  type: TrialNotificationType,
): Promise<boolean> {
  const snap = await notificationRef(db, workspaceId, type).get();
  return snap.exists;
}

async function markNotificationSent(
  db: Firestore,
  workspaceId: string,
  type: TrialNotificationType,
  email: string,
): Promise<void> {
  await notificationRef(db, workspaceId, type).set({
    type,
    email,
    sentAt: FieldValue.serverTimestamp(),
  });
}

function resolveDueNotifications(
  lifecycle: ReturnType<typeof getTrialLifecycle>,
  now: Date,
): Array<{ type: TrialNotificationType; days: number }> {
  const due: Array<{ type: TrialNotificationType; days: number }> = [];

  if (lifecycle.phase === "active" && lifecycle.trialDaysRemaining != null) {
    const d = lifecycle.trialDaysRemaining;
    if (d === TRIAL_NOTIFY_DAYS[0]) due.push({ type: "trial_90d", days: d });
    if (d === TRIAL_NOTIFY_DAYS[1]) due.push({ type: "trial_30d", days: d });
    if (d === TRIAL_NOTIFY_DAYS[2]) due.push({ type: "trial_7d", days: d });
  }

  if (lifecycle.phase === "grace" && lifecycle.trialEnd) {
    const daysSinceTrialEnd = Math.ceil(
      (now.getTime() - lifecycle.trialEnd.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceTrialEnd <= 1) {
      due.push({ type: "trial_expired", days: 0 });
    }
    if (lifecycle.graceDaysRemaining === DELETION_NOTIFY_DAYS[0]) {
      due.push({ type: "deletion_7d", days: lifecycle.graceDaysRemaining });
    }
    if (lifecycle.graceDaysRemaining === DELETION_NOTIFY_DAYS[1]) {
      due.push({ type: "deletion_1d", days: lifecycle.graceDaysRemaining });
    }
  }

  return due;
}

export async function processTrialNotifications(
  db: Firestore,
  opts?: { now?: Date; dryRun?: boolean },
): Promise<{ scanned: number; sent: number; skipped: number; errors: string[] }> {
  const now = opts?.now ?? new Date();
  const dryRun = opts?.dryRun ?? false;
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  const snap = await db.collection("workspaces").get();

  for (const wsDoc of snap.docs) {
    const data = wsDoc.data();
    if (!isTrialWorkspace(data)) continue;

    const lifecycle = getTrialLifecycle(data, now);
    const due = resolveDueNotifications(lifecycle, now);
    if (!due.length) continue;

    const ownerId = String(data.ownerId ?? "");
    if (!ownerId) continue;

    const ownerSnap = await db.collection("users").doc(ownerId).get();
    const email = String(ownerSnap.data()?.email ?? "").trim();
    if (!email) {
      skipped += due.length;
      continue;
    }

    const workspaceName = String(data.name ?? "ワークスペース");

    for (const item of due) {
      if (await wasNotificationSent(db, wsDoc.id, item.type)) {
        skipped += 1;
        continue;
      }

      const template = TEMPLATES[item.type];
      const text = template.body({ workspaceName, days: item.days });

      if (dryRun) {
        console.info("[trial-notify:dry-run]", { workspaceId: wsDoc.id, type: item.type, email });
        sent += 1;
        continue;
      }

      try {
        await sendBillingMail({ to: email, subject: template.subject, text });
        await markNotificationSent(db, wsDoc.id, item.type, email);
        sent += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${wsDoc.id}/${item.type}: ${msg}`);
      }
    }
  }

  return { scanned: snap.size, sent, skipped, errors };
}
