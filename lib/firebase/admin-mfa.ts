import {
  getMultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type TotpSecret,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./auth-client";

export function isMultiFactorAuthRequiredError(e: unknown): e is MultiFactorError {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    (e as { code: string }).code === "auth/multi-factor-auth-required"
  );
}

export function adminMfaEnrolled(user: User): boolean {
  return multiFactor(user).enrolledFactors.some(
    (factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID,
  );
}

export async function generateAdminTotpEnrollment(user: User): Promise<{
  secret: TotpSecret;
  qrCodeUrl: string;
}> {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrCodeUrl = secret.generateQrCodeUrl(user.email ?? "admin", "Study Park Admin");
  return { secret, qrCodeUrl };
}

export async function enrollAdminTotpMfa(
  user: User,
  secret: TotpSecret,
  verificationCode: string,
): Promise<void> {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
    secret,
    verificationCode.trim(),
  );
  await multiFactor(user).enroll(assertion, "認証アプリ");
}

export async function resolveAdminTotpMfaSignIn(
  error: MultiFactorError,
  verificationCode: string,
): Promise<User> {
  const resolver = getMultiFactorResolver(getFirebaseAuth(), error);
  const hint = resolver.hints[0];
  if (!hint || hint.factorId !== TotpMultiFactorGenerator.FACTOR_ID) {
    throw new Error("登録済みの認証方式に対応していません。");
  }
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(
    hint.uid,
    verificationCode.trim(),
  );
  const cred = await resolver.resolveSignIn(assertion);
  return cred.user;
}
