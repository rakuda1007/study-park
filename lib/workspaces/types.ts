import type { AppPurchaseStatus, BillingTierId, SubscriptionStatus } from "@/lib/billing/types";

/** 公開範囲（仕様書 §7） */
export type ContentVisibility = "private" | "members" | "unlisted" | "public";

export type WorkspaceDoc = {
  id: string;
  ownerId: string;
  name: string;
  /** URL 用（英小文字・ハイフン） */
  slug: string;
  inviteCode: string;
  planId: BillingTierId;
  subscriptionStatus: SubscriptionStatus;
  storageBytesUsed: number;
  storageBytesLimit: number;
  questionCount: number;
  questionCountLimit: number;
  /** オーナーの買い切り状態のコピー（一覧表示用・ゲート用） */
  appPurchaseStatus: AppPurchaseStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMemberDoc = {
  id: string;
  workspaceId: string;
  userId: string;
  role: "learner";
  status: "active" | "revoked";
  invitedBy: string;
  createdAt: string;
};
