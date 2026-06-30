import type { ShellMenuItem } from "@/components/shell/ShellHamburgerMenu";
import { MANUAL_MENU_ITEM } from "@/components/shell/manual-menu-item";
import { PORTAL_MENU_ITEM } from "@/components/shell/portal-menu-item";
import type { AuthSessionKind } from "@/lib/firebase/auth-client";

export type ShellMenuConfig = {
  items: ShellMenuItem[];
  bottomItems: ShellMenuItem[];
};

const LOGGED_IN_BOTTOM: ShellMenuItem[] = [
  { label: "プロフィール", href: "" },
  { label: "別のアカウントでログイン", href: "/login" },
  { label: "ログアウト", action: "logout" },
];

function profilePath(session: AuthSessionKind): string {
  switch (session) {
    case "admin":
      return "/admin/profile";
    case "creator":
      return "/creator/profile";
    case "learner":
      return "/learner/profile";
  }
}

function loggedInBottom(session: AuthSessionKind): ShellMenuItem[] {
  return LOGGED_IN_BOTTOM.map((item) =>
    item.label === "プロフィール" ? { ...item, href: profilePath(session) } : item,
  );
}

export function getGuestShellMenu(): ShellMenuConfig {
  return {
    items: [
      { label: "ログイン", href: "/login" },
      { label: "学習者登録", href: "/signup/learner" },
      { label: "教材を作る", href: "/signup/creator" },
      PORTAL_MENU_ITEM,
      { ...MANUAL_MENU_ITEM, dividerBefore: true },
    ],
    bottomItems: [],
  };
}

export function getLoggedInShellMenu(session: AuthSessionKind): ShellMenuConfig {
  switch (session) {
    case "learner":
      return {
        items: [
          { label: "学習管理", href: "/learner" },
          { label: "教材", href: "/learner/materials" },
          { ...MANUAL_MENU_ITEM, dividerBefore: true },
        ],
        bottomItems: loggedInBottom(session),
      };
    case "creator":
      return {
        items: [
          { label: "学習者招待", href: "/creator/learners" },
          { label: "ご利用プランと利用状況", href: "/creator/usage" },
          {
            label: "教材の確認",
            href: "/learner/materials",
            hint: "学習者と同じ画面で教材を確認できます",
          },
          {
            label: "教科マスタ",
            href: "/creator/subjects",
            dividerBefore: true,
          },
          MANUAL_MENU_ITEM,
        ],
        bottomItems: loggedInBottom(session),
      };
    case "admin":
      return {
        items: [
          { label: "コンテンツ一覧", href: "/admin/contents" },
          { label: "教科マスタ", href: "/admin/subjects" },
          { label: "利用者一覧", href: "/admin/users" },
          { label: "学習管理の運用", href: "/admin/study-ops" },
          { label: "教材", href: "/learner/materials" },
          { ...MANUAL_MENU_ITEM, dividerBefore: true },
        ],
        bottomItems: loggedInBottom(session),
      };
  }
}

export function getShellMenu(session: AuthSessionKind | null): ShellMenuConfig {
  if (!session) return getGuestShellMenu();
  return getLoggedInShellMenu(session);
}
