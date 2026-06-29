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

/** 旧データ互換: 複数別解が配列で保存されていたときの連結用 */
export const BLANK_ANSWER_ALT_SEPARATOR = ",";

/** 空欄の正答を編集用の1文字列に（カンマを含む本文はそのまま保持） */
export function blankAnswersToInput(answers: string[]): string {
  if (answers.length === 0) return "";
  if (answers.length === 1) return answers[0];
  return answers.join(BLANK_ANSWER_ALT_SEPARATOR);
}

/** 前後のスペース・タブのみ除去（改行・カンマは保持） */
function trimBlankAnswerInput(value: string): string {
  return value.replace(/^[ \t]+|[ \t]+$/g, "");
}

/** 編集欄の文字列を正答リストに（入力全体を1つの答えとして扱う） */
export function parseBlankAnswersInput(value: string): string[] {
  const trimmed = trimBlankAnswerInput(value);
  return trimmed.length > 0 ? [trimmed] : [];
}
