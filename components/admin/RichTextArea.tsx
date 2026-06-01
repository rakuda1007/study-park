"use client";

import { useRef } from "react";
import { RichTextContent } from "@/lib/content/rich-text-react";
import { RICH_TEXT_HELP } from "@/lib/content/rich-text";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  previewClass?: string;
  /** プレビュー欄を表示しない（コンパクトな行内編集向け） */
  showPreview?: boolean;
  /** 右下をドラッグして入力欄の大きさを変えられる */
  resizable?: boolean;
};

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  before: string,
  after: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(next);
  const pos = start + before.length + selected.length + after.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
}

function insertBulletLine(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const before = value.slice(0, start);
  const lineStart = before.lastIndexOf("\n") + 1;
  const prefix = before.slice(lineStart);
  const insert = prefix.trim() === "" ? "- " : "\n- ";
  const next = value.slice(0, start) + insert + value.slice(start);
  onChange(next);
  const pos = start + insert.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
}

export function RichTextArea({
  id,
  label,
  value,
  onChange,
  rows = 4,
  previewClass = "lesson-body",
  showPreview = true,
  resizable = false,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const run = (fn: (ta: HTMLTextAreaElement) => void) => {
    const ta = ref.current;
    if (!ta) return;
    fn(ta);
  };

  return (
    <div className="admin-rich-text">
      <div className="admin-field">
        <label htmlFor={id}>{label}</label>
        <div className="admin-rich-toolbar" role="toolbar" aria-label="書式">
          <button
            type="button"
            className="admin-btn admin-btn--compact"
            title="太字（**文字**）"
            onClick={() =>
              run((ta) => wrapSelection(ta, value, onChange, "**", "**"))
            }
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--compact"
            title="下線（__文字__）"
            onClick={() =>
              run((ta) => wrapSelection(ta, value, onChange, "__", "__"))
            }
          >
            <span className="rich-text-underline">U</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--compact"
            title="大きい文字（^^文字^^）"
            onClick={() =>
              run((ta) => wrapSelection(ta, value, onChange, "^^", "^^"))
            }
          >
            <span className="rich-text-large">大</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--compact"
            title="小さい文字（<<文字>>）"
            onClick={() =>
              run((ta) => wrapSelection(ta, value, onChange, "<<", ">>"))
            }
          >
            <span className="rich-text-small">小</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--compact"
            title="箇条書き（行頭に - ）"
            onClick={() => run((ta) => insertBulletLine(ta, value, onChange))}
          >
            ・リスト
          </button>
        </div>
        <textarea
          id={id}
          ref={ref}
          className={resizable ? "admin-rich-textarea--resizable" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
        />
        <p className="admin-field-hint">{RICH_TEXT_HELP}</p>
      </div>
      {showPreview && value.trim() ? (
        <div className="admin-rich-preview" aria-label="プレビュー">
          <p className="admin-rich-preview-label">プレビュー</p>
          <div className="admin-rich-preview-body">
            <RichTextContent text={value} paragraphClass={previewClass} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
