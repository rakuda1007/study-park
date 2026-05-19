"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { LessonBlock, LessonSection } from "@/lib/content/types";
import { uploadLessonImage } from "@/lib/firebase/storage";

type Props = {
  contentId: string;
  section: LessonSection;
  onChange: (section: LessonSection) => void;
};

function ImageBlockEditor({
  contentId,
  block,
  blockIndex,
  onChange,
  onRemove,
}: {
  contentId: string;
  block: Extract<LessonBlock, { kind: "image" }>;
  blockIndex: number;
  onChange: (patch: Partial<Extract<LessonBlock, { kind: "image" }>>) => void;
  onRemove: () => void;
}) {
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
      if (file) void uploadFile(file, file.type);
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
        <label>キャプション（図の下の説明）</label>
        <input
          value={block.caption ?? ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="例: ㋐・㋑・㋒は内角、㋓は外角"
        />
      </div>
    </div>
  );
}

export function LessonSectionEditor({ contentId, section, onChange }: Props) {
  const updateBlocks = (blocks: LessonBlock[]) => {
    onChange({ ...section, blocks });
  };

  const updateBlock = (index: number, next: LessonBlock) => {
    const blocks = [...section.blocks];
    blocks[index] = next;
    updateBlocks(blocks);
  };

  const removeBlock = (index: number) => {
    updateBlocks(section.blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= section.blocks.length) return;
    const blocks = [...section.blocks];
    [blocks[index], blocks[j]] = [blocks[j], blocks[index]];
    updateBlocks(blocks);
  };

  const addParagraph = () => {
    updateBlocks([...section.blocks, { kind: "paragraph", text: "" }]);
  };

  const addImage = () => {
    updateBlocks([
      ...section.blocks,
      { kind: "image", src: "", alt: "", caption: "" },
    ]);
  };

  return (
    <div className="admin-lesson-blocks">
      {section.blocks.length === 0 ? (
        <p style={{ color: "var(--admin-muted)", fontSize: "0.85rem" }}>
          段落または画像ブロックを追加してください。
        </p>
      ) : null}

      {section.blocks.map((block, bi) => (
        <div key={`${section.id}-block-${bi}`} className="admin-block-wrap">
          <div className="admin-block-toolbar">
            <button
              type="button"
              className="admin-btn"
              disabled={bi === 0}
              onClick={() => moveBlock(bi, -1)}
              aria-label="上へ"
            >
              ↑
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={bi === section.blocks.length - 1}
              onClick={() => moveBlock(bi, 1)}
              aria-label="下へ"
            >
              ↓
            </button>
          </div>

          {block.kind === "paragraph" ? (
            <div className="admin-block">
              <div className="admin-row" style={{ justifyContent: "space-between" }}>
                <span className="admin-block-label">段落 {bi + 1}</span>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => removeBlock(bi)}
                >
                  削除
                </button>
              </div>
              <div className="admin-field">
                <label>本文（**太字** が使えます）</label>
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(bi, { kind: "paragraph", text: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          {block.kind === "image" ? (
            <ImageBlockEditor
              contentId={contentId}
              block={block}
              blockIndex={bi}
              onChange={(patch) => updateBlock(bi, { ...block, ...patch })}
              onRemove={() => removeBlock(bi)}
            />
          ) : null}

          {block.kind === "html" ? (
            <div className="admin-block">
              <p className="admin-block-label">HTML ブロック（読み取り専用）</p>
              <p style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>
                静的ページ由来の HTML です。管理画面では編集できません。
              </p>
            </div>
          ) : null}
        </div>
      ))}

      <div className="admin-row">
        <button type="button" className="admin-btn" onClick={addParagraph}>
          ＋ 段落
        </button>
        <button type="button" className="admin-btn" onClick={addImage}>
          ＋ 画像
        </button>
      </div>
    </div>
  );
}
