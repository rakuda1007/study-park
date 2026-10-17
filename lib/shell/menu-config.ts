import type { ShellMenuItem } from "@/components/shell/ShellHamburgerMenu";
import { MANUAL_MENU_ITEM } from "@/components/shell/manual-menu-item";
import { PARK_MENU_ITEM, PORTAL_MENU_ITEM } from "@/components/shell/portal-menu-item";
import type { AuthSessionKind } from "@/lib/firebase/auth-client";

export type ShellMenuConfig = {
  items: ShellMenuItem[];
  bottomItems: ShellMenuItem[];
};

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

export function getGuestShellMenu(): ShellMenuConfig {
  return {
    items: [
      { label: "はじめる", heading: true },
      {
        label: "学習管理をはじめる",
        href: "/signup/learner",
        hint: "計画と進捗を記録する",
      },
      {
        label: "問題を作って配る",
        href: "/signup/creator",
        hint: "作った問題を学習者に届ける",
      },
      { label: "試す", heading: true },
      {
        ...PARK_MENU_ITEM,
        label: "無料コンテンツ",
        hint: "九九・県庁所在地など",
      },
      { label: "案内", heading: true },
      {
        ...MANUAL_MENU_ITEM,
        label: "使い方",
        hint: "別ページのガイドを開きます",
      },
      {
        ...PORTAL_MENU_ITEM,
        hint: "学習管理・出題・問題づくり",
      },
    ],
    bottomItems: [
      { label: "アカウント", heading: true },
      { label: "ログイン", href: "/login" },
    ],
  };
}

export function getLoggedInShellMenu(session: AuthSessionKind): ShellMenuConfig {
  switch (session) {
    case "learner":
      return {
        items: [
          { label: "学習", heading: true },
          { label: "学習管理", href: "/learner" },
          { label: "教材", href: "/learner/materials" },
          { label: "案内", heading: true },
          {
            ...PARK_MENU_ITEM,
            label: "無料コンテンツ",
            hint: "九九・県庁所在地など",
          },
          {
            ...MANUAL_MENU_ITEM,
            label: "使い方",
            hint: "別ページのガイドを開きます",
          },
          PORTAL_MENU_ITEM,
        ],
        bottomItems: [
          { label: "アカウント", heading: true },
          { label: "プロフィール", href: profilePath(session) },
          { label: "アカウントを切り替える", href: "/login" },
          { label: "ログアウト", action: "logout" },
        ],
      };
    case "creator":
      return {
        items: [
          { label: "教材", heading: true },
          { label: "教材一覧", href: "/creator" },
          { label: "教材を新規作成", href: "/creator/contents/new" },
          { label: "教科", href: "/creator/subjects" },
          {
            label: "招待",
            href: "/creator/learners",
            hint: "学習者を教材に招く",
          },
          { label: "学習", heading: true },
          { label: "学習管理", href: "/learner" },
          {
            label: "学習者の画面",
            href: "/learner/materials",
            hint: "参加中の教材の見え方",
          },
          { label: "案内", heading: true },
          {
            ...MANUAL_MENU_ITEM,
            label: "使い方",
            hint: "別ページのガイドを開きます",
          },
        ],
        bottomItems: [
          { label: "アカウント", heading: true },
          { label: "プロフィール", href: profilePath(session) },
          { label: "プランと利用状況", href: "/creator/usage" },
          { label: "アカウントを切り替える", href: "/login" },
          { label: "ログアウト", action: "logout" },
        ],
      };
    case "admin":
      return {
        items: [
          { label: "公式コンテンツ", heading: true },
          {
            label: "コンテンツ一覧",
            href: "/admin/contents",
            hint: "公園に出す問題・レッスン",
          },
          {
            label: "教科",
            href: "/admin/subjects",
            hint: "公式コンテンツの教科",
          },
          { label: "利用者", heading: true },
          {
            label: "利用者",
            href: "/admin/users",
            hint: "登録数と参加者",
          },
          {
            label: "学習管理の運用",
            href: "/admin/study-ops",
            hint: "進行中の上限とアーカイブ",
          },
          { label: "見え方", heading: true },
          {
            label: "学習者の画面",
            href: "/learner/materials",
            hint: "参加中の教材の見え方",
          },
          {
            ...PARK_MENU_ITEM,
            label: "無料コンテンツ",
            hint: "九九・県庁所在地など",
          },
          { label: "案内", heading: true },
          {
            ...MANUAL_MENU_ITEM,
            label: "使い方",
            hint: "別ページのガイドを開きます",
          },
          PORTAL_MENU_ITEM,
        ],
        bottomItems: [
          { label: "アカウント", heading: true },
          { label: "プロフィール", href: profilePath(session) },
          { label: "アカウントを切り替える", href: "/login" },
          { label: "ログアウト", action: "logout" },
        ],
      };
  }
}

export function getShellMenu(session: AuthSessionKind | null): ShellMenuConfig {
  if (!session) return getGuestShellMenu();
  return getLoggedInShellMenu(session);
}
