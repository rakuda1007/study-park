"use client";

import { ImageBlockEditor } from "@/components/admin/ImageBlockEditor";
import { RichTextArea } from "@/components/admin/RichTextArea";
import type { LessonBlock, LessonSection } from "@/lib/content/types";

type Props = {
  contentId: string;
  section: LessonSection;
  onChange: (section: LessonSection) => void;
};

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
              <RichTextArea
                label="本文"
                value={block.text}
                onChange={(text) => updateBlock(bi, { kind: "paragraph", text })}
                rows={4}
              />
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
