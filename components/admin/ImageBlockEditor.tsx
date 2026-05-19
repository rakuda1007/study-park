"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { LessonBlock } from "@/lib/content/types";
import { uploadLessonImage } from "@/lib/firebase/storage";

type ImageBlock = Extract<LessonBlock, { kind: "image" }>;

type Props = {
  contentId: string;
  block: ImageBlock;
  blockIndex: number;
  onChange: (patch: Partial<ImageBlock>) => void;
  onRemove: () => void;
};

export function ImageBlockEditor({
  contentId,
  block,
  blockIndex,
  onChange,
  onRemove,
}: Props) {
  const inputId = useId();
  const pasteRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const uploadFile = useCallback(
    async (file: File | Blob, mime: string) => {
      setUploadErr("");
      setUploading(true);
      try {
        const url = await uploadLessonImage(contentId, file, mime);
        onChange({ src: url });
      } catch (e) {
        setUploadErr(e instanceof Error ? e.message : "アップロードに失敗しました。");
      } finally {
        setUploading(false);
      }
    },
    [contentId, onChange],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFile(file, file.type || "image/png");
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (!item.type.startsWith("image/")) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (file) void uploadFile(file, item.type);
      return;
    }
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
        className="admin-image-paste"
        tabIndex={0}
        onPaste={onPaste}
        role="button"
        aria-label="ここに画像を貼り付け"
      >
        {block.src ? (
          <img src={block.src} alt="" className="admin-image-preview" />
        ) : (
          <p className="admin-image-paste-hint">
            クリップボードから貼り付け（Ctrl+V）
            <br />
            または下のボタンでファイルを選択
          </p>
        )}
        {uploading ? <p className="admin-image-uploading">アップロード中…</p> : null}
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
      <div className="admin-field">
        <label>代替テキスト（任意）</label>
        <input
          value={block.alt ?? ""}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="図の説明（読み上げ用）"
        />
      </div>
      <div className="admin-field">
        <label>キャプション（図の下の説明・任意）</label>
        <input
          value={block.caption ?? ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="例: 高知県の地図"
        />
      </div>
    </div>
  );
}
