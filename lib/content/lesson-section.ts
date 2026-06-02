import type { LessonSection } from "./types";

/** 新規セクション（一意 id） */
export function createLessonSection(heading = "新しいセクション"): LessonSection {
  const id = `section-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    heading,
    blocks: [{ kind: "paragraph", text: "" }],
  };
}

/** 指定位置にセクションを挿入（index は挿入後の配列内位置） */
export function insertLessonSection(
  sections: LessonSection[],
  atIndex: number,
  section?: LessonSection,
): LessonSection[] {
  const next = [...sections];
  const i = Math.max(0, Math.min(atIndex, next.length));
  next.splice(i, 0, section ?? createLessonSection());
  return next;
}

/** セクションを1つ上下に移動 */
export function moveLessonSection(
  sections: LessonSection[],
  index: number,
  direction: -1 | 1,
): LessonSection[] {
  const j = index + direction;
  if (j < 0 || j >= sections.length) return sections;
  const next = [...sections];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}
