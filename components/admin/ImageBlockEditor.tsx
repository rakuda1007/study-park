"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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
        const url = await uploadLessonImage(contentId, file, mime);
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
    [contentId],
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
