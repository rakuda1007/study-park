/**
 * Firestore に billingTiers（trial / starter / s / m / l）を投入する。
 * 上限値は仕様書 v0.3。Stripe Price ID は運用で追記。
 *
 * 使い方:
 *   node scripts/seed-billing-tiers.mjs
 * Firestore Console へ手動投入する場合は出力 JSON を参照。
 */

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const TIERS = {
  trial: {
    displayName: "お試し",
    monthlyPriceLabel: "¥0",
    storageBytesLimit: 100 * MB,
    questionCountLimit: 80,
    sortOrder: 0,
    active: true,
  },
  starter: {
    displayName: "スターター",
    oneTimePriceLabel: "¥980",
    storageBytesLimit: 100 * MB,
    questionCountLimit: 200,
    sortOrder: 1,
    active: true,
    stripePriceId: "",
  },
  s: {
    displayName: "S",
    monthlyPriceLabel: "¥480",
    storageBytesLimit: 1 * GB,
    questionCountLimit: 500,
    sortOrder: 2,
    active: true,
    stripePriceId: "",
  },
  m: {
    displayName: "M",
    monthlyPriceLabel: "¥980",
    storageBytesLimit: 5 * GB,
    questionCountLimit: 1000,
    sortOrder: 3,
    active: true,
    stripePriceId: "",
  },
  l: {
    displayName: "L",
    monthlyPriceLabel: "¥2,480",
    storageBytesLimit: 20 * GB,
    questionCountLimit: 2000,
    sortOrder: 4,
    active: true,
    stripePriceId: "",
  },
};

console.log(
  "billingTiers ドキュメント例（Firestore Console に billingTiers コレクションとして投入）:\n",
);
console.log(JSON.stringify(TIERS, null, 2));
