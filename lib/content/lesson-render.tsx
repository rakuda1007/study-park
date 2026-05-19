import type { ReactNode } from "react";
import type { LessonBlock } from "./types";

/** 段落内の **太字** を React ノードに展開 */
export function renderParagraphText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function lessonBlockKey(sectionId: string, index: number, block: LessonBlock): string {
  if (block.kind === "image") return `${sectionId}-img-${index}-${block.src.slice(-24)}`;
  if (block.kind === "html") return `${sectionId}-html-${index}`;
  return `${sectionId}-p-${index}`;
}
