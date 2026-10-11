import { DEFAULT_QUIZ_BLANK_ANSWERS, normalizeBlankAnswerList } from "./quiz-answers";
import type { BlankAnswer, LessonBlock, QuizQuestion } from "./types";

/** 新規クイズ問題の本文デフォルト（空欄記号はエディタから挿入） */
export const DEFAULT_QUIZ_QUESTION_BODY = "";

/** 旧デフォルト本文（読み込み時に空へ正規化する） */
export const LEGACY_DEFAULT_QUIZ_QUESTION_BODY = "①②③④⑤⑥⑦⑧";

export function stripLegacyDefaultQuizBody(text: string): string {
  return text === LEGACY_DEFAULT_QUIZ_QUESTION_BODY ? "" : text;
}

function normalizeParagraphBlocks(blocks: LessonBlock[]): LessonBlock[] {
  return blocks.map((block) =>
    block.kind === "paragraph"
      ? { ...block, text: stripLegacyDefaultQuizBody(block.text) }
      : block,
  );
}

/** 段落ブロックから template 文字列を生成（空欄記号は段落内に含める） */
export function templateFromBlocks(blocks: LessonBlock[]): string {
  return blocks
    .filter((b): b is Extract<LessonBlock, { kind: "paragraph" }> => b.kind === "paragraph")
    .map((b) => b.text)
    .join("\n\n");
}

const QUIZ_MON_LABEL_PATTERN = /^問\s*([0-9０-９]+)\s*$/;

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

function toFullWidthDigits(value: string): string {
  return value.replace(/[0-9]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0xfee0),
  );
}

/** 直前のラベルから、追加する問題のラベルを決める */
export function nextQuizQuestionLabel(previousLabel: string | undefined): string {
  const prev = previousLabel?.trim() ?? "";
  const match = prev.match(QUIZ_MON_LABEL_PATTERN);
  if (!match) {
    return "問１";
  }
  const rawNum = match[1];
  const useFullWidth = /[０-９]/.test(rawNum);
  const current = Number.parseInt(toHalfWidthDigits(rawNum), 10);
  if (!Number.isFinite(current) || current < 0) {
    return "問１";
  }
  const next = String(current + 1);
  return `問${useFullWidth ? toFullWidthDigits(next) : next}`;
}

/** ラベル「問N」から番号を取り出す（取れなければ fallback） */
export function quizQuestionNumberFromLabel(label: string, fallback: number): number {
  const match = label.trim().match(QUIZ_MON_LABEL_PATTERN);
  if (!match) return fallback;
  const n = Number.parseInt(toHalfWidthDigits(match[1]), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeQuizQuestionBlanks(q: QuizQuestion): QuizQuestion {
  if (!q.blanks?.length) return q;
  return {
    ...q,
    blanks: q.blanks.map((blank) => ({
      ...blank,
      answers: normalizeBlankAnswerList(blank.answers, blank.marker),
    })),
  };
}

export function normalizeQuizQuestion(q: QuizQuestion): QuizQuestion {
  if (q.blocks && q.blocks.length > 0) {
    const blocks = normalizeParagraphBlocks(q.blocks);
    const template = templateFromBlocks(blocks) || stripLegacyDefaultQuizBody(q.template);
    return normalizeQuizQuestionBlanks({ ...q, blocks, template });
  }
  const text = stripLegacyDefaultQuizBody(q.template);
  return normalizeQuizQuestionBlanks({
    ...q,
    template: text,
    blocks: [{ kind: "paragraph", text }],
  });
}

/** 本文に出ている丸数字空欄を、出現順・重複なしで返す */
export function quizCircledMarkersInText(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(/[①-⑳]/gu)) {
    const marker = match[0];
    if (seen.has(marker)) continue;
    seen.add(marker);
    found.push(marker);
  }
  return found;
}

function bareCircledMarker(marker: string): string {
  return marker.replace(/[「」]/g, "");
}

function isCircledMarker(marker: string): boolean {
  const bare = bareCircledMarker(marker);
  return /^[①-⑳]$/u.test(bare);
}

/**
 * 本文の空欄記号に答え欄を合わせる。
 * 本文にあった記号が消えたときだけ、その答え欄を外す。
 * 本文に一度も出ていない既存の答え欄は残す。
 */
export function syncQuizBlanksFromBodyChange(
  blanks: BlankAnswer[],
  previousText: string,
  nextText: string,
): BlankAnswer[] {
  const previousMarkers = new Set(quizCircledMarkersInText(previousText));
  const nextMarkers = quizCircledMarkersInText(nextText);
  const nextSet = new Set(nextMarkers);
  const byMarker = new Map(blanks.map((blank) => [bareCircledMarker(blank.marker), blank]));

  const synced = nextMarkers.map((marker) => {
    const existing = byMarker.get(marker);
    return existing
      ? { ...existing, marker }
      : { marker, answers: [...DEFAULT_QUIZ_BLANK_ANSWERS] };
  });

  const untouched = blanks.filter((blank) => {
    const id = bareCircledMarker(blank.marker);
    if (!isCircledMarker(blank.marker)) return true;
    return !nextSet.has(id) && !previousMarkers.has(id);
  });

  return [...synced, ...untouched];
}

export function prepareQuizQuestionForSave(q: QuizQuestion): QuizQuestion {
  const blocks =
    q.blocks && q.blocks.length > 0
      ? q.blocks
      : [{ kind: "paragraph" as const, text: q.template }];
  return {
    ...q,
    blocks,
    template: templateFromBlocks(blocks) || q.template,
  };
}
