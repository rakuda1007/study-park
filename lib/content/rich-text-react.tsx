import type { ReactNode } from "react";
import { splitRichLines } from "./rich-text";

const INLINE_RE = /(\*\*[^*]+\*\*|__[^_]+__|\^\^[^\^]+\^\^|<<[^>]+>>)/g;

function inlineTextToReact(text: string): ReactNode[] {
  if (!text) return [];
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      return (
        <span key={i} className="rich-text-underline">
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("^^") && part.endsWith("^^") && part.length > 4) {
      return (
        <span key={i} className="rich-text-large">
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("<<") && part.endsWith(">>") && part.length > 4) {
      return (
        <span key={i} className="rich-text-small">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

type Props = {
  text: string;
  paragraphClass?: string;
};

/** プレビュー・レッスン表示用 */
export function RichTextContent({ text, paragraphClass = "lesson-body" }: Props) {
  const blocks = splitRichLines(text);
  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, bi) => {
        if (block.kind === "ul") {
          return (
            <ul key={`ul-${bi}`} className="rich-list">
              {block.items.map((item, ii) => (
                <li key={`li-${bi}-${ii}`}>{inlineTextToReact(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "gap") {
          return <p key={`gap-${bi}`} className="rich-text-gap" aria-hidden="true" />;
        }
        return (
          <p key={`p-${bi}`} className={paragraphClass}>
            {inlineTextToReact(block.line)}
          </p>
        );
      })}
    </>
  );
}
