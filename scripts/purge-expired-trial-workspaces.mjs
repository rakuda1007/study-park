/**
 * お試し満了 + 猶予終了のワークスペースを一覧（削除は --execute 時のみ）。
 *
 * 仕様: trialEndsAt + TRIAL_GRACE_DAYS（60日）経過、appPurchase 未購入
 *
 * 使い方:
 *   node scripts/purge-expired-trial-workspaces.mjs           # dry-run
 *   node scripts/purge-expired-trial-workspaces.mjs --execute # 要 Firebase Admin
 */

const TRIAL_GRACE_DAYS = 60;

function graceDeadline(trialEndsAtIso) {
  const end = new Date(trialEndsAtIso);
  end.setDate(end.getDate() + TRIAL_GRACE_DAYS);
  return end;
}

function isDeletionDue(data, now = new Date()) {
  if (data.appPurchaseStatus === "active") return false;
  const planId = data.planId === "included" ? "trial" : data.planId;
  if (planId !== "trial" && data.accountPhase !== "trial") return false;
  if (!data.trialEndsAt) return false;
  const deadline = graceDeadline(
    typeof data.trialEndsAt === "string"
      ? data.trialEndsAt
      : data.trialEndsAt.toDate?.().toISOString?.() ?? "",
  );
  return now > deadline;
}

console.log(
  JSON.stringify(
    {
      mode: process.argv.includes("--execute") ? "execute" : "dry-run",
      trialGraceDays: TRIAL_GRACE_DAYS,
      note: "Firebase Admin 未接続のため、現状は判定ロジックのドキュメント出力のみ。Cloud Functions 実装時にこの条件を流用してください。",
      exampleDeletionDue: isDeletionDue({
        planId: "trial",
        accountPhase: "trial",
        appPurchaseStatus: "none",
        trialEndsAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    },
    null,
    2,
  ),
);
