# 課金運用バッチ（Phase 6）

お試し満了通知・削除・課金状態の整合を Cloud Functions のスケジュールで実行します。

## スケジュール Functions

| Function | 時刻 (JST) | 内容 |
|----------|------------|------|
| `billingTrialNotifications` | 毎日 9:00 | 満了 90/30/7 日前、猶予開始、削除 7/1 日前のメール |
| `billingPurgeExpiredTrials` | 毎日 3:00 | 猶予終了 WS の削除（Firestore・関連インデックス） |
| `billingReconcile` | 毎日 4:00 | `included`→`trial`、購入同期、問題数再集計、Stripe 照合 |

## メール送信（任意）

`RESEND_API_KEY` 未設定時は **ログ出力のみ**（送信済みとして記録）。

| 変数 | 説明 |
|------|------|
| `RESEND_API_KEY` | [Resend](https://resend.com) API キー |
| `BILLING_MAIL_FROM` | 送信元（例: `Study Park <noreply@example.com>`） |

通知の重複防止: `workspaces/{wsId}/billingNotifications/{type}`

## ローカル dry-run

```bash
# .env.local の Firebase Admin を読み込んでから
node scripts/purge-expired-trial-workspaces.mjs
node scripts/purge-expired-trial-workspaces.mjs --execute  # 実削除
```

Storage オブジェクトの削除は Functions 本番（`billingPurgeExpiredTrials`）で行います。ローカルスクリプトは Firestore のみ。

## デプロイ

```bash
cd functions && npm run build
firebase deploy --only functions:billingTrialNotifications,functions:billingPurgeExpiredTrials,functions:billingReconcile
```

`billingReconcile` は `STRIPE_SECRET_KEY` シークレットが必要です（既存 Checkout / Webhook と同じ）。

## 関連

- [課金仕様](./spec-multitenant-auth-billing.md) §3.5 削除ポリシー
- [Stripe セットアップ](./billing-stripe-setup.md)
