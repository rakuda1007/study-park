import { SLUG_PATTERN } from "@/lib/content/types";

/** タイトルから仮スラッグを作る。英数字が取れなければ時刻ベースの文字列にする。 */
export function slugBaseFromTitle(title: string): string {
  const ascii = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48)
    .replace(/-+$/g, "");
  if (SLUG_PATTERN.test(ascii)) return ascii;
  return `item-${Date.now().toString(36)}`;
}

/** 重複時に -2, -3 … を付けた候補 */
export function slugCandidate(base: string, attempt: number): string {
  if (attempt <= 1 && SLUG_PATTERN.test(base)) return base;
  const suffix = `-${Math.max(attempt, 2)}`;
  const trimmed = base.slice(0, Math.max(1, 48 - suffix.length)).replace(/-+$/g, "");
  const candidate = `${trimmed}${suffix}`;
  if (SLUG_PATTERN.test(candidate)) return candidate;
  return `item-${Date.now().toString(36)}`;
}
