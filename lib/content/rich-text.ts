/**
 * 段落用の簡易リッチテキスト（管理画面で入力）
 * - **太字**
 * - __下線__
 * - ^^大きい文字^^
 * - <<小さい文字>>
 * - 行頭の「- 」または「・ 」で箇条書き（連続行は1つのリスト）
 */

export const RICH_TEXT_HELP =
  "**太字**、__下線__、^^大きい^^、<<小さい>>。箇条書きは行頭に「- 」または「・ 」。空行で段落の間隔をあけられます。";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INLINE_RE = /(\*\*[^*]+\*\*|__[^_]+__|\^\^[^\^]+\^\^|<<[^>]+>>)/g;

/** 1行分のインライン装飾を HTML に */
export function inlineTextToHtml(text: string): string {
  if (!text) return "";
  const parts = text.split(INLINE_RE);
  return parts
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return `<strong>${escHtml(part.slice(2, -2))}</strong>`;
      }
      if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
        return `<span class="rich-text-underline">${escHtml(part.slice(2, -2))}</span>`;
      }
      if (part.startsWith("^^") && part.endsWith("^^") && part.length > 4) {
        return `<span class="rich-text-large">${escHtml(part.slice(2, -2))}</span>`;
      }
      if (part.startsWith("<<") && part.endsWith(">>") && part.length > 4) {
        return `<span class="rich-text-small">${escHtml(part.slice(2, -2))}</span>`;
      }
      return escHtml(part);
    })
    .join("");
}

type LineBlock =
  | { kind: "p"; line: string }
  | { kind: "ul"; items: string[] }
  | { kind: "gap" };

function isBulletLine(line: string): boolean {
  return /^[-・]\s/.test(line.trim());
}

function bulletItemText(line: string): string {
  return line.trim().replace(/^[-・]\s+/, "");
}

/** 改行区切りテキストを段落・リストに分割 */
export function splitRichLines(text: string): LineBlock[] {
  const lines = text.split("\n");
  const blocks: LineBlock[] = [];
  let bulletItems: string[] = [];

  const flushBullets = () => {
    if (bulletItems.length > 0) {
      blocks.push({ kind: "ul", items: bulletItems });
      bulletItems = [];
    }
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      bulletItems.push(bulletItemText(line));
      continue;
    }
    flushBullets();
    if (line.trim() === "") {
      blocks.push({ kind: "gap" });
    } else {
      blocks.push({ kind: "p", line });
    }
  }
  flushBullets();
  return blocks;
}

/** 段落テキスト全体を HTML 断片に（p / ul） */
export function richTextToHtml(text: string, paragraphClass = "lesson-body"): string {
  const blocks = splitRichLines(text);
  if (blocks.length === 0) return "";

  return blocks
    .map((block) => {
      if (block.kind === "ul") {
        const items = block.items
          .map((item) => `<li>${inlineTextToHtml(item)}</li>`)
          .join("");
        return `<ul class="rich-list">${items}</ul>`;
      }
      if (block.kind === "gap") {
        return `<p class="rich-text-gap" aria-hidden="true"></p>`;
      }
      return `<p class="${paragraphClass}">${inlineTextToHtml(block.line)}</p>`;
    })
    .join("\n");
}

/** 旧 API 互換（単一段落・インラインのみ） */
export function paragraphToHtml(text: string): string {
  return richTextToHtml(text);
}
