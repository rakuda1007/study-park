/** AdSense スロット種別（環境変数で ID を紐づけ） */
export type AdSenseSlotKey = "creator_edit" | "quiz_finish";

const SLOT_ENV: Record<AdSenseSlotKey, string> = {
  creator_edit: "NEXT_PUBLIC_ADSENSE_SLOT_CREATOR_EDIT",
  quiz_finish: "NEXT_PUBLIC_ADSENSE_SLOT_QUIZ_FINISH",
};

/** スロット ID はページソースに露出するため、Secrets 未設定時のフォールバック */
const DEFAULT_SLOTS: Record<AdSenseSlotKey, string> = {
  creator_edit: "9526417095",
  quiz_finish: "7447048663",
};

export function getAdSenseClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  return id || null;
}

export function getAdSenseSlot(key: AdSenseSlotKey): string | null {
  const envName = SLOT_ENV[key];
  const id = process.env[envName]?.trim();
  return id || DEFAULT_SLOTS[key] || null;
}

export function isAdSenseConfigured(key: AdSenseSlotKey): boolean {
  return Boolean(getAdSenseClientId() && getAdSenseSlot(key));
}
