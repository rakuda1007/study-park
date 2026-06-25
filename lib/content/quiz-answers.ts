import { defaultQuizBlankMarker, quizBlankMarkerForInsert } from "./quiz-markers";

/** 新規空欄の正答デフォルト（未入力） */
export const DEFAULT_QUIZ_BLANK_ANSWERS: string[] = [];

/** 旧デフォルト正答（①の空欄に自動設定されていた値） */
export const LEGACY_DEFAULT_FIRST_BLANK_ANSWER = "答え";

export function isFirstQuizBlankMarker(marker: string): boolean {
  return (
    marker === defaultQuizBlankMarker(0) || marker === quizBlankMarkerForInsert(0)
  );
}

/** 読み込み時に旧デフォルト正答を空へ正規化 */
export function normalizeBlankAnswerList(answers: string[], marker: string): string[] {
  if (
    isFirstQuizBlankMarker(marker) &&
    answers.length === 1 &&
    answers[0] === LEGACY_DEFAULT_FIRST_BLANK_ANSWER
  ) {
    return DEFAULT_QUIZ_BLANK_ANSWERS;
  }
  return answers;
}

/** 別解の区切り文字（半角カンマのみ。読点「、」は正答本文に使える） */
export const BLANK_ANSWER_ALT_SEPARATOR = ",";

/** 空欄の別解リストを編集用の1文字列に */
export function blankAnswersToInput(answers: string[]): string {
  return answers.join(BLANK_ANSWER_ALT_SEPARATOR);
}

/** 別解1件の前後のスペース・タブのみ除去（改行は保持） */
function trimBlankAnswerSegment(segment: string): string {
  return segment.replace(/^[ \t]+|[ \t]+$/g, "");
}

/** 編集欄の文字列を別解リストに（半角カンマ区切り。読点「、」は分割しない） */
export function parseBlankAnswersInput(value: string): string[] {
  return value
    .split(BLANK_ANSWER_ALT_SEPARATOR)
    .map(trimBlankAnswerSegment)
    .filter((a) => a.length > 0);
}
