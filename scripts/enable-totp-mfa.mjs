/**
 * Firebase Authentication で TOTP 多要素認証を有効化する（1回だけ実行）。
 *
 * 前提:
 * 1. Firebase Console → Authentication → 「アップグレードして有効にする」で Identity Platform を有効化
 * 2. .env.local に FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 *
 * 使い方:
 *   node scripts/enable-totp-mfa.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // .env.local が無い場合は process.env のみ
  }
}

loadEnvLocal();

function initAdmin() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY の形式が正しくありません。Firebase Console → サービスアカウント から JSON キーを取得し、private_key を設定してください。",
      );
    }
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
    return;
  }
  throw new Error(
    ".env.local に FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY が必要です。",
  );
}

async function main() {
  initAdmin();
  const auth = getAuth();
  const updated = await auth.projectConfigManager().updateProjectConfig({
    multiFactorConfig: {
      providerConfigs: [
        {
          state: "ENABLED",
          totpProviderConfig: {
            adjacentIntervals: 5,
          },
        },
      ],
    },
  });
  console.log("TOTP 多要素認証を有効化しました。");
  console.log(JSON.stringify(updated.multiFactorConfig ?? {}, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
