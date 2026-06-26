import type { AuthSessionKind } from "@/lib/firebase/auth-client";

export type SessionModeMeta = {
  badge: string;
  shortLabel: string;
  homeStatus: string;
  shellHint: string;
  dashboardLinkLabel: string;
};

export const SESSION_MODE: Record<AuthSessionKind, SessionModeMeta> = {
  admin: {
    badge: "管理者モード",
    shortLabel: "管理者",
    homeStatus: "管理者としてログイン中",
    shellHint: "Study Park 全体の設定とコンテンツを管理できます",
    dashboardLinkLabel: "管理画面へ",
  },
  creator: {
    badge: "クリエイターモード",
    shortLabel: "クリエイター",
    homeStatus: "クリエイターとしてログイン中",
    shellHint: "あなたの教材を作成し、学習者に届けられます",
    dashboardLinkLabel: "クリエイター画面へ",
  },
  learner: {
    badge: "学習モード",
    shortLabel: "学習者",
    homeStatus: "学習中",
    shellHint: "学習計画と進捗を管理し、メニューから教材を選んで学べます",
    dashboardLinkLabel: "学習管理",
  },
};

export function sessionModeMeta(kind: AuthSessionKind): SessionModeMeta {
  return SESSION_MODE[kind];
}
