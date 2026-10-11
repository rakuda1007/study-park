"use client";

import Link from "next/link";
import type { CreatorPublishMode, CreatorPublishScope } from "@/lib/content/publish-status";
import { workspacePlayHref, workspacePlayPreviewHref } from "@/lib/content/urls";

type Props = {
  publishMode: CreatorPublishMode;
  publishScope: CreatorPublishScope;
  onPublishModeChange: (mode: CreatorPublishMode) => void;
  onPublishScopeChange: (scope: CreatorPublishScope) => void;
  workspaceSlug: string;
  workspaceId: string;
  contentId: string;
  contentSlug: string;
};

export function CreatorContentPublishFields({
  publishMode,
  publishScope,
  onPublishModeChange,
  onPublishScopeChange,
  workspaceSlug,
  workspaceId,
  contentId,
  contentSlug,
}: Props) {
  const previewHref = workspacePlayPreviewHref(
    workspaceSlug,
    workspaceId,
    contentId,
    contentSlug,
  );
  const publicHref = workspacePlayHref(workspaceSlug, contentSlug, workspaceId, contentId);

  return (
    <>
      <label className="admin-checkbox-field">
        <input
          type="checkbox"
          checked={publishMode === "published"}
          onChange={(e) => onPublishModeChange(e.target.checked ? "published" : "draft")}
        />
        <span>公開する</span>
      </label>
      <p className="admin-field-hint" style={{ margin: "0.35rem 0 0" }}>
        チェックしないと、学習者の一覧には出ません。
      </p>
      {publishMode === "published" ? (
        <fieldset className="admin-field admin-radio-field creator-publish-scope">
          <legend>公開範囲</legend>
          <div className="admin-radio-group">
            <label className="admin-radio-option">
              <input
                type="radio"
                name="publish-scope"
                value="members"
                checked={publishScope === "members"}
                onChange={() => onPublishScopeChange("members")}
              />
              <span>学習者のみ（ログイン必須）</span>
            </label>
            <label className="admin-radio-option">
              <input
                type="radio"
                name="publish-scope"
                value="unlisted"
                checked={publishScope === "unlisted"}
                onChange={() => onPublishScopeChange("unlisted")}
              />
              <span>リンクを知っていれば可</span>
            </label>
          </div>
        </fieldset>
      ) : null}

      <div className="creator-publish-links">
        <p className="admin-msg">
          <Link href={previewHref} target="_blank" rel="noopener noreferrer">
            プレビュー（自分だけ）
          </Link>
        </p>
        {publishMode === "published" ? (
          <p className="admin-msg">
            公開 URL:{" "}
            <Link href={publicHref} target="_blank" rel="noopener noreferrer">
              {publicHref}
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
