"use client";

import { useId, useState } from "react";
import {
  buildScopeNote,
  emptyScopeFields,
  freePlaceholder,
  parseScopeNote,
  sanitizeScopeNumber,
  type StudyScopeFields,
  type StudyScopeFormat,
} from "@/lib/study/scope-note";

type Props = {
  value: string;
  onChange: (scopeNote: string) => void;
  /** マスタ単位などから決めた初期書式（value が空のときに適用） */
  preferredFormat?: StudyScopeFormat;
  /** 自由入力時のプレースホルダ用 */
  unitHint?: string;
  className?: string;
};

const FORMAT_OPTIONS: { id: StudyScopeFormat; label: string }[] = [
  { id: "lesson", label: "回" },
  { id: "pages", label: "ページ" },
  { id: "free", label: "自由" },
];

function fieldsFromProps(
  value: string,
  preferredFormat?: StudyScopeFormat,
): StudyScopeFields {
  if (value.trim()) return parseScopeNote(value);
  return emptyScopeFields(preferredFormat ?? "free");
}

export function StudyScopeNoteInput({
  value,
  onChange,
  preferredFormat,
  unitHint,
  className,
}: Props) {
  const baseId = useId();
  const [fields, setFields] = useState<StudyScopeFields>(() =>
    fieldsFromProps(value, preferredFormat),
  );

  function emit(next: StudyScopeFields) {
    setFields(next);
    onChange(buildScopeNote(next));
  }

  function setFormat(format: StudyScopeFormat) {
    if (format === fields.format) return;
    emit(emptyScopeFields(format));
  }

  const preview = buildScopeNote(fields);
  const showPreview = fields.format !== "free" && preview.length > 0;
  const pageOrderErr =
    fields.format === "pages" &&
    sanitizeScopeNumber(fields.pageFrom) &&
    sanitizeScopeNumber(fields.pageTo) &&
    Number(sanitizeScopeNumber(fields.pageFrom)) >
      Number(sanitizeScopeNumber(fields.pageTo))
      ? "開始ページは終了ページ以下にしてください。"
      : null;

  return (
    <div className={`study-scope-input ${className ?? ""}`.trim()}>
      <span className="admin-label" id={`${baseId}-label`}>
        対象範囲
      </span>

      <div
        className="study-scope-input__formats"
        role="group"
        aria-labelledby={`${baseId}-label`}
      >
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={
              fields.format === opt.id
                ? "study-scope-input__format study-scope-input__format--active"
                : "study-scope-input__format"
            }
            aria-pressed={fields.format === opt.id}
            onClick={() => setFormat(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {fields.format === "lesson" ? (
        <div className="study-scope-input__affix-row">
          <span className="study-scope-input__affix" aria-hidden>
            第
          </span>
          <input
            className="admin-input study-scope-input__num"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            aria-label="回の番号"
            value={fields.lessonNum}
            onChange={(e) =>
              emit({
                ...fields,
                lessonNum: sanitizeScopeNumber(e.target.value),
              })
            }
            placeholder="3"
          />
          <span className="study-scope-input__affix" aria-hidden>
            回
          </span>
        </div>
      ) : null}

      {fields.format === "pages" ? (
        <div className="study-scope-input__affix-row">
          <span className="study-scope-input__affix" aria-hidden>
            P
          </span>
          <input
            className="admin-input study-scope-input__num"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            aria-label="開始ページ"
            value={fields.pageFrom}
            onChange={(e) =>
              emit({
                ...fields,
                pageFrom: sanitizeScopeNumber(e.target.value),
              })
            }
            placeholder="12"
          />
          <span className="study-scope-input__affix" aria-hidden>
            ～
          </span>
          <span className="study-scope-input__affix" aria-hidden>
            P
          </span>
          <input
            className="admin-input study-scope-input__num"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            aria-label="終了ページ（任意）"
            value={fields.pageTo}
            onChange={(e) =>
              emit({
                ...fields,
                pageTo: sanitizeScopeNumber(e.target.value),
              })
            }
            placeholder="20"
          />
        </div>
      ) : null}

      {fields.format === "free" ? (
        <input
          className="admin-input"
          value={fields.freeText}
          onChange={(e) => emit({ ...fields, freeText: e.target.value })}
          placeholder={freePlaceholder(unitHint)}
          aria-labelledby={`${baseId}-label`}
        />
      ) : null}

      {fields.format === "pages" && !preview && !pageOrderErr ? (
        <p className="study-scope-input__preview">終了ページは省略できます</p>
      ) : null}
      {showPreview && !pageOrderErr ? (
        <p className="study-scope-input__preview">表示: {preview}</p>
      ) : null}
      {pageOrderErr ? <p className="admin-err study-scope-input__err">{pageOrderErr}</p> : null}
    </div>
  );
}
