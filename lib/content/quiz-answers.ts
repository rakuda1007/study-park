/** 空欄の別解リストを編集用の1文字列に */
export function blankAnswersToInput(answers: string[]): string {
  return answers.join("、");
}

/** 編集欄の文字列を別解リストに（カンマ・読点区切り） */
export function parseBlankAnswersInput(value: string): string[] {
  return value
    .split(/[,、]/)
    .map((a) => a.trim())
    .filter(Boolean);
}
