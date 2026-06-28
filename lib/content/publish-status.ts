import type { ContentStatus } from "@/lib/content/types";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import type { ContentVisibility } from "@/lib/workspaces/types";

/** クリエイター UI 向けの公開状態（3値） */
export type CreatorPublishMode = "draft" | "published" | "archived";

/** 公開時の公開範囲（クリエイター向けに members / unlisted のみ） */
export type CreatorPublishScope = "members" | "unlisted";

export type ContentPublishBadgeInfo = {
  label: string;
  className: string;
};

const BADGE_DRAFT: ContentPublishBadgeInfo = {
  label: "下書き",
  className: "admin-badge content-publish-badge content-publish-badge--draft",
};

const BADGE_PUBLISHED: ContentPublishBadgeInfo = {
  label: "公開中",
  className: "admin-badge content-publish-badge admin-badge--published",
};

const BADGE_ARCHIVED: ContentPublishBadgeInfo = {
  label: "アーカイブ",
  className: "admin-badge content-publish-badge content-publish-badge--archived",
};

export function isMemberVisibleVisibility(visibility: ContentVisibility): boolean {
  return visibility === "members" || visibility === "unlisted" || visibility === "public";
}

export function contentToPublishMode(content: Pick<WorkspaceContentDoc, "status" | "visibility">): CreatorPublishMode {
  if (content.status === "archived") return "archived";
  if (content.status === "published" && isMemberVisibleVisibility(content.visibility)) {
    return "published";
  }
  return "draft";
}

export function contentToPublishScope(
  content: Pick<WorkspaceContentDoc, "visibility">,
): CreatorPublishScope {
  return content.visibility === "unlisted" ? "unlisted" : "members";
}

export function publishBadgeInfo(status: ContentStatus): ContentPublishBadgeInfo {
  if (status === "published") return BADGE_PUBLISHED;
  if (status === "archived") return BADGE_ARCHIVED;
  return BADGE_DRAFT;
}

export function publishFieldsFromMode(
  mode: CreatorPublishMode,
  scope: CreatorPublishScope,
): {
  status: ContentStatus;
  ready: boolean;
  visibility: ContentVisibility;
} {
  if (mode === "archived") {
    return { status: "archived", ready: false, visibility: "members" };
  }
  if (mode === "published") {
    return { status: "published", ready: true, visibility: scope };
  }
  return { status: "draft", ready: false, visibility: "members" };
}
