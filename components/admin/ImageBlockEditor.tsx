"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { LessonBlock } from "@/lib/content/types";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { readClipboardImageFile } from "@/lib/firebase/prepare-image-upload";
import { uploadLessonImage } from "@/lib/firebase/storage";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

type ImageBlock = Extract<LessonBlock, { kind: "image" }>;

type Props = {
  contentId: string;
  workspaceId?: string;
  workspace?: WorkspaceDoc | null;
  block: ImageBlock;
  blockIndex: number;
  onChange: (patch: Partial<ImageBlock>) => void;
  onRemove: () => void;
};

export function ImageBlockEditor({
  contentId,
  workspaceId,
  workspace,
  block,
  blockIndex,
  onChange,
  onRemove,
}: Props) {
  const inputId = useId();
  const pasteRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const onChangeRef = useRef(onChange);
  const uploadSeqRef = useRef(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const uploadFile = useCallback(
    async (file: File | Blob, mime: string) => {
      if (!contentId.trim()) {
        setUploadErr("コンテンツ ID がありません。ページを再読み込みしてください。");
        return;
      }

      const seq = ++uploadSeqRef.current;
      setUploadErr("");
      setUploading(true);

      try {
        if (workspace) {
          const size = file instanceof File ? file.size : await file.arrayBuffer().then((b) => b.byteLength);
          const usage = checkWorkspaceUsage(workspace, "upload_image", { additionalBytes: size });
          if (!usage.ok) {
            setUploadErr(usage.reason);
            return;
          }
        }
        const url = await uploadLessonImage(contentId, file, mime, workspaceId);
        if (seq !== uploadSeqRef.current) return;
        onChangeRef.current({ src: url });
      } catch (e) {
        if (seq !== uploadSeqRef.current) return;
        setUploadErr(e instanceof Error ? e.message : "アップロードに失敗しました。");
      } finally {
        if (seq === uploadSeqRef.current) {
          setUploading(false);
        }
      }
    },
    [contentId, workspace, workspaceId],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFile(file, file.type || "image/png");
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const dt = e.clipboardData;
    if (!dt) return;

    void (async () => {
      try {
        const file = await readClipboardImageFile(dt);
        if (!file) {
          setUploadErr("クリップボードに画像がありませんでした。");
          return;
        }
        void uploadFile(file, file.type);
      } catch (err) {
        setUploadErr(err instanceof Error ? err.message : "貼り付けに失敗しました。");
      }
    })();
  };

  return (
    <div className="admin-block admin-block--image">
      <div className="admin-row" style={{ justifyContent: "space-between" }}>
        <span className="admin-block-label">画像 {blockIndex + 1}</span>
        <button type="button" className="admin-btn admin-btn--danger" onClick={onRemove}>
          削除
        </button>
      </div>
      <div
        ref={pasteRef}
        className={`admin-image-paste${uploading ? " admin-image-paste--busy" : ""}`}
        tabIndex={0}
        onPaste={onPaste}
        role="button"
        aria-label="ここに画像を貼り付け"
        aria-busy={uploading}
      >
        {uploading ? (
          <p className="admin-image-uploading">アップロード中…</p>
        ) : block.src ? (
          <img src={block.src} alt="" className="admin-image-preview" />
        ) : (
          <p className="admin-image-paste-hint">
            クリップボードから貼り付け（Ctrl+V）
            <br />
            または下のボタンでファイルを選択
          </p>
        )}
      </div>
      {uploadErr ? <p className="admin-msg admin-msg--error">{uploadErr}</p> : null}
      <div className="admin-row">
        <label className="admin-btn" htmlFor={inputId}>
          ファイルを選ぶ
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="admin-sr-only"
          onChange={onFileChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
