# 課金ティア（billingTiers）の設定

## Stripe について

**月額料金は Stripe Dashboard で Price を作成し、Firestore に ID を書き込む**運用が可能です。アプリ側の `lib/billing/tiers.ts` はフォールバック用のデフォルト値です。

| 環境変数（将来 Checkout 用） | 用途 |
|------------------------------|------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | クライアント |
| `NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID` | 買い切り Price |
| （各ティア）`billingTiers/{id}.stripePriceId` | 月額 S / M / L |

## Firestore `billingTiers/{tierId}`

ドキュメント ID: `included` | `s` | `m` | `l`

| フィールド | 型 | 説明 |
|------------|-----|------|
| `displayName` | string | 表示名 |
| `monthlyPriceLabel` | string | 画面表示用（例: ¥800） |
| `storageBytesLimit` | number | バイト単位の上限（**可変**） |
| `questionCountLimit` | number | 登録問題数上限（**可変**） |
| `sortOrder` | number | 一覧の並び |
| `stripePriceId` | string? | Stripe Price ID（未設定可） |
| `active` | boolean | 無効化時 false |

投入例は `node scripts/seed-billing-tiers.mjs` の出力を参照。

## ワークスペースへの反映

新規ワークスペース作成時は `included` の上限がコピーされます。プラン変更時は `applyBillingTierToWorkspace`（将来 Stripe Webhook から）で `storageBytesLimit` / `questionCountLimit` を更新します。
