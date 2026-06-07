/** 挿入可能な丸数字空欄記号の数（①〜⑳） */
export const QUIZ_BLANK_MARKER_COUNT = 20;

/** 空欄記号のデフォルト（0 → ①, 1 → ②, …） */
export function defaultQuizBlankMarker(index: number): string {
  if (index >= 0 && index < QUIZ_BLANK_MARKER_COUNT) {
    return String.fromCodePoint(0x2460 + index);
  }
  return `（${index + 1}）`;
}

/** エディタの空欄記号挿入用（①〜⑳） */
export function listQuizBlankMarkers(count = QUIZ_BLANK_MARKER_COUNT): string[] {
  return Array.from({ length: count }, (_, i) => defaultQuizBlankMarker(i));
}
