import type { AdminLoginLockState } from "./login-lock-server";

export type { AdminLoginLockState };
export const ADMIN_LOGIN_MAX_ATTEMPTS = 10;

function usesApiRoute(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_USE_API_ROUTES === "true";
}

function endpoint(): string {
  if (usesApiRoute()) return "/api/admin/login-lock";
  const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION?.trim() || "asia-northeast1";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("Firebase プロジェクト ID が未設定です。");
  return `https://${region}-${projectId}.cloudfunctions.net/adminLoginLock`;
}

async function postLockAction(
  email: string,
  action: "check" | "failure" | "success",
): Promise<AdminLoginLockState | void> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, action }),
  });
  const data = (await res.json()) as AdminLoginLockState & { error?: string };
  if (!res.ok) throw new Error(data.error || "ログイン制限の確認に失敗しました。");
  return data;
}

export async function checkAdminLoginLock(email: string): Promise<AdminLoginLockState> {
  const data = await postLockAction(email, "check");
  return data as AdminLoginLockState;
}

export async function recordAdminLoginFailure(email: string): Promise<AdminLoginLockState> {
  const data = await postLockAction(email, "failure");
  return data as AdminLoginLockState;
}

export async function recordAdminLoginSuccess(email: string): Promise<void> {
  await postLockAction(email, "success");
}

export function formatAdminLoginLockMessage(state: AdminLoginLockState): string {
  if (!state.locked) return "";
  const until = state.lockedUntil
    ? new Date(state.lockedUntil).toLocaleString("ja-JP", { hour12: false })
    : "";
  return `ログイン試行回数が上限（${ADMIN_LOGIN_MAX_ATTEMPTS}回）に達したため、アカウントをロックしました。${until ? `${until} までお待ちください。` : ""}`;
}
