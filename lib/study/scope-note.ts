/** 対象範囲の入力書式 */
export type StudyScopeFormat = "lesson" | "pages" | "free";

export type StudyScopeFields = {
  format: StudyScopeFormat;
  lessonNum: string;
  pageFrom: string;
  pageTo: string;
  freeText: string;
};

/** よく使う教材マスタの「単位」候補 */
export const STUDY_SCOPE_UNIT_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "", label: "なし（自由）" },
  { value: "回", label: "回（第〇回）" },
  { value: "ページ", label: "ページ（Pxx～Pyy）" },
  { value: "問", label: "問" },
  { value: "単元", label: "単元" },
];

export function emptyScopeFields(format: StudyScopeFormat = "free"): StudyScopeFields {
  return {
    format,
    lessonNum: "",
    pageFrom: "",
    pageTo: "",
    freeText: "",
  };
}

/** マスタの単位から初期書式を決める */
export function formatFromUnit(unit?: string): StudyScopeFormat {
  const u = (unit ?? "").trim();
  if (!u) return "free";
  if (u === "ページ" || u.includes("ページ") || /^p\.?$/i.test(u)) return "pages";
  if (u === "回" || u.includes("回") || u.includes("第")) return "lesson";
  return "free";
}

export function freePlaceholder(unit?: string): string {
  if (unit === "ページ") return "例: P12～P20";
  if (unit === "問") return "例: 問1～10";
  if (unit === "単元") return "例: 第3単元";
  if (unit === "回") return "例: 第3回";
  if (unit) return `例: ${unit}を入力`;
  return "例: 全問、第1章まとめ";
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function sanitizeScopeNumber(raw: string): string {
  return digitsOnly(raw);
}

/** 入力欄の値から保存用 scopeNote 文字列を生成 */
export function buildScopeNote(fields: StudyScopeFields): string {
  if (fields.format === "lesson") {
    const n = sanitizeScopeNumber(fields.lessonNum);
    return n ? `第${n}回` : "";
  }
  if (fields.format === "pages") {
    const from = sanitizeScopeNumber(fields.pageFrom);
    const to = sanitizeScopeNumber(fields.pageTo);
    if (!from) return "";
    if (!to) return `P${from}`;
    return `P${from}～P${to}`;
  }
  return fields.freeText.trim();
}

/** 既存文字列を書式UI用に分解（一致しなければ自由入力） */
export function parseScopeNote(text: string): StudyScopeFields {
  const raw = text.trim();
  if (!raw) return emptyScopeFields("free");

  const lesson = /^第(\d+)回$/.exec(raw);
  if (lesson) {
    return { ...emptyScopeFields("lesson"), lessonNum: lesson[1] };
  }

  const pageRange = /^[Pp](\d+)\s*[～〜\-–−~－]\s*[Pp]?(\d+)$/.exec(raw);
  if (pageRange) {
    return {
      ...emptyScopeFields("pages"),
      pageFrom: pageRange[1],
      pageTo: pageRange[2],
    };
  }

  const pageOne = /^[Pp](\d+)$/.exec(raw);
  if (pageOne) {
    return { ...emptyScopeFields("pages"), pageFrom: pageOne[1] };
  }

  return { ...emptyScopeFields("free"), freeText: raw };
}

export function validateScopeFields(
  fields: StudyScopeFields,
  options?: { required?: boolean },
): string | null {
  const required = options?.required ?? false;

  if (fields.format === "lesson") {
    if (!sanitizeScopeNumber(fields.lessonNum)) {
      return required ? "回の番号を入力してください。" : null;
    }
    return null;
  }

  if (fields.format === "pages") {
    const from = sanitizeScopeNumber(fields.pageFrom);
    const to = sanitizeScopeNumber(fields.pageTo);
    if (!from) {
      return required ? "開始ページを入力してください。" : null;
    }
    if (to && Number(from) > Number(to)) {
      return "開始ページは終了ページ以下にしてください。";
    }
    return null;
  }

  if (required && !fields.freeText.trim()) {
    return "対象範囲を入力してください。";
  }
  return null;
}

/** 保存済み文字列向けの検証（送信時など） */
export function validateScopeNoteText(
  scopeNote: string,
  options?: { required?: boolean },
): string | null {
  const required = options?.required ?? false;
  const trimmed = scopeNote.trim();
  if (!trimmed) {
    return required ? "対象範囲を入力してください。" : null;
  }
  return validateScopeFields(parseScopeNote(trimmed), { required: false });
}
