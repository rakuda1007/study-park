# 課金ティア（billingTiers）の設定

## Stripe について

**スターター（1回払い）と月額は Stripe Dashboard で Price を作成し、環境変数または Firestore に ID を書き込む**運用が可能です。アプリ側の `lib/billing/tiers.ts` はフォールバック用のデフォルト値です。

| 環境変数（将来 Checkout 用） | 用途 |
|------------------------------|------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | クライアント |
| `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` | スターター（¥980・1回）Price |
| （各ティア）`billingTiers/{id}.stripePriceId` | 月額 S / M / L |

※ 旧 `NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID` はスターター用に読み替え予定。

## Firestore `billingTiers/{tierId}`

ドキュメント ID: `trial` | `starter` | `s` | `m` | `l`

| フィールド | 型 | 説明 |
|------------|-----|------|
| `displayName` | string | 表示名 |
| `monthlyPriceLabel` | string? | 月額表示用（S/M/L。例: ¥480） |
| `oneTimePriceLabel` | string? | 1回払い表示用（スターター。例: ¥980） |
| `storageBytesLimit` | number | バイト単位の上限 |
| `questionCountLimit` | number | 登録問題数上限 |
| `sortOrder` | number | 一覧の並び |
| `stripePriceId` | string? | Stripe Price ID（スターター・月額） |
| `active` | boolean | 無効化時 false |

### 確定値（v0.3）

| tierId | 表示名 | 価格 | 問題数 | ストレージ |
|--------|--------|------|--------|-----------|
| `trial` | お試し | ¥0 | 80 | 100 MB |
| `starter` | スターター | ¥980（1回） | 200 | 100 MB |
| `s` | S | ¥480/月 | 500 | 1 GB |
| `m` | M | ¥980/月 | 1,000 | 5 GB |
| `l` | L | ¥2,480/月 | 2,000 | 20 GB |

投入例は `node scripts/seed-billing-tiers.mjs` の出力を参照。

## ワークスペースへの反映

- 新規 WS 作成時: `trial` の上限をコピーし、`trialEndsAt` = 作成日 + 2年
- スターター購入時: `starter` の上限を適用、`trialEndsAt` = null、`planId` = `starter`
- 月額契約時: `applyBillingTierToWorkspace`（Stripe Webhook から）で S/M/L の上限を更新

## 後方互換

既存データの `planId: "included"` は読み取り時に `trial` として扱う（マイグレーション予定）。
