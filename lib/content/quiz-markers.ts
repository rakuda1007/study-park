/** 空欄記号のデフォルト（0 → ①, 1 → ②, …） */
export function defaultQuizBlankMarker(index: number): string {
  if (index >= 0 && index < 20) {
    return String.fromCodePoint(0x2460 + index);
  }
  return `（${index + 1}）`;
}
