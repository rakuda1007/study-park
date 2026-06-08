import type { UserProfile } from "./types";

/** 利用者一覧などに使う表示名 */
export function formatProfileDisplayName(
  profile: Pick<UserProfile, "familyName" | "givenName" | "displayName"> | null | undefined,
): string {
  if (!profile) return "教材提供者";
  const family = profile.familyName?.trim() ?? "";
  const given = profile.givenName?.trim() ?? "";
  if (family && given) return `${family} ${given}`;
  const display = profile.displayName?.trim();
  return display || "教材提供者";
}
