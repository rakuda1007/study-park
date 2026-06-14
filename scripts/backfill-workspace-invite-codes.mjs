/**
 * 全 workspaces の inviteCode から workspaceInviteCodes/{code} を再作成する。
 * 古い WS で索引ドキュメントが無いと、学習者参加時にエラーになる場合がある。
 *
 * 使い方:
 *   node scripts/backfill-workspace-invite-codes.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

function initAdmin() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(".env.local に FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY が必要です。");
  }
  privateKey = privateKey.replace(/\\n/g, "\n");
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

loadEnvLocal();
initAdmin();

const db = getFirestore();
const snap = await db.collection("workspaces").get();
let created = 0;
let updated = 0;
let skipped = 0;

for (const docSnap of snap.docs) {
  const data = docSnap.data();
  const code = String(data.inviteCode ?? "").trim().toUpperCase();
  const ownerId = String(data.ownerId ?? "");
  if (!code || code.length < 6) {
    console.warn(`skip ${docSnap.id}: inviteCode なし`);
    skipped += 1;
    continue;
  }
  const ref = db.collection("workspaceInviteCodes").doc(code);
  const existing = await ref.get();
  const payload = { workspaceId: docSnap.id, ownerId };
  if (!existing.exists) {
    await ref.set(payload);
    created += 1;
    console.log(`create ${code} -> ${docSnap.id}`);
  } else if (
    existing.data()?.workspaceId !== docSnap.id ||
    existing.data()?.ownerId !== ownerId
  ) {
    await ref.set(payload);
    updated += 1;
    console.log(`update ${code} -> ${docSnap.id}`);
  } else {
    skipped += 1;
  }
}

console.log(`完了: 新規 ${created} / 更新 ${updated} / 変更なし ${skipped}`);
