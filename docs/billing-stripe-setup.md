# Stripe 課金のセットアップ

Study Park のスターター（¥980・1回）と月額（S/M/L）を Stripe Checkout で受け付ける手順です。

## 構成

| 環境 | Checkout 作成 | Webhook |
|------|--------------|---------|
| **ローカル開発**（`npm run dev`） | Next.js API `/api/billing/*` | `/api/billing/webhook` |
| **本番**（Firebase Hosting 静的配信） | Cloud Functions（Callable） | Cloud Functions `stripeWebhook` |

本番は `output: "export"` のため API ルートが含まれません。Functions をデプロイしてください。

## 1. Stripe Dashboard

1. [Stripe Dashboard](https://dashboard.stripe.com/) で商品・Price を作成
   - **スターター**: 1回払い ¥980 → Price ID を控える
   - **S / M / L**: 月額サブスク → 各 Price ID を控える
2. **Webhook** エンドポイントを登録
   - ローカル: Stripe CLI で `stripe listen --forward-to localhost:3000/api/billing/webhook`
   - 本番: `https://asia-northeast1-<PROJECT_ID>.cloudfunctions.net/stripeWebhook`
3. 受信イベント（最低限）:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## 2. 環境変数（`.env.local`）

`.env.example` をコピーして設定します。

### クライアント（公開可）

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_BILLING_USE_API_ROUTES=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_BILLING_USE_API_ROUTES=true` … ローカルで Next API を使う（`npm run dev` 時）

本番では **未設定または false**（Cloud Functions Callable を使用）

### サーバー（秘密・コミットしない）

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...

# Firestore 更新用（ローカル API / Webhook）
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

サービスアカウント鍵は Firebase Console → プロジェクト設定 → サービスアカウント から取得。

### Firestore `billingTiers`

月額 S/M/L の `stripePriceId` を各ドキュメントに設定（`docs/billing-tiers-setup.md` 参照）。

## 3. Cloud Functions のデプロイ（本番）

```bash
cd functions
npm install
npm run build
cd ..

firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Price ID は環境変数として Functions に設定（Firebase Console または secrets）
firebase deploy --only functions
```

クライアント側:

```env
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=asia-northeast1
```

## 4. 動作確認

1. クリエイターでログイン → `/creator/usage`
2. 「スターターに登録（¥980）」→ Stripe Checkout へ遷移
3. テストカードで支払い → `/creator/billing/success`
4. Firestore の `users.appPurchase.status` が `active`、`workspaces.planId` が `starter` になること

## 5. トラブルシュート

| 症状 | 確認 |
|------|------|
| ボタンが出ない | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Checkout 作成失敗 | `STRIPE_SECRET_KEY`、Price ID |
| 支払い後に反映されない | Webhook URL・`STRIPE_WEBHOOK_SECRET`、Functions ログ |
| ローカルで CORS / 401 | ログイン状態・ID トークン |
