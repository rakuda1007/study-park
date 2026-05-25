/**
 * Firestore に billingTiers（included / s / m / l）を投入する。
 * 上限値はここで変更可能。Stripe Price ID は運用で追記。
 *
 * 使い方:
 *   GOOGLE_APPLICATION_CREDENTIALS=... node scripts/seed-billing-tiers.mjs
 * または firebase login 済みの環境で:
 *   npx firebase firestore:delete --all-collections  # は使わない
 *
 * 簡易: Firebase Admin が無い場合は Console から手動投入し、docs/billing-tiers-setup.md を参照。
 */

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const TIERS = {
  included: {
    displayName: "無料枠",
    monthlyPriceLabel: "¥0",
    storageBytesLimit: 100 * MB,
    questionCountLimit: 30,
    sortOrder: 0,
    active: true,
  },
  s: {
    displayName: "S",
    monthlyPriceLabel: "要設定（Stripe）",
    storageBytesLimit: 1 * GB,
    questionCountLimit: 100,
    sortOrder: 1,
    active: true,
    stripePriceId: "",
  },
  m: {
    displayName: "M",
    monthlyPriceLabel: "要設定（Stripe）",
    storageBytesLimit: 5 * GB,
    questionCountLimit: 500,
    sortOrder: 2,
    active: true,
    stripePriceId: "",
  },
  l: {
    displayName: "L",
    monthlyPriceLabel: "要設定（Stripe）",
    storageBytesLimit: 20 * GB,
    questionCountLimit: 2000,
    sortOrder: 3,
    active: true,
    stripePriceId: "",
  },
};

console.log(
  "billingTiers ドキュメント例（Firestore Console に billingTiers コレクションとして投入）:\n",
);
console.log(JSON.stringify(TIERS, null, 2));
