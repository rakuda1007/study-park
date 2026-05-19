import type { LessonBlock } from "./types";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function paragraphToHtml(text: string): string {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return `<strong>${escHtml(part.slice(2, -2))}</strong>`;
      }
      return escHtml(part);
    })
    .join("");
}

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
  return `        <p class="lesson-body">${paragraphToHtml(b.text)}</p>`;
}
