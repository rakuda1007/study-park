"use client";

import { ImageBlockEditor } from "@/components/admin/ImageBlockEditor";
import { RichTextArea } from "@/components/admin/RichTextArea";
import type { LessonBlock } from "@/lib/content/types";
import { templateFromBlocks } from "@/lib/content/quiz-question";

type Props = {
  contentId: string;
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[], template: string) => void;
};

export function QuizQuestionBodyEditor({ contentId, blocks, onChange }: Props) {
  const sync = (next: LessonBlock[]) => {
    onChange(next, templateFromBlocks(next));
  };

  const updateBlock = (index: number, next: LessonBlock) => {
    const copy = [...blocks];
    copy[index] = next;
    sync(copy);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) return;
    sync(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    sync(copy);
  };

  return (
    <div className="admin-lesson-blocks">
      <p className="admin-field-hint" style={{ margin: "0 0 0.75rem", fontSize: "0.85rem" }}>
        問題文（「（①）」で空欄）。太字・サイズ・箇条書きが使えます。段落のほか「＋ 画像」で図を挿入できます。
      </p>
      {blocks.map((block, bi) => (
        <div key={`quiz-block-${bi}`} className="admin-block-wrap">
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
              disabled={bi === blocks.length - 1}
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
                  disabled={blocks.length <= 1}
                >
                  削除
                </button>
              </div>
              <RichTextArea
                label="本文"
                value={block.text}
                onChange={(text) => updateBlock(bi, { kind: "paragraph", text })}
                rows={5}
                previewClass="question-paragraph"
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
        </div>
      ))}

      <div className="admin-row">
        <button
          type="button"
          className="admin-btn"
          onClick={() => sync([...blocks, { kind: "paragraph", text: "" }])}
        >
          ＋ 段落
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={() =>
            sync([...blocks, { kind: "image", src: "", alt: "", caption: "" }])
          }
        >
          ＋ 画像
        </button>
      </div>
    </div>
  );
}
