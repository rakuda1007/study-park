import { createHmac, timingSafeEqual } from "crypto";

const GATE_TTL_MS = 12 * 60 * 60 * 1000;

function gateSigningSecret(): string {
  const secret = process.env.ADMIN_GATE_PASSWORD?.trim();
  if (!secret) {
    throw new Error("ADMIN_GATE_PASSWORD が設定されていません。");
  }
  return secret;
}

function expectedUsername(): string {
  return process.env.ADMIN_GATE_USERNAME?.trim() || "study-park-admin";
}

export function issueAdminAccessGateToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + GATE_TTL_MS;
  const payload = String(expiresAt);
  const sig = createHmac("sha256", gateSigningSecret()).update(payload).digest("base64url");
  return { token: `${payload}.${sig}`, expiresAt };
}

export function verifyAdminAccessGateCredentials(username: string, password: string): boolean {
  const expectedUser = expectedUsername();
  const expectedPass = gateSigningSecret();
  const userOk = timingSafeEqualString(username.trim(), expectedUser);
  const passOk = timingSafeEqualString(password, expectedPass);
  return userOk && passOk;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
