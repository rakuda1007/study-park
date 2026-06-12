import { getAdminFirestore } from "../billing/firestore-admin";

export const ADMIN_LOGIN_MAX_ATTEMPTS = 10;
const LOCK_DURATION_MS = 30 * 60 * 1000;

export type AdminLoginLockState = {
  locked: boolean;
  failCount: number;
  remainingAttempts: number;
  lockedUntil: number | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function docId(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9@._+-]/g, "_");
}

function toState(data: FirebaseFirestore.DocumentData | undefined): AdminLoginLockState {
  const failCount = Number(data?.failCount ?? 0);
  const lockedUntilMs = data?.lockedUntil?.toMillis?.() ?? null;
  const locked = lockedUntilMs !== null && lockedUntilMs > Date.now();
  return {
    locked,
    failCount: locked ? failCount : failCount,
    remainingAttempts: locked ? 0 : Math.max(0, ADMIN_LOGIN_MAX_ATTEMPTS - failCount),
    lockedUntil: locked ? lockedUntilMs : null,
  };
}

export async function getAdminLoginLockState(email: string): Promise<AdminLoginLockState> {
  const db = getAdminFirestore();
  const snap = await db.collection("adminLoginLocks").doc(docId(email)).get();
  const state = toState(snap.data());
  if (!state.locked && state.failCount >= ADMIN_LOGIN_MAX_ATTEMPTS) {
    await db.collection("adminLoginLocks").doc(docId(email)).set(
      { failCount: 0, lockedUntil: null, updatedAt: new Date() },
      { merge: true },
    );
    return {
      locked: false,
      failCount: 0,
      remainingAttempts: ADMIN_LOGIN_MAX_ATTEMPTS,
      lockedUntil: null,
    };
  }
  return state;
}

export async function recordAdminLoginFailure(email: string): Promise<AdminLoginLockState> {
  const db = getAdminFirestore();
  const ref = db.collection("adminLoginLocks").doc(docId(email));
  const snap = await ref.get();
  const current = toState(snap.data());
  if (current.locked) return current;

  const failCount = current.failCount + 1;
  const locked = failCount >= ADMIN_LOGIN_MAX_ATTEMPTS;
  const lockedUntil = locked ? new Date(Date.now() + LOCK_DURATION_MS) : null;
  await ref.set(
    {
      email: normalizeEmail(email),
      failCount,
      lockedUntil,
      updatedAt: new Date(),
    },
    { merge: true },
  );
  return {
    locked,
    failCount,
    remainingAttempts: locked ? 0 : Math.max(0, ADMIN_LOGIN_MAX_ATTEMPTS - failCount),
    lockedUntil: lockedUntil?.getTime() ?? null,
  };
}

export async function recordAdminLoginSuccess(email: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("adminLoginLocks").doc(docId(email)).set(
    {
      email: normalizeEmail(email),
      failCount: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

export function formatAdminLoginLockMessage(state: AdminLoginLockState): string {
  if (!state.locked) return "";
  const until = state.lockedUntil
    ? new Date(state.lockedUntil).toLocaleString("ja-JP", { hour12: false })
    : "";
  return `ログイン試行回数が上限（${ADMIN_LOGIN_MAX_ATTEMPTS}回）に達したため、アカウントをロックしました。${until ? `${until} までお待ちください。` : ""}`;
}
