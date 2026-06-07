"use client";

import { useEffect, useRef, useState } from "react";
import { RichTextContent } from "@/lib/content/rich-text-react";
import { RICH_TEXT_HELP } from "@/lib/content/rich-text";
import { listQuizBlankMarkersForInsert } from "@/lib/content/quiz-markers";

/** ツールバーに並べる空欄記号の数（①〜⑮） */
const VISIBLE_QUIZ_BLANK_MARKER_COUNT = 15;

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  previewClass?: string;
  /** プレビュー機能を有効にする（ボタンで表示切替。常時表示にはしない） */
  showPreview?: boolean;
  /** 右下をドラッグして入力欄の大きさを変えられる */
  resizable?: boolean;
  /** 記法のヒント文を表示する */
  showHint?: boolean;
  /** 空欄記号（①②…）の挿入 UI を表示する */
  showBlankMarkers?: boolean;
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

function insertAtRange(
  textarea: HTMLTextAreaElement | null,
  value: string,
  onChange: (v: string) => void,
  insert: string,
  start: number,
  end: number,
) {
  const next = value.slice(0, start) + insert + value.slice(end);
  onChange(next);
  const pos = start + insert.length;
  requestAnimationFrame(() => {
    textarea?.focus();
    textarea?.setSelectionRange(pos, pos);
  });
  return { start: pos, end: pos };
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
  showHint = true,
  showBlankMarkers = false,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!value.trim()) setPreviewOpen(false);
  }, [value]);

  const captureSelection = () => {
    const ta = ref.current;
    if (!ta) return;
    selectionRef.current = {
      start: ta.selectionStart,
      end: ta.selectionEnd,
    };
  };

  const insertBlankMarker = (marker: string) => {
    const { start, end } = selectionRef.current;
    const nextPos = insertAtRange(ref.current, value, onChange, marker, start, end);
    selectionRef.current = nextPos;
  };

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
          <div className="admin-rich-format-group">
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
          {showBlankMarkers ? (
            <div className="admin-rich-marker-group" role="group" aria-label="空欄記号">
              {listQuizBlankMarkersForInsert(VISIBLE_QUIZ_BLANK_MARKER_COUNT).map((marker) => (
                <button
                  key={marker}
                  type="button"
                  className="admin-btn admin-btn--compact admin-rich-marker-btn"
                  title={`空欄記号 ${marker} を挿入`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertBlankMarker(marker)}
                >
                  {marker}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <textarea
          id={id}
          ref={ref}
          className={resizable ? "admin-rich-textarea--resizable" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={captureSelection}
          onKeyUp={captureSelection}
          onMouseUp={captureSelection}
          onClick={captureSelection}
          onFocus={captureSelection}
          rows={rows}
        />
        {showHint ? <p className="admin-field-hint">{RICH_TEXT_HELP}</p> : null}
        {showPreview && value.trim() ? (
          <button
            type="button"
            className="admin-btn admin-btn--compact admin-rich-preview-toggle"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((open) => !open)}
          >
            {previewOpen ? "プレビューを隠す" : "プレビューを表示"}
          </button>
        ) : null}
      </div>
      {showPreview && previewOpen && value.trim() ? (
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
