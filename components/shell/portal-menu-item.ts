import type { ShellMenuItem } from "@/components/shell/ShellHamburgerMenu";

/** 三線メニュー共通 — 公園トップ（無料コンテンツ） */
export const PARK_MENU_ITEM: ShellMenuItem = {
  label: "無料コンテンツ（公園）",
  href: "/?park=1",
  title: "登録なしで試せる公式コンテンツへ",
};

/** 三線メニュー共通 — Study Park ポータル（サービス紹介） */
export const PORTAL_MENU_ITEM: ShellMenuItem = {
  label: "機能紹介",
  href: "/portal",
  title: "学習管理・出題・問題づくりの紹介",
};
