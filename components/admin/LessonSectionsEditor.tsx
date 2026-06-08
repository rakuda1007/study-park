"use client";

import { LessonSectionEditor } from "@/components/admin/LessonSectionEditor";
import {
  createLessonSection,
  insertLessonSection,
  moveLessonSection,
} from "@/lib/content/lesson-section";
import type { LessonSection } from "@/lib/content/types";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

type Props = {
  contentId: string;
  workspaceId?: string;
  workspace?: WorkspaceDoc | null;
  sections: LessonSection[];
  onChange: (sections: LessonSection[]) => void;
};

export function LessonSectionsEditor({
  contentId,
  workspaceId,
  workspace,
  sections,
  onChange,
}: Props) {
  const updateSection = (index: number, patch: Partial<LessonSection>) => {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSection = (index: number) => {
    const sec = sections[index];
    const label = sec?.heading?.trim() || `セクション ${index + 1}`;
    if (!confirm(`「${label}」を削除しますか？`)) return;
    onChange(sections.filter((_, i) => i !== index));
  };

  const insertAfter = (index: number) => {
    onChange(insertLessonSection(sections, index + 1));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    onChange(moveLessonSection(sections, index, direction));
  };

  const appendSection = () => {
    onChange([...sections, createLessonSection()]);
  };

  return (
    <>
      <p className="admin-hint" style={{ marginBottom: "1rem" }}>
        段落のほか「＋ 画像」で図を追加できます。画像エリアをクリックして Ctrl+V
        で貼り付け、またはファイルを選択してください。セクションは ↑↓ で並べ替え、「この下に挿入」で途中に追加できます。
      </p>

      {sections.length === 0 ? (
        <button type="button" className="admin-btn" onClick={appendSection}>
          セクションを追加
        </button>
      ) : null}

      {sections.map((sec, si) => (
        <div key={sec.id} className="admin-question admin-section-card">
          <div className="admin-section-head">
            <div className="admin-section-order" aria-label="セクションの並び替え">
              <button
                type="button"
                className="admin-btn admin-btn--compact"
                disabled={si === 0}
                onClick={() => moveSection(si, -1)}
                aria-label={`${sec.heading || `セクション ${si + 1}`} を上へ`}
              >
                ↑
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--compact"
                disabled={si === sections.length - 1}
                onClick={() => moveSection(si, 1)}
                aria-label={`${sec.heading || `セクション ${si + 1}`} を下へ`}
              >
                ↓
              </button>
            </div>
            <div className="admin-field admin-section-heading-field">
              <label htmlFor={`section-heading-${sec.id}`}>
                見出し（セクション {si + 1}）
              </label>
              <input
                id={`section-heading-${sec.id}`}
                value={sec.heading}
                onChange={(e) => updateSection(si, { heading: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--danger admin-btn--compact"
              onClick={() => removeSection(si)}
              aria-label={`${sec.heading || `セクション ${si + 1}`} を削除`}
            >
              セクション削除
            </button>
          </div>

          <LessonSectionEditor
            contentId={contentId}
            workspaceId={workspaceId}
            workspace={workspace}
            section={sec}
            onChange={(next) => updateSection(si, next)}
          />

          <div className="admin-section-insert">
            <button
              type="button"
              className="admin-btn admin-btn--compact"
              onClick={() => insertAfter(si)}
            >
              この下にセクションを挿入
            </button>
          </div>
        </div>
      ))}

      {sections.length > 0 ? (
        <button type="button" className="admin-btn" onClick={appendSection}>
          末尾にセクションを追加
        </button>
      ) : null}
    </>
  );
}
