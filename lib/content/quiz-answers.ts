/** 空欄の別解リストを編集用の1文字列に */
export function blankAnswersToInput(answers: string[]): string {
  return answers.join("、");
}

/** 別解1件の前後のスペース・タブのみ除去（改行は保持） */
function trimBlankAnswerSegment(segment: string): string {
  return segment.replace(/^[ \t]+|[ \t]+$/g, "");
}

/** 編集欄の文字列を別解リストに（カンマ・読点区切り） */
export function parseBlankAnswersInput(value: string): string[] {
  return value
    .split(/[,、]/)
    .map(trimBlankAnswerSegment)
    .filter((a) => a.length > 0);
}
