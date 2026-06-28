/** 教材の「はじめに」リード文（空なら再生画面では非表示） */
export function normalizeIntroText(intro?: string | null): string {
  return intro?.trim() ?? "";
}

export function hasIntroText(intro?: string | null): boolean {
  return normalizeIntroText(intro).length > 0;
}
