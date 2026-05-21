import type { ReactNode } from "react";
import type { LessonBlock } from "./types";
import { RichTextContent } from "./rich-text-react";

/** @deprecated RichTextContent を使用 */
export function renderParagraphText(text: string): ReactNode {
  return <RichTextContent text={text} />;
}

export function lessonBlockKey(sectionId: string, index: number, block: LessonBlock): string {
  if (block.kind === "image") return `${sectionId}-img-${index}-${block.src.slice(-24)}`;
  if (block.kind === "html") return `${sectionId}-html-${index}`;
  return `${sectionId}-p-${index}`;
}
