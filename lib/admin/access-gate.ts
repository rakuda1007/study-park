const STORAGE_KEY = "study-park-admin-access-gate";

export type AccessGateSession = {
  token: string;
  expiresAt: number;
};

export function readAccessGateSession(): AccessGateSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessGateSession;
    if (!parsed?.token || typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeAccessGateSession(session: AccessGateSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAccessGateSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isAccessGateSessionValid(): boolean {
  const session = readAccessGateSession();
  return session !== null && Date.now() < session.expiresAt;
}

function adminAccessGateUsesApiRoute(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_USE_API_ROUTES === "true";
}

export function adminAccessGateEndpoint(): string {
  if (adminAccessGateUsesApiRoute()) {
    return "/api/admin/access-gate";
  }
  const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION?.trim() || "asia-northeast1";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("Firebase プロジェクト ID が未設定です。");
  }
  return `https://${region}-${projectId}.cloudfunctions.net/verifyAdminAccessGate`;
}

export async function verifyAdminAccessGate(
  username: string,
  password: string,
): Promise<AccessGateSession> {
  const res = await fetch(adminAccessGateEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json()) as { token?: string; expiresAt?: number; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "管理画面の認証に失敗しました。");
  }
  if (!data.token || typeof data.expiresAt !== "number") {
    throw new Error("認証トークンを取得できませんでした。");
  }
  return { token: data.token, expiresAt: data.expiresAt };
}
