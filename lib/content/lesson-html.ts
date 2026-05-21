import type { LessonBlock } from "./types";
import { richTextToHtml } from "./rich-text";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { paragraphToHtml, richTextToHtml, inlineTextToHtml } from "./rich-text";

export function lessonBlockToHtml(b: LessonBlock): string {
  if (b.kind === "html") return `        ${b.html}`;
  if (b.kind === "image") {
    if (!b.src.trim()) return "";
    const alt = escHtml(b.alt ?? "");
    const cap = b.caption
      ? `\n          <figcaption class="lesson-figure-caption">${escHtml(b.caption)}</figcaption>`
      : "";
    return `        <figure class="lesson-figure">
          <img src="${escHtml(b.src)}" alt="${alt}" class="lesson-figure-img" loading="lazy" />${cap}
        </figure>`;
  }
  return `        ${richTextToHtml(b.text, "lesson-body")}`;
}
