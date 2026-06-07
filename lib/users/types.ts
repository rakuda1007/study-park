import type { AppPurchaseStatus } from "@/lib/billing/types";

export type UserRole = "creator" | "learner";

export type UserProfile = {
  uid: string;
  email: string;
  /** 姓 */
  familyName?: string;
  /** 名 */
  givenName?: string;
  displayName?: string;
  role: UserRole;
  appPurchase: {
    status: AppPurchaseStatus;
    purchasedAt?: string;
    provider?: string;
    paymentId?: string;
  };
  createdAt: string;
  updatedAt: string;
};
